export interface Question {
  id: string;
  chapter: string;
  knowledgePoint?: string;  // 知识点
  type: string;
  content: string;
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: string;
  explanation: string;
}

export interface JudgeResult {
  isCorrect: boolean;
  correctAnswer: string;
  correction?: string;
  explanation?: string;
}

export interface Stats {
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
}
