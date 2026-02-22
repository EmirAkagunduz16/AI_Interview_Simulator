import { InjectionToken, OptionalFactoryDependency } from "@nestjs/common";

// ===========================
// gRPC Module Options
// ===========================

export interface GrpcServiceOptions {
  /** Unique name for this gRPC service (used as injection token) */
  serviceName: string;
  /** Package name matching the proto file */
  packageName: string;
  /** Absolute or relative path to the .proto file */
  protoPath: string;
  /** Host:port of the gRPC server */
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

// ===========================
// Proto Package Names
// ===========================

export const PROTO_PACKAGES = {
  AUTH: "auth",
  USER: "user",
  INTERVIEW: "interview",
  QUESTION: "question",
} as const;

// ===========================
// gRPC Service Interface Contracts
// ===========================

// Auth Service
export interface IGrpcAuthService {
  validateToken(data: { access_token: string }): Promise<{
    valid: boolean;
    user_id: string;
    email: string;
    role: string;
  }>;

  getTokenUser(data: { access_token: string }): Promise<{
    user_id: string;
    email: string;
    name: string;
    role: string;
  }>;
}

// User Service
export interface IGrpcUserService {
  getUserByAuthId(data: { auth_id: string }): Promise<IGrpcUserResponse>;

  getUserById(data: { user_id: string }): Promise<IGrpcUserResponse>;

  updateUser(data: {
    user_id: string;
    name?: string;
    avatar?: string;
    bio?: string;
    target_role?: string;
    experience_level?: string;
    skills?: string[];
  }): Promise<IGrpcUserResponse>;
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

// Interview Service
export interface IGrpcInterviewService {
  getInterview(data: { interview_id: string }): Promise<IGrpcInterviewResponse>;

  getUserInterviews(data: {
    user_id: string;
    page: number;
    limit: number;
    status?: string;
  }): Promise<{
    interviews: IGrpcInterviewResponse[];
    total: number;
    page: number;
    total_pages: number;
  }>;

  getInterviewStats(data: { user_id: string }): Promise<{
    total_interviews: number;
    completed_interviews: number;
    average_score: number;
    best_score: number;
    total_questions_answered: number;
  }>;
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
  };
}

// Question Service
export interface IGrpcQuestionService {
  getQuestion(data: { question_id: string }): Promise<IGrpcQuestionResponse>;

  getRandomQuestions(data: {
    count: number;
    type?: string;
    difficulty?: string;
    category?: string;
  }): Promise<{
    questions: IGrpcQuestionResponse[];
  }>;

  getCategories(data: Record<string, never>): Promise<{
    categories: string[];
  }>;
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
  mcq_options: {
    text: string;
    is_correct: boolean;
  }[];
}
