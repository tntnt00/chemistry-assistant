import { Injectable, NotFoundException } from '@nestjs/common';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { Request } from 'express';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { Question, JudgeResult, Stats } from './types';

@Injectable()
export class QuestionsService {
  private llmClient: LLMClient;
  private client: ReturnType<typeof getSupabaseClient>;

  // 分析化学各章节知识点映射
  private readonly chapterKnowledgePoints = {
    '第一章': [
      '分析化学的定义和任务',
      '定量分析方法的分类',
      '分析化学的发展趋势',
      '分析过程的一般步骤',
      '分析结果的表示方法'
    ],
    '第二章': [
      '误差的基本概念',
      '系统误差和随机误差',
      '准确度和精密度',
      '有效数字及其运算规则',
      '可疑数据的取舍方法'
    ],
    '第三章': [
      '酸碱平衡的基本概念',
      '酸碱指示剂的变色原理',
      '酸碱滴定曲线',
      '酸碱标准溶液的配制与标定',
      '非水溶液酸碱滴定'
    ],
    '第四章': [
      '配位平衡的基本原理',
      'EDTA及其特性',
      '配位滴定的条件选择',
      '金属指示剂',
      '混合离子的选择性滴定'
    ],
    '第五章': [
      '氧化还原反应的基本概念',
      '氧化还原滴定曲线',
      '氧化还原指示剂',
      '常见氧化还原滴定法',
      '氧化还原预处理'
    ],
    '第六章': [
      '沉淀滴定法的基本原理',
      '银量法',
      '沉淀滴定法的应用',
      '沉淀的溶解度与溶度积',
      '沉淀滴定法的终点指示'
    ],
    '第七章': [
      '重量分析法的基本原理',
      '沉淀的形成与纯净度',
      '沉淀条件的选择',
      '重量分析法的操作步骤',
      '重量分析法的应用'
    ],
    '第八章': [
      '紫外-可见吸收光谱的基本原理',
      '光的吸收定律',
      '分光光度计的构造',
      '显色反应与显色条件',
      '分光光度法的应用'
    ],
    '第九章': [
      '电化学分析法的基本原理',
      '电位分析法',
      '电流分析法',
      '电导分析法',
      '电化学滴定法'
    ],
    '第十章': [
      '色谱分析法的基本原理',
      '气相色谱法',
      '液相色谱法',
      '色谱分离条件的选择',
      '色谱分析法的应用'
    ]
  };

  constructor() {
    const config = new Config();
    this.llmClient = new LLMClient(config);
    this.client = getSupabaseClient();
  }

  /**
   * 随机获取一个知识点
   */
  private getRandomKnowledgePoint(chapter: string): string {
    const knowledgePoints = this.chapterKnowledgePoints[chapter] || this.chapterKnowledgePoints['第一章'];
    const randomIndex = Math.floor(Math.random() * knowledgePoints.length);
    return knowledgePoints[randomIndex];
  }

  /**
   * 生成同类型题目
   */
  async generateSimilarQuestion(questionData: any): Promise<any> {
    try {
      const prompt = `请基于以下题目生成一道同类型的练习题：
原题目：${questionData.content}
题型：${questionData.type}
章节：${questionData.chapter}

要求：
1. 生成一道同类型、同知识点的题目
2. 题目难度要适中，数值、条件可以变化，但知识点不变
3. 返回 JSON 格式：
{
  "chapter": "${questionData.chapter}",
  "type": "${questionData.type}",
  "content": "新题目内容",
  "options": {
    "A": "选项A",
    "B": "选项B",
    "C": "选项C",
    "D": "选项D"
  },
  "correctAnswer": "A",
  "explanation": "详细解析"
}
4. 只返回 JSON，不要其他文字说明`;

      const response = await this.llmClient.invoke(
        [{ role: 'user', content: prompt }],
        { temperature: 0.8 },
        undefined
      );

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('LLM 返回格式错误');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('生成同类型题目失败:', error);
      throw new Error('生成同类型题目失败');
    }
  }

  /**
   * 获取随机题目
   */
  async getRandomQuestion(
    userId: string,
    mode: string,
    chapterId?: string,
    sectionId?: string,
    sectionName?: string,
    questionCount: number = 5,
    difficulty: string = 'easy',
    req?: Request
  ): Promise<Question> {
    try {
      const customHeaders = req ? HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>) : undefined;

      // 如果是复习模式，优先从错题本获取
      if (mode === 'review') {
        const { data: wrongQuestions } = await this.client
          .from('wrong_questions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .limit(1);

        if (wrongQuestions && wrongQuestions.length > 0) {
          const wq = wrongQuestions[0];
          return {
            id: wq.question_id,
            chapter: wq.question_data.chapter,
            type: wq.question_data.type,
            content: wq.question_data.content,
            options: wq.question_data.options,
            correctAnswer: wq.question_data.correctAnswer,
            explanation: wq.question_data.explanation
          };
        }
      }

      // 预习模式或错题本为空时，使用 LLM 生成题目
      // 注意：实际应用中应该从知识库获取真实题目
      const chapterText = sectionName || `第${chapterId}章`;
      
      // 随机选择一个知识点，确保知识点分布均匀
      const knowledgePoint = this.getRandomKnowledgePoint(chapterText);

      // 根据模式设置不同的提示词
      let prompt = '';
      
      if (mode === 'preview') {
        // 预习模式：固定5题，低难度，侧重概念
        prompt = `请生成一道分析化学的预习练习题，题型为选择题（单选或多选）。
要求：
1. 题目要基于《分析化学学习与指导习题集》（人卫版，秋心主编）
2. 章节：${chapterText}
3. 知识点：${knowledgePoint}（题目必须紧密围绕这个知识点出题）
4. 难度：简单基础（预习模式，重点考察基本概念和定义，避免复杂计算）
5. 题目类型侧重：概念理解题（定义、分类、基本原理）占70%，简单应用题占30%
6. 题目要包含章节、题型、题干、选项（如果是选择题）、正确答案和详细解析
7. 返回 JSON 格式，格式如下：
{
  "chapter": "${chapterText}",
  "knowledgePoint": "${knowledgePoint}",
  "type": "单选题",
  "content": "题目内容",
  "options": {
    "A": "选项A",
    "B": "选项B",
    "C": "选项C",
    "D": "选项D"
  },
  "correctAnswer": "A",
  "explanation": "详细解析"
}
8. 选项和答案中的化学公式使用 Unicode 字符（如 H₂O、[H⁺]、mol/L）
9. 只返回 JSON，不要其他文字说明
10. 确保题目内容紧密围绕指定的知识点"${knowledgePoint}"，不要偏离
11. 预习模式共5题，这是第1题，请生成简单易懂的概念题`;
      } else {
        // 复习模式：中等难度，综合应用
        prompt = `请生成一道分析化学的复习练习题，题型为选择题（单选或多选）。
要求：
1. 题目要基于《分析化学学习与指导习题集》（人卫版，秋心主编）
2. 章节：${chapterText}
3. 知识点：${knowledgePoint}（题目必须紧密围绕这个知识点出题）
4. 难度：中等难度（复习模式，考察综合应用和实际应用）
5. 题目类型侧重：概念理解题占40%，应用分析题占40%，综合计算题占20%
6. 题目要包含章节、题型、题干、选项（如果是选择题）、正确答案和详细解析
7. 返回 JSON 格式，格式如下：
{
  "chapter": "${chapterText}",
  "knowledgePoint": "${knowledgePoint}",
  "type": "单选题",
  "content": "题目内容",
  "options": {
    "A": "选项A",
    "B": "选项B",
    "C": "选项C",
    "D": "选项D"
  },
  "correctAnswer": "A",
  "explanation": "详细解析"
}
8. 选项和答案中的化学公式使用 Unicode 字符（如 H₂O、[H⁺]、mol/L）
9. 只返回 JSON，不要其他文字说明
10. 确保题目内容紧密围绕指定的知识点"${knowledgePoint}"，不要偏离`;
      }

      const response = await this.llmClient.invoke(
        [{ role: 'user', content: prompt }],
        { temperature: 0.7 },
        undefined
      );

      // 解析 LLM 返回的 JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('LLM 返回格式错误');
      }

      const questionData = JSON.parse(jsonMatch[0]);

      return {
        id: Date.now().toString(),
        ...questionData
      };
    } catch (error) {
      console.error('获取题目失败:', error);
      throw new NotFoundException('获取题目失败');
    }
  }

  /**
   * 判断答案是否正确（本地判题逻辑）
   */
  private judgeAnswerLocal(questionData: any, userAnswer: string): {
    isCorrect: boolean;
    correctAnswer: string;
    correction?: string;
  } {
    const { type, correctAnswer } = questionData;

    // 处理多选题答案格式
    const normalizeAnswer = (answer: string): string[] => {
      return answer
        .split(',')
        .map(a => a.trim().toUpperCase())
        .filter(a => a)
        .sort();
    };

    const userAnswers = normalizeAnswer(userAnswer);
    const correctAnswers = normalizeAnswer(correctAnswer);

    // 根据题型判断
    if (type === '多选题' || type === '多选') {
      // 多选题：必须包含所有正确答案，且不能有错误答案
      const isCorrect = userAnswers.length === correctAnswers.length &&
        userAnswers.every((ans, idx) => ans === correctAnswers[idx]);

      return {
        isCorrect,
        correctAnswer,
        correction: isCorrect ? undefined : this.generateMultiSelectCorrection(userAnswers, correctAnswers)
      };
    } else {
      // 单选题：完全匹配
      const isCorrect = userAnswers.length === 1 && userAnswers[0] === correctAnswers[0];

      return {
        isCorrect,
        correctAnswer,
        correction: isCorrect ? undefined : `正确答案是 ${correctAnswer}`
      };
    }
  }

  /**
   * 生成多选题错误说明
   */
  private generateMultiSelectCorrection(
    userAnswers: string[],
    correctAnswers: string[]
  ): string {
    const missing = correctAnswers.filter(a => !userAnswers.includes(a));
    const extra = userAnswers.filter(a => !correctAnswers.includes(a));

    let correction = '正确答案是 ' + correctAnswers.join('、');

    if (missing.length > 0) {
      correction += `，漏选了 ${missing.join('、')}`;
    }

    if (extra.length > 0) {
      correction += `，多选了 ${extra.join('、')}`;
    }

    return correction;
  }

  /**
   * 判题
   */
  async judgeAnswer(
    userId: string,
    questionId: string,
    userAnswer: string,
    mode: string,
    questionData?: any,
    req?: Request
  ): Promise<JudgeResult> {
    try {
      const customHeaders = req ? HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>) : undefined;

      // 如果提供了题目数据，使用本地判题逻辑
      if (questionData) {
        const judgeResult = this.judgeAnswerLocal(questionData, userAnswer);

        return {
          ...judgeResult,
          explanation: questionData.explanation || ''
        };
      }

      // 否则使用 LLM 生成题目数据（临时方案）
      const prompt = `请为以下题目提供判题结果：
题目ID：${questionId}
用户答案：${userAnswer}

请返回 JSON 格式：
{
  "isCorrect": true/false,
  "correctAnswer": "正确答案",
  "correction": "错误原因说明（如果答错）",
  "explanation": "详细解析"
}`;

      const response = await this.llmClient.invoke(
        [{ role: 'user', content: prompt }],
        { temperature: 0.3 },
        undefined
      );

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('LLM 返回格式错误');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('判题失败:', error);
      throw new Error('判题失败');
    }
  }

  /**
   * 使用 LLM 进行智能判题
   */
  private async judgeWithLLM(questionData: any, userAnswer: string): Promise<JudgeResult> {
    const prompt = `请判题并给出详细解析：
题目：${questionData.content}
题型：${questionData.type}
正确答案：${questionData.correctAnswer}
用户答案：${userAnswer}
选项：${JSON.stringify(questionData.options)}

要求：
1. 判断用户答案是否正确（对于化学单位，允许大小写和格式容差；对于数值计算题，允许误差范围±0.01）
2. 如果答错，给出针对性修正提示，解释错误原因
3. 提供详细解析

返回 JSON 格式：
{
  "isCorrect": true/false,
  "correctAnswer": "${questionData.correctAnswer}",
  "correction": "错误原因说明（如果答错）",
  "explanation": "${questionData.explanation}"
}`;

    const response = await this.llmClient.invoke(
      [{ role: 'user', content: prompt }],
      { temperature: 0.3 },
      undefined
    );

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('LLM 返回格式错误');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * 记录答题
   */
  async recordAnswer(
    userId: string,
    questionId: string,
    questionData: any,
    userAnswer: string,
    correctAnswer: string,
    isCorrect: boolean,
    mode: string
  ): Promise<void> {
    try {
      // 插入答题记录
      await this.client.from('answer_records').insert({
        user_id: userId,
        question_id: questionId,
        question_data: questionData,
        user_answer: userAnswer,
        correct_answer: correctAnswer,
        is_correct: isCorrect,
        mode: mode
      });

      // 如果答错，添加到错题本
      if (!isCorrect) {
        const { data: existingWrong } = await this.client
          .from('wrong_questions')
          .select('*')
          .eq('user_id', userId)
          .eq('question_id', questionId)
          .single();

        if (!existingWrong) {
          // 新增错题，生成同类型题目
          const similarQuestion = await this.generateSimilarQuestion(questionData);

          await this.client.from('wrong_questions').insert({
            user_id: userId,
            question_id: questionId,
            question_data: questionData,
            similar_question: similarQuestion,
            consecutive_correct: 0
          });
        } else {
          // 重置连续答对次数
          await this.client
            .from('wrong_questions')
            .update({
              consecutive_correct: 0,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingWrong.id);
        }
      } else {
        // 如果答对，检查是否在错题本中
        const { data: existingWrong } = await this.client
          .from('wrong_questions')
          .select('*')
          .eq('user_id', userId)
          .eq('question_id', questionId)
          .single();

        if (existingWrong) {
          const newConsecutiveCorrect = existingWrong.consecutive_correct + 1;

          if (newConsecutiveCorrect >= 2) {
            // 连续答对2次，移除错题
            await this.client
              .from('wrong_questions')
              .delete()
              .eq('id', existingWrong.id);
          } else {
            // 更新连续答对次数
            await this.client
              .from('wrong_questions')
              .update({
                consecutive_correct: newConsecutiveCorrect,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingWrong.id);
          }
        }
      }
    } catch (error) {
      console.error('记录答题失败:', error);
      // 记录失败不影响主流程
    }
  }

  /**
   * 获取错题本
   */
  async getWrongQuestions(userId: string) {
    try {
      const { data, error } = await this.client
        .from('wrong_questions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('获取错题本失败:', error);
      return [];
    }
  }

  /**
   * 获取统计信息
   */
  async getStats(userId: string): Promise<Stats> {
    try {
      const { data: records } = await this.client
        .from('answer_records')
        .select('*')
        .eq('user_id', userId);

      if (!records || records.length === 0) {
        return {
          total: 0,
          correct: 0,
          wrong: 0,
          accuracy: 0
        };
      }

      const total = records.length;
      const correct = records.filter(r => r.is_correct).length;
      const wrong = total - correct;
      const accuracy = total > 0 ? correct / total : 0;

      return {
        total,
        correct,
        wrong,
        accuracy
      };
    } catch (error) {
      console.error('获取统计信息失败:', error);
      return {
        total: 0,
        correct: 0,
        wrong: 0,
        accuracy: 0
      };
    }
  }
}
