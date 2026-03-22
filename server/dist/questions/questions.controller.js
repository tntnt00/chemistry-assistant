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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsController = exports.WrongQuestionsController = exports.QuestionsController = void 0;
const common_1 = require("@nestjs/common");
const questions_service_1 = require("./questions.service");
let QuestionsController = class QuestionsController {
    constructor(questionsService) {
        this.questionsService = questionsService;
    }
    async getRandomQuestion(body, req) {
        try {
            const { mode, userId, chapterId, sectionId, sectionName, questionCount, difficulty } = body;
            if (!userId) {
                throw new common_1.HttpException('用户ID不能为空', common_1.HttpStatus.BAD_REQUEST);
            }
            const question = await this.questionsService.getRandomQuestion(userId, mode, chapterId, sectionId, sectionName, questionCount || 5, difficulty || 'easy', req);
            return {
                code: 200,
                msg: '获取题目成功',
                data: question
            };
        }
        catch (error) {
            console.error('获取题目失败:', error);
            throw new common_1.HttpException(error.message || '获取题目失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async judgeAnswer(body, req) {
        try {
            const { questionId, userAnswer, mode, userId, questionData } = body;
            if (!userId || !questionId || !userAnswer) {
                throw new common_1.HttpException('参数不完整', common_1.HttpStatus.BAD_REQUEST);
            }
            const result = await this.questionsService.judgeAnswer(userId, questionId, userAnswer, mode, questionData, req);
            await this.questionsService.recordAnswer(userId, questionId, questionData, userAnswer, result.correctAnswer, result.isCorrect, mode);
            return {
                code: 200,
                msg: '判题成功',
                data: result
            };
        }
        catch (error) {
            console.error('判题失败:', error);
            throw new common_1.HttpException(error.message || '判题失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.QuestionsController = QuestionsController;
__decorate([
    (0, common_1.Post)('random'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], QuestionsController.prototype, "getRandomQuestion", null);
__decorate([
    (0, common_1.Post)('judge'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], QuestionsController.prototype, "judgeAnswer", null);
exports.QuestionsController = QuestionsController = __decorate([
    (0, common_1.Controller)('questions'),
    __metadata("design:paramtypes", [questions_service_1.QuestionsService])
], QuestionsController);
let WrongQuestionsController = class WrongQuestionsController {
    constructor(questionsService) {
        this.questionsService = questionsService;
    }
    async getWrongQuestions(userId) {
        try {
            if (!userId) {
                throw new common_1.HttpException('用户ID不能为空', common_1.HttpStatus.BAD_REQUEST);
            }
            const wrongQuestions = await this.questionsService.getWrongQuestions(userId);
            return {
                code: 200,
                msg: '获取错题本成功',
                data: wrongQuestions
            };
        }
        catch (error) {
            console.error('获取错题本失败:', error);
            throw new common_1.HttpException(error.message || '获取错题本失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.WrongQuestionsController = WrongQuestionsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WrongQuestionsController.prototype, "getWrongQuestions", null);
exports.WrongQuestionsController = WrongQuestionsController = __decorate([
    (0, common_1.Controller)('wrong-questions'),
    __metadata("design:paramtypes", [questions_service_1.QuestionsService])
], WrongQuestionsController);
let StatsController = class StatsController {
    constructor(questionsService) {
        this.questionsService = questionsService;
    }
    async getStats(userId) {
        try {
            if (!userId) {
                throw new common_1.HttpException('用户ID不能为空', common_1.HttpStatus.BAD_REQUEST);
            }
            const stats = await this.questionsService.getStats(userId);
            return {
                code: 200,
                msg: '获取统计信息成功',
                data: stats
            };
        }
        catch (error) {
            console.error('获取统计信息失败:', error);
            throw new common_1.HttpException(error.message || '获取统计信息失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.StatsController = StatsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StatsController.prototype, "getStats", null);
exports.StatsController = StatsController = __decorate([
    (0, common_1.Controller)('stats'),
    __metadata("design:paramtypes", [questions_service_1.QuestionsService])
], StatsController);
//# sourceMappingURL=questions.controller.js.map