import { Controller, Post, Get, Body, Query, Req, HttpException, HttpStatus } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { Question, JudgeResult, Stats } from './types';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  /**
   * 获取随机题目
   * POST /api/questions/random
   */
  @Post('random')
  async getRandomQuestion(
    @Body() body: {
      mode: string;
      userId: string;
      chapterId?: string;
      sectionId?: string;
      sectionName?: string;
      questionCount?: number;
      difficulty?: string;
    },
    @Req() req: any
  ) {
    try {
      const { mode, userId, chapterId, sectionId, sectionName, questionCount, difficulty } = body;

      if (!userId) {
        throw new HttpException('用户ID不能为空', HttpStatus.BAD_REQUEST);
      }

      const question = await this.questionsService.getRandomQuestion(
        userId,
        mode,
        chapterId,
        sectionId,
        sectionName,
        questionCount || 5,
        difficulty || 'easy',
        req
      );

      return {
        code: 200,
        msg: '获取题目成功',
        data: question
      };
    } catch (error) {
      console.error('获取题目失败:', error);
      throw new HttpException(
        error.message || '获取题目失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 判题
   * POST /api/judge
   */
  @Post('judge')
  async judgeAnswer(
    @Body() body: {
      questionId: string;
      userAnswer: string;
      mode: string;
      userId: string;
      questionData?: any;
    },
    @Req() req: any
  ) {
    try {
      const { questionId, userAnswer, mode, userId, questionData } = body;

      if (!userId || !questionId || !userAnswer) {
        throw new HttpException('参数不完整', HttpStatus.BAD_REQUEST);
      }

      // 先判题
      const result = await this.questionsService.judgeAnswer(
        userId,
        questionId,
        userAnswer,
        mode,
        questionData,
        req
      );

      // 记录答题
      await this.questionsService.recordAnswer(
        userId,
        questionId,
        questionData,
        userAnswer,
        result.correctAnswer,
        result.isCorrect,
        mode
      );

      return {
        code: 200,
        msg: '判题成功',
        data: result
      };
    } catch (error) {
      console.error('判题失败:', error);
      throw new HttpException(
        error.message || '判题失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

@Controller('wrong-questions')
export class WrongQuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  /**
   * 获取错题本
   * GET /api/wrong-questions
   */
  @Get()
  async getWrongQuestions(@Query('userId') userId: string) {
    try {
      if (!userId) {
        throw new HttpException('用户ID不能为空', HttpStatus.BAD_REQUEST);
      }

      const wrongQuestions = await this.questionsService.getWrongQuestions(userId);

      return {
        code: 200,
        msg: '获取错题本成功',
        data: wrongQuestions
      };
    } catch (error) {
      console.error('获取错题本失败:', error);
      throw new HttpException(
        error.message || '获取错题本失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

@Controller('stats')
export class StatsController {
  constructor(private readonly questionsService: QuestionsService) {}

  /**
   * 获取统计信息
   * GET /api/stats
   */
  @Get()
  async getStats(@Query('userId') userId: string) {
    try {
      if (!userId) {
        throw new HttpException('用户ID不能为空', HttpStatus.BAD_REQUEST);
      }

      const stats = await this.questionsService.getStats(userId);

      return {
        code: 200,
        msg: '获取统计信息成功',
        data: stats
      };
    } catch (error) {
      console.error('获取统计信息失败:', error);
      throw new HttpException(
        error.message || '获取统计信息失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
