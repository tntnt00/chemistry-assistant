"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWrongQuestionSchema = exports.insertAnswerRecordSchema = exports.wrongQuestions = exports.answerRecords = exports.healthCheck = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_zod_1 = require("drizzle-zod");
exports.healthCheck = (0, pg_core_1.pgTable)("health_check", {
    id: (0, pg_core_1.serial)().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});
exports.answerRecords = (0, pg_core_1.pgTable)("answer_records", {
    id: (0, pg_core_1.varchar)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    userId: (0, pg_core_1.varchar)("user_id", { length: 36 }).notNull(),
    questionId: (0, pg_core_1.varchar)("question_id", { length: 36 }).notNull(),
    questionData: (0, pg_core_1.jsonb)("question_data").notNull(),
    userAnswer: (0, pg_core_1.text)("user_answer").notNull(),
    correctAnswer: (0, pg_core_1.text)("correct_answer").notNull(),
    isCorrect: (0, pg_core_1.boolean)("is_correct").notNull(),
    mode: (0, pg_core_1.varchar)("mode", { length: 20 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true, mode: 'string' })
        .defaultNow()
        .notNull(),
}, (table) => [
    (0, pg_core_1.index)("answer_records_user_id_idx").on(table.userId),
    (0, pg_core_1.index)("answer_records_question_id_idx").on(table.questionId),
    (0, pg_core_1.index)("answer_records_mode_idx").on(table.mode),
]);
exports.wrongQuestions = (0, pg_core_1.pgTable)("wrong_questions", {
    id: (0, pg_core_1.varchar)("id", { length: 36 })
        .primaryKey()
        .default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    userId: (0, pg_core_1.varchar)("user_id", { length: 36 }).notNull(),
    questionId: (0, pg_core_1.varchar)("question_id", { length: 36 }).notNull(),
    questionData: (0, pg_core_1.jsonb)("question_data").notNull(),
    similarQuestion: (0, pg_core_1.jsonb)("similar_question"),
    consecutiveCorrect: (0, pg_core_1.integer)("consecutive_correct").notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)("created_at", { withTimezone: true, mode: 'string' })
        .defaultNow()
        .notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { withTimezone: true, mode: 'string' })
        .defaultNow()
        .notNull(),
}, (table) => [
    (0, pg_core_1.index)("wrong_questions_user_id_idx").on(table.userId),
    (0, pg_core_1.index)("wrong_questions_question_id_idx").on(table.questionId),
]);
const { createInsertSchema: createCoercedInsertSchema } = (0, drizzle_zod_1.createSchemaFactory)({
    coerce: { date: true },
});
exports.insertAnswerRecordSchema = createCoercedInsertSchema(exports.answerRecords).pick({
    userId: true,
    questionId: true,
    questionData: true,
    userAnswer: true,
    correctAnswer: true,
    isCorrect: true,
    mode: true,
});
exports.updateWrongQuestionSchema = createCoercedInsertSchema(exports.wrongQuestions)
    .pick({
    consecutiveCorrect: true,
    updatedAt: true,
})
    .partial();
//# sourceMappingURL=schema.js.map