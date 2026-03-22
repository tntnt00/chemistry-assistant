import { Request } from 'express';
import { Question, JudgeResult, Stats } from './types';
export declare class QuestionsService {
    private llmClient;
    private client;
    private readonly chapterKnowledgePoints;
    constructor();
    private getRandomKnowledgePoint;
    generateSimilarQuestion(questionData: any): Promise<any>;
    getRandomQuestion(userId: string, mode: string, chapterId?: string, sectionId?: string, sectionName?: string, questionCount?: number, difficulty?: string, req?: Request): Promise<Question>;
    private judgeAnswerLocal;
    private generateMultiSelectCorrection;
    judgeAnswer(userId: string, questionId: string, userAnswer: string, mode: string, questionData?: any, req?: Request): Promise<JudgeResult>;
    private judgeWithLLM;
    recordAnswer(userId: string, questionId: string, questionData: any, userAnswer: string, correctAnswer: string, isCorrect: boolean, mode: string): Promise<void>;
    getWrongQuestions(userId: string): Promise<any[]>;
    getStats(userId: string): Promise<Stats>;
}
