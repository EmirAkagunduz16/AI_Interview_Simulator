// ===========================
// @ai-coach/shared-types
// ===========================
// Barrel re-exports from domain modules

// User
export {
  IUser,
  IUserProfile,
  ISubscription,
  UserRole,
  ExperienceLevel,
  SubscriptionPlan,
} from "./user";

// Question
export { IQuestion, IMcqOption, QuestionType, Difficulty } from "./question";

// Interview
export {
  IInterview,
  IInterviewAnswer,
  IInterviewReport,
  IQuestionEvaluation,
  InterviewStatus,
  InterviewType,
  InterviewField,
  IVapiInterviewConfig,
} from "./interview";

// Auth
export { ITokenPayload, ITokenResponse } from "./auth";

// AI
export {
  IGeneratedQuestion,
  IInterviewEvaluation,
  IEvaluationResult,
  IChatMessage,
} from "./ai";

// Common
export {
  IApiResponse,
  IPaginatedResponse,
  IInterviewStats,
  IInterviewListItem,
} from "./common";

// Events
export {
  KafkaTopics,
  IKafkaEvent,
  IUserRegisteredPayload,
  IAnswerSubmittedPayload,
  IInterviewCompletedPayload,
  IAIEvaluationCompletedPayload,
} from "./events";
