"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionsService = void 0;
const common_1 = require("@nestjs/common");
const coze_coding_dev_sdk_1 = require("coze-coding-dev-sdk");
const supabase_client_1 = require("../storage/database/supabase-client");
let QuestionsService = class QuestionsService {
    constructor() {
        this.chapterKnowledgePoints = {
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
        const config = new coze_coding_dev_sdk_1.Config();
        this.llmClient = new coze_coding_dev_sdk_1.LLMClient(config);
        this.client = (0, supabase_client_1.getSupabaseClient)();
    }
    getRandomKnowledgePoint(chapter) {
        const knowledgePoints = this.chapterKnowledgePoints[chapter] || this.chapterKnowledgePoints['第一章'];
        const randomIndex = Math.floor(Math.random() * knowledgePoints.length);
        return knowledgePoints[randomIndex];
    }
    async generateSimilarQuestion(questionData) {
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
            const response = await this.llmClient.invoke([{ role: 'user', content: prompt }], { temperature: 0.8 }, undefined);
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('LLM 返回格式错误');
            }
            return JSON.parse(jsonMatch[0]);
        }
        catch (error) {
            console.error('生成同类型题目失败:', error);
            throw new Error('生成同类型题目失败');
        }
    }
    async getRandomQuestion(userId, mode, chapterId, sectionId, sectionName, questionCount = 5, difficulty = 'easy', req) {
        try {
            const customHeaders = req ? coze_coding_dev_sdk_1.HeaderUtils.extractForwardHeaders(req.headers) : undefined;
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
            const chapterText = sectionName || `第${chapterId}章`;
            const knowledgePoint = this.getRandomKnowledgePoint(chapterText);
            let prompt = '';
            if (mode === 'preview') {
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
            }
            else {
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
            const response = await this.llmClient.invoke([{ role: 'user', content: prompt }], { temperature: 0.7 }, undefined);
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('LLM 返回格式错误');
            }
            const questionData = JSON.parse(jsonMatch[0]);
            return {
                id: Date.now().toString(),
                ...questionData
            };
        }
        catch (error) {
            console.error('获取题目失败:', error);
            throw new common_1.NotFoundException('获取题目失败');
        }
    }
    judgeAnswerLocal(questionData, userAnswer) {
        const { type, correctAnswer } = questionData;
        const normalizeAnswer = (answer) => {
            return answer
                .split(',')
                .map(a => a.trim().toUpperCase())
                .filter(a => a)
                .sort();
        };
        const userAnswers = normalizeAnswer(userAnswer);
        const correctAnswers = normalizeAnswer(correctAnswer);
        if (type === '多选题' || type === '多选') {
            const isCorrect = userAnswers.length === correctAnswers.length &&
                userAnswers.every((ans, idx) => ans === correctAnswers[idx]);
            return {
                isCorrect,
                correctAnswer,
                correction: isCorrect ? undefined : this.generateMultiSelectCorrection(userAnswers, correctAnswers)
            };
        }
        else {
            const isCorrect = userAnswers.length === 1 && userAnswers[0] === correctAnswers[0];
            return {
                isCorrect,
                correctAnswer,
                correction: isCorrect ? undefined : `正确答案是 ${correctAnswer}`
            };
        }
    }
    generateMultiSelectCorrection(userAnswers, correctAnswers) {
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
    async judgeAnswer(userId, questionId, userAnswer, mode, questionData, req) {
        try {
            const customHeaders = req ? coze_coding_dev_sdk_1.HeaderUtils.extractForwardHeaders(req.headers) : undefined;
            if (questionData) {
                const judgeResult = this.judgeAnswerLocal(questionData, userAnswer);
                return {
                    ...judgeResult,
                    explanation: questionData.explanation || ''
                };
            }
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
            const response = await this.llmClient.invoke([{ role: 'user', content: prompt }], { temperature: 0.3 }, undefined);
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('LLM 返回格式错误');
            }
            return JSON.parse(jsonMatch[0]);
        }
        catch (error) {
            console.error('判题失败:', error);
            throw new Error('判题失败');
        }
    }
    async judgeWithLLM(questionData, userAnswer) {
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
        const response = await this.llmClient.invoke([{ role: 'user', content: prompt }], { temperature: 0.3 }, undefined);
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('LLM 返回格式错误');
        }
        return JSON.parse(jsonMatch[0]);
    }
    async recordAnswer(userId, questionId, questionData, userAnswer, correctAnswer, isCorrect, mode) {
        try {
            await this.client.from('answer_records').insert({
                user_id: userId,
                question_id: questionId,
                question_data: questionData,
                user_answer: userAnswer,
                correct_answer: correctAnswer,
                is_correct: isCorrect,
                mode: mode
            });
            if (!isCorrect) {
                const { data: existingWrong } = await this.client
                    .from('wrong_questions')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('question_id', questionId)
                    .single();
                if (!existingWrong) {
                    const similarQuestion = await this.generateSimilarQuestion(questionData);
                    await this.client.from('wrong_questions').insert({
                        user_id: userId,
                        question_id: questionId,
                        question_data: questionData,
                        similar_question: similarQuestion,
                        consecutive_correct: 0
                    });
                }
                else {
                    await this.client
                        .from('wrong_questions')
                        .update({
                        consecutive_correct: 0,
                        updated_at: new Date().toISOString()
                    })
                        .eq('id', existingWrong.id);
                }
            }
            else {
                const { data: existingWrong } = await this.client
                    .from('wrong_questions')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('question_id', questionId)
                    .single();
                if (existingWrong) {
                    const newConsecutiveCorrect = existingWrong.consecutive_correct + 1;
                    if (newConsecutiveCorrect >= 2) {
                        await this.client
                            .from('wrong_questions')
                            .delete()
                            .eq('id', existingWrong.id);
                    }
                    else {
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
        }
        catch (error) {
            console.error('记录答题失败:', error);
        }
    }
    async getWrongQuestions(userId) {
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
        }
        catch (error) {
            console.error('获取错题本失败:', error);
            return [];
        }
    }
    async getStats(userId) {
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
        }
        catch (error) {
            console.error('获取统计信息失败:', error);
            return {
                total: 0,
                correct: 0,
                wrong: 0,
                accuracy: 0
            };
        }
    }
};
exports.QuestionsService = QuestionsService;
exports.QuestionsService = QuestionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], QuestionsService);
//# sourceMappingURL=questions.service.js.map