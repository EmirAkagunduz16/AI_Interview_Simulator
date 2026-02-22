// ===========================================
// Kafka Event Types - Event-Driven Architecture
// ===========================================

export enum KafkaTopics {
  // Auth Events
  USER_REGISTERED = "user.registered",

  // Interview Events
  INTERVIEW_ANSWER_SUBMITTED = "interview.answer_submitted",
  INTERVIEW_COMPLETED = "interview.completed",

  // AI Events
  AI_EVALUATION_COMPLETED = "ai.evaluation_completed",
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

// ===========================
// Event Payloads
// ===========================

// Auth Events
export interface IUserRegisteredPayload {
  userId: string;
  email: string;
  name?: string;
}

// Interview Events
export interface IAnswerSubmittedPayload {
  interviewId: string;
  userId: string;
  questionId: string;
  questionTitle: string;
  questionContent: string;
  answer: string;
}

export interface IInterviewCompletedPayload {
  interviewId: string;
  userId: string;
  totalScore: number;
  completedAt: string;
  totalTimeSpent: number;
}

// AI Events
export interface IAIEvaluationCompletedPayload {
  interviewId: string;
  questionId: string;
  userId: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}
