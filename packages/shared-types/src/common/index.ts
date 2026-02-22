// ===========================
// API Response Types
// ===========================

export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface IPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

// ===========================
// Dashboard Types
// ===========================

export interface IInterviewStats {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  bestScore: number;
  totalQuestionsAnswered?: number;
}

export interface IInterviewListItem {
  id: string;
  field: string;
  techStack: string[];
  status: string;
  score?: number;
  createdAt: string;
}
