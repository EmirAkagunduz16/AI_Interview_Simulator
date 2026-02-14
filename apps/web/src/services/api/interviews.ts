import apiClient from './client';

export interface Question {
  _id: string;
  text: string;
  type: 'audio' | 'video' | 'mcq' | 'coding' | 'behavioral';
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  options?: Array<{ id: string; text: string; isCorrect: boolean }>;
  correctAnswer?: string;
  codeTemplate?: string;
  language?: string;
  expectedTime: number;
  aiPrompt?: string;
  hint?: string;
  explanation?: string;
}

export interface Interview {
  _id: string;
  userId: string;
  field: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  answers: InterviewAnswer[];
  questionIds: string[];
  currentQuestionIndex: number;
  totalScore?: number;
  aiFeedback?: string;
  overallStrengths?: string[];
  overallImprovements?: string[];
  startedAt?: string;
  completedAt?: string;
  totalTimeSpent: number;
  createdAt: string;
}

export interface InterviewAnswer {
  questionId: string;
  answer?: string;
  audioUrl?: string;
  videoUrl?: string;
  codeSubmission?: string;
  score?: number;
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
  answeredAt?: string;
  timeSpent: number;
}

export interface CreateInterviewRequest {
  field: string;
  questionCount?: number;
}

export interface SubmitAnswerRequest {
  questionId: string;
  answer?: string;
  audioUrl?: string;
  videoUrl?: string;
  codeSubmission?: string;
  timeSpent?: number;
}

export interface InterviewStats {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  totalTimeSpent: number;
  fieldBreakdown: Record<string, number>;
}

export interface PaginatedResponse<T> {
  interviews: T[];
  total: number;
  page: number;
  totalPages: number;
}

export const interviewsApi = {
  create: (data: CreateInterviewRequest) =>
    apiClient.post<Interview>('/interviews', data),

  list: (params?: { status?: string; field?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.field) query.append('field', params.field);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    return apiClient.get<PaginatedResponse<Interview>>(`/interviews?${query.toString()}`);
  },

  getById: (id: string) =>
    apiClient.get<Interview>(`/interviews/${id}`),

  start: (id: string) =>
    apiClient.post<Interview>(`/interviews/${id}/start`),

  submitAnswer: (id: string, data: SubmitAnswerRequest) =>
    apiClient.post<Interview>(`/interviews/${id}/submit`, data),

  complete: (id: string) =>
    apiClient.post<Interview>(`/interviews/${id}/complete`),

  cancel: (id: string) =>
    apiClient.post<Interview>(`/interviews/${id}/cancel`),

  getStats: () =>
    apiClient.get<InterviewStats>('/interviews/stats'),
};

export default interviewsApi;
