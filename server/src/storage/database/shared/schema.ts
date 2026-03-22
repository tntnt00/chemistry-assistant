import { pgTable, serial, timestamp, varchar, text, boolean, integer, jsonb, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { createSchemaFactory } from "drizzle-zod"
import { z } from "zod"

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
})

// 答题记录表
export const answerRecords = pgTable(
  "answer_records",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    questionId: varchar("question_id", { length: 36 }).notNull(),
    questionData: jsonb("question_data").notNull(),
    userAnswer: text("user_answer").notNull(),
    correctAnswer: text("correct_answer").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    mode: varchar("mode", { length: 20 }).notNull(), // 'preview' 或 'review'
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("answer_records_user_id_idx").on(table.userId),
    index("answer_records_question_id_idx").on(table.questionId),
    index("answer_records_mode_idx").on(table.mode),
  ]
)

// 错题本表
export const wrongQuestions = pgTable(
  "wrong_questions",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    questionId: varchar("question_id", { length: 36 }).notNull(),
    questionData: jsonb("question_data").notNull(),
    similarQuestion: jsonb("similar_question"), // 同类型题目
    consecutiveCorrect: integer("consecutive_correct").notNull().default(0), // 连续答对次数
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("wrong_questions_user_id_idx").on(table.userId),
    index("wrong_questions_question_id_idx").on(table.questionId),
  ]
)

// Zod schemas for validation
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
})

export const insertAnswerRecordSchema = createCoercedInsertSchema(answerRecords).pick({
  userId: true,
  questionId: true,
  questionData: true,
  userAnswer: true,
  correctAnswer: true,
  isCorrect: true,
  mode: true,
})

export const updateWrongQuestionSchema = createCoercedInsertSchema(wrongQuestions)
  .pick({
    consecutiveCorrect: true,
    updatedAt: true,
  })
  .partial()

// TypeScript types
export type AnswerRecord = typeof answerRecords.$inferSelect
export type InsertAnswerRecord = z.infer<typeof insertAnswerRecordSchema>
export type WrongQuestion = typeof wrongQuestions.$inferSelect
export type UpdateWrongQuestion = z.infer<typeof updateWrongQuestionSchema>
