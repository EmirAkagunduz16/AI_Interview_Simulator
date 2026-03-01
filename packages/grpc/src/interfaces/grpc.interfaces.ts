import { InjectionToken, OptionalFactoryDependency } from "@nestjs/common";

// ===========================
// gRPC Module Options
// ===========================

export interface GrpcServiceOptions {
  serviceName: string;
  packageName: string;
  protoPath: string;
  url: string;
}

export interface GrpcModuleAsyncOptions {
  serviceName: string;
  packageName: string;
  protoPath: string;
  useFactory: (
    ...args: unknown[]
  ) => Promise<{ url: string }> | { url: string };
  inject?: (InjectionToken | OptionalFactoryDependency)[];
}

// ===========================
// Service Names (Injection Tokens)
// ===========================

export const GRPC_AUTH_SERVICE = "GRPC_AUTH_SERVICE";
export const GRPC_USER_SERVICE = "GRPC_USER_SERVICE";
export const GRPC_INTERVIEW_SERVICE = "GRPC_INTERVIEW_SERVICE";
export const GRPC_QUESTION_SERVICE = "GRPC_QUESTION_SERVICE";
export const GRPC_AI_SERVICE = "GRPC_AI_SERVICE";

// ===========================
// Proto Package Names
// ===========================

export const PROTO_PACKAGES = {
  AUTH: "auth",
  USER: "user",
  INTERVIEW: "interview",
  QUESTION: "question",
  AI: "ai",
} as const;

// ===========================
// Auth Service
// ===========================

export interface IGrpcAuthService {
  validateToken(data: {
    access_token: string;
  }): Promise<{ valid: boolean; user_id: string; email: string; role: string }>;

  getTokenUser(data: {
    access_token: string;
  }): Promise<{ user_id: string; email: string; name: string; role: string }>;
}

// ===========================
// User Service
// ===========================

export interface IGrpcUserService {
  getUserByAuthId(data: { auth_id: string }): Promise<IGrpcUserResponse>;
  getUserById(data: { user_id: string }): Promise<IGrpcUserResponse>;
  updateUser(data: {
    auth_id: string;
    name?: string;
    avatar?: string;
    bio?: string;
    target_role?: string;
    experience_level?: string;
    skills?: string[];
  }): Promise<IGrpcUserResponse>;
  getUserStats(data: { auth_id: string }): Promise<{ json_data: string }>;
  getUsers(data: { page: number; limit: number }): Promise<{
    users: IGrpcUserResponse[];
    total: number;
    page: number;
    total_pages: number;
  }>;
}

export interface IGrpcUserResponse {
  id: string;
  auth_id: string;
  email: string;
  name: string;
  role: string;
  profile: {
    avatar: string;
    bio: string;
    target_role: string;
    experience_level: string;
    skills: string[];
  };
  subscription: {
    plan: string;
    interviews_used: number;
    interviews_limit: number;
  };
  is_active: boolean;
}

// ===========================
// Interview Service
// ===========================

export interface IGrpcInterviewService {
  getInterview(data: {
    interviewId: string;
    userId: string;
  }): Promise<IGrpcInterviewResponse>;

  getInterviewByVapiCallId(data: {
    vapiCallId: string;
  }): Promise<IGrpcInterviewResponse>;

  getUserInterviews(data: {
    userId: string;
    page: number;
    limit: number;
    status?: string;
  }): Promise<{
    interviews: IGrpcInterviewResponse[];
    total: number;
    page: number;
    totalPages: number;
  }>;

  getInterviewStats(data: { userId: string }): Promise<{
    totalInterviews: number;
    completedInterviews: number;
    averageScore: number;
    bestScore: number;
    totalQuestionsAnswered: number;
  }>;

  createInterview(data: {
    userId: string;
    field: string;
    techStack: string[];
    difficulty: string;
    title?: string;
    vapiCallId?: string;
    questionCount?: number;
  }): Promise<IGrpcInterviewResponse>;

  startInterview(data: {
    interviewId: string;
    userId: string;
  }): Promise<IGrpcInterviewResponse>;

  submitAnswer(data: {
    interviewId: string;
    userId: string;
    questionId: string;
    questionTitle: string;
    answer: string;
  }): Promise<IGrpcInterviewResponse>;

  completeInterview(data: {
    interviewId: string;
    userId: string;
  }): Promise<IGrpcInterviewResponse>;

  completeWithReport(data: {
    interviewId: string;
    report: IGrpcInterviewReportData;
    overallFeedback: string;
  }): Promise<IGrpcInterviewResponse>;

  cancelInterview(data: {
    interviewId: string;
    userId: string;
  }): Promise<IGrpcInterviewResponse>;

  addInterviewMessage(data: {
    interviewId: string;
    userId: string;
    role: string;
    content: string;
  }): Promise<IGrpcInterviewResponse>;
}

export interface IGrpcInterviewReportData {
  technicalScore: number;
  communicationScore: number;
  dictionScore: number;
  confidenceScore: number;
  overallScore: number;
  summary: string;
  recommendations: string[];
}

export interface IGrpcInterviewResponse {
  id: string;
  user_id: string;
  title: string;
  field: string;
  tech_stack: string[];
  type: string;
  status: string;
  difficulty: string;
  duration_minutes: number;
  total_score?: number;
  overall_feedback?: string;
  created_at: string;
  answers: {
    question_id: string;
    question_title: string;
    answer: string;
    feedback?: string;
    score?: number;
    strengths: string[];
    improvements: string[];
  }[];
  report?: {
    technical_score: number;
    communication_score: number;
    diction_score: number;
    confidence_score: number;
    overall_score: number;
    summary: string;
    recommendations: string[];
    question_evaluations: {
      question: string;
      answer: string;
      score: number;
      feedback: string;
      strengths: string[];
      improvements: string[];
    }[];
  };
  messages?: {
    role: string;
    content: string;
    created_at: string;
  }[];
}

// ===========================
// Question Service
// ===========================

export interface IGrpcQuestionService {
  getQuestion(data: { question_id: string }): Promise<IGrpcQuestionResponse>;

  getQuestions(data: {
    type?: string;
    difficulty?: string;
    category?: string;
    page: number;
    limit: number;
  }): Promise<{
    questions: IGrpcQuestionResponse[];
    total: number;
    page: number;
    total_pages: number;
  }>;

  getRandomQuestions(data: {
    count: number;
    type?: string;
    difficulty?: string;
    category?: string;
  }): Promise<{ questions: IGrpcQuestionResponse[] }>;

  getCategories(data: Record<string, never>): Promise<{ items: string[] }>;

  getTags(data: Record<string, never>): Promise<{ items: string[] }>;

  createQuestion(data: {
    title: string;
    content: string;
    type: string;
    difficulty: string;
    category: string;
    hints?: string;
    sample_answer?: string;
    tags?: string[];
  }): Promise<IGrpcQuestionResponse>;

  generateQuestions(data: {
    field: string;
    techStack: string[];
    difficulty: string;
    count: number;
  }): Promise<{ questions: IGrpcQuestionResponse[] }>;

  seedQuestions(data: Record<string, never>): Promise<{ created: number }>;

  updateQuestion(data: {
    question_id: string;
    title?: string;
    content?: string;
    type?: string;
    difficulty?: string;
    category?: string;
    hints?: string;
    sample_answer?: string;
    tags?: string[];
  }): Promise<IGrpcQuestionResponse>;

  deleteQuestion(data: { question_id: string }): Promise<Record<string, never>>;
}

export interface IGrpcQuestionResponse {
  id: string;
  title: string;
  content: string;
  hints: string;
  sample_answer: string;
  type: string;
  difficulty: string;
  category: string;
  tags: string[];
  mcq_options: { text: string; is_correct: boolean }[];
}

// ===========================
// AI Service
// ===========================

export interface IGrpcAiService {
  generateQuestions(data: {
    field: string;
    tech_stack: string[];
    difficulty: string;
    count: number;
  }): Promise<{
    questions: { question: string; order: number; expected_answer: string }[];
  }>;

  handleVapiWebhook(data: {
    json_body: string;
    user_id?: string;
  }): Promise<{ json_response: string }>;
}
