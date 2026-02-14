export { apiClient } from "./client";
export { interviewsApi } from "./interviews";
export { questionsApi } from "./questions";
export { aiApi } from "./ai";

export type {
  Question,
  Interview,
  InterviewAnswer,
  CreateInterviewRequest,
  SubmitAnswerRequest,
  InterviewStats,
} from "./interviews";
export type { QuestionsFilter, PaginatedQuestions } from "./questions";
export type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  EvaluateRequest,
  EvaluationResult,
  GenerateQuestionRequest,
  GenerateQuestionResponse,
} from "./ai";
