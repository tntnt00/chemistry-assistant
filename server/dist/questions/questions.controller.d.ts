import { QuestionsService } from './questions.service';
import { Question, JudgeResult, Stats } from './types';
export declare class QuestionsController {
    private readonly questionsService;
    constructor(questionsService: QuestionsService);
    getRandomQuestion(body: {
        mode: string;
        userId: string;
        chapterId?: string;
        sectionId?: string;
        sectionName?: string;
        questionCount?: number;
        difficulty?: string;
    }, req: any): Promise<{
        code: number;
        msg: string;
        data: Question;
    }>;
    judgeAnswer(body: {
        questionId: string;
        userAnswer: string;
        mode: string;
        userId: string;
        questionData?: any;
    }, req: any): Promise<{
        code: number;
        msg: string;
        data: JudgeResult;
    }>;
}
export declare class WrongQuestionsController {
    private readonly questionsService;
    constructor(questionsService: QuestionsService);
    getWrongQuestions(userId: string): Promise<{
        code: number;
        msg: string;
        data: any[];
    }>;
}
export declare class StatsController {
    private readonly questionsService;
    constructor(questionsService: QuestionsService);
    getStats(userId: string): Promise<{
        code: number;
        msg: string;
        data: Stats;
    }>;
}
