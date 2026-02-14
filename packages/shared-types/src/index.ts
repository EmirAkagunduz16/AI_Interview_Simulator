// User Types
export interface IUser {
  _id: string;
  email: string;
  name?: string;
  role: UserRole;
  profile: IUserProfile;
  subscription: ISubscription;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserProfile {
  avatar?: string;
  bio?: string;
  targetRole?: string;
  experienceLevel?: ExperienceLevel;
  skills?: string[];
}

export interface ISubscription {
  plan: SubscriptionPlan;
  expiresAt?: Date;
  interviewsUsed: number;
  interviewsLimit: number;
}

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  PREMIUM = "premium",
}

export enum ExperienceLevel {
  JUNIOR = "junior",
  MID = "mid",
  SENIOR = "senior",
}

export enum SubscriptionPlan {
  FREE = "free",
  BASIC = "basic",
  PRO = "pro",
  ENTERPRISE = "enterprise",
}

// Question Types
export interface IQuestion {
  _id: string;
  text: string;
  type: QuestionType;
  category: string;
  difficulty: Difficulty;
  tags: string[];
  options?: IMcqOption[];
  correctAnswer?: string;
  codeTemplate?: string;
  language?: string;
  expectedTime: number;
  aiPrompt?: string;
  hint?: string;
  explanation?: string;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
}

export interface IMcqOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export enum QuestionType {
  AUDIO = "audio",
  VIDEO = "video",
  MCQ = "mcq",
  CODING = "coding",
  BEHAVIORAL = "behavioral",
}

export enum Difficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

// Interview Types
export interface IInterview {
  _id: string;
  userId: string;
  field: string;
  status: InterviewStatus;
  answers: IInterviewAnswer[];
  questionIds: string[];
  currentQuestionIndex: number;
  totalScore?: number;
  aiFeedback?: string;
  overallStrengths?: string[];
  overallImprovements?: string[];
  startedAt?: Date;
  completedAt?: Date;
  totalTimeSpent: number;
  createdAt: Date;
}

export interface IInterviewAnswer {
  questionId: string;
  answer?: string;
  audioUrl?: string;
  videoUrl?: string;
  codeSubmission?: string;
  score?: number;
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
  answeredAt?: Date;
  timeSpent: number;
}

export enum InterviewStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

// Auth Types
export interface ITokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface ITokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
}

// Interview Field & Config Types
export enum InterviewField {
  BACKEND = "backend",
  FRONTEND = "frontend",
  FULLSTACK = "fullstack",
  MOBILE = "mobile",
  DEVOPS = "devops",
  DATA_SCIENCE = "data_science",
}

export interface IVapiInterviewConfig {
  field: InterviewField | string;
  techStack: string[];
  difficulty: Difficulty | string;
  userId?: string;
}

// Interview Report Types
export interface IInterviewReport {
  technicalScore: number;
  communicationScore: number;
  dictionScore: number;
  confidenceScore: number;
  overallScore: number;
  summary: string;
  recommendations: string[];
  questionEvaluations: IQuestionEvaluation[];
}

export interface IQuestionEvaluation {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

// AI Types
export interface IEvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface IChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// API Response Types
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

// ===========================================
// Kafka Event Types - Event-Driven Architecture
// ===========================================

// Kafka Topics
export enum KafkaTopics {
  // Auth Events
  USER_REGISTERED = "user.registered",
  USER_LOGGED_IN = "user.logged_in",
  USER_LOGGED_OUT = "user.logged_out",
  USER_PASSWORD_CHANGED = "user.password_changed",

  // User Events
  USER_PROFILE_UPDATED = "user.profile_updated",
  USER_SUBSCRIPTION_CHANGED = "user.subscription_changed",
  USER_DELETED = "user.deleted",

  // Interview Events
  INTERVIEW_CREATED = "interview.created",
  INTERVIEW_STARTED = "interview.started",
  INTERVIEW_ANSWER_SUBMITTED = "interview.answer_submitted",
  INTERVIEW_COMPLETED = "interview.completed",
  INTERVIEW_CANCELLED = "interview.cancelled",

  // AI Events
  AI_EVALUATION_REQUESTED = "ai.evaluation_requested",
  AI_EVALUATION_COMPLETED = "ai.evaluation_completed",
  AI_QUESTION_GENERATED = "ai.question_generated",

  // Question Events
  QUESTION_CREATED = "question.created",
  QUESTION_UPDATED = "question.updated",
  QUESTION_USED = "question.used",
}

// Base Event Interface
export interface IKafkaEvent<T = unknown> {
  eventId: string;
  eventType: KafkaTopics;
  timestamp: string;
  source: string;
  correlationId?: string;
  payload: T;
}

// Auth Event Payloads
export interface IUserRegisteredPayload {
  userId: string;
  email: string;
  name?: string;
}

export interface IUserLoggedInPayload {
  userId: string;
  email: string;
  loginTime: string;
  ipAddress?: string;
}

// User Event Payloads
export interface IUserProfileUpdatedPayload {
  userId: string;
  updatedFields: string[];
}

export interface IUserSubscriptionChangedPayload {
  userId: string;
  oldPlan: SubscriptionPlan;
  newPlan: SubscriptionPlan;
}

// Interview Event Payloads
export interface IInterviewCreatedPayload {
  interviewId: string;
  userId: string;
  field: string;
  questionCount: number;
}

export interface IInterviewStartedPayload {
  interviewId: string;
  userId: string;
  startedAt: string;
}

export interface IAnswerSubmittedPayload {
  interviewId: string;
  userId: string;
  questionId: string;
  answerType: QuestionType;
}

export interface IInterviewCompletedPayload {
  interviewId: string;
  userId: string;
  totalScore: number;
  completedAt: string;
  totalTimeSpent: number;
}

// AI Event Payloads
export interface IAIEvaluationRequestedPayload {
  interviewId: string;
  questionId: string;
  userId: string;
  answerType: QuestionType;
  answer: string;
}

export interface IAIEvaluationCompletedPayload {
  interviewId: string;
  questionId: string;
  userId: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}
