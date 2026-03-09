export interface VapiFunctionCallParams {
  field?: string;
  techStack?: string[];
  difficulty?: string;
  userId?: string;
  interviewId?: string;
  questionOrder?: number;
  questionId?: string;
  questionText?: string;
  answer?: string;
  answers?: {
    question?: string;
    questionText?: string;
    answer?: string;
    order?: number;
  }[];
  questions?: { question: string; order: number; id?: string }[];
  currentOrder?: number;
}

export interface CachedQuestion {
  id: string;
  question: string;
  order: number;
}
