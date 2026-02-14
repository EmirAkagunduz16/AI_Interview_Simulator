import apiClient from './client';
import { Question } from './interviews';

export interface QuestionsFilter {
  type?: string;
  category?: string;
  difficulty?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedQuestions {
  questions: Question[];
  total: number;
  page: number;
  totalPages: number;
}

export const questionsApi = {
  list: (filters?: QuestionsFilter) => {
    const query = new URLSearchParams();
    if (filters?.type) query.append('type', filters.type);
    if (filters?.category) query.append('category', filters.category);
    if (filters?.difficulty) query.append('difficulty', filters.difficulty);
    if (filters?.page) query.append('page', String(filters.page));
    if (filters?.limit) query.append('limit', String(filters.limit));
    return apiClient.get<PaginatedQuestions>(`/questions?${query.toString()}`);
  },

  getById: (id: string) =>
    apiClient.get<Question>(`/questions/${id}`),

  getRandom: (params?: { type?: string; category?: string; difficulty?: string; count?: number }) => {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.category) query.append('category', params.category);
    if (params?.difficulty) query.append('difficulty', params.difficulty);
    if (params?.count) query.append('count', String(params.count));
    return apiClient.get<Question[]>(`/questions/random?${query.toString()}`);
  },

  getCategories: () =>
    apiClient.get<string[]>('/questions/categories'),

  getTags: () =>
    apiClient.get<string[]>('/questions/tags'),
};

export default questionsApi;
