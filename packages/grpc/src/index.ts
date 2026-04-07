// ===========================
// @ai-coach/grpc
// ===========================

// Module
export { GrpcModule } from "./grpc.module";

// Interfaces & Types
export {
  // Module options
  type GrpcServiceOptions,
  type GrpcModuleAsyncOptions,

  // Injection tokens
  GRPC_AUTH_SERVICE,
  GRPC_USER_SERVICE,
  GRPC_INTERVIEW_SERVICE,
  GRPC_QUESTION_SERVICE,
  GRPC_AI_SERVICE,
  PROTO_PACKAGES,

  // Auth Service
  type ValidateTokenRequest,
  type ValidateTokenResponse,
  type RegisterRequest,
  type LoginRequest,
  type RefreshRequest,
  type LogoutRequest,
  type TokenUserInfo,
  type TokenResponse,
  type LogoutResponse,
  type IGrpcAuthService,

  // User Service
  type GetUserByAuthIdRequest,
  type UpdateUserRequest,
  type GetUserStatsRequest,
  type GetUserStatsResponse,
  type GetUsersRequest,
  type UserProfileResponse,
  type UserSubscriptionResponse,
  type UserResponse,
  type UsersListResponse,
  type IGrpcUserService,

  // Interview Service
  type GetInterviewRequest,
  type GetInterviewByVapiCallIdRequest,
  type GetUserInterviewsRequest,
  type GetInterviewStatsRequest,
  type InterviewStatsResponse,
  type CreateInterviewRequest,
  type StartInterviewRequest,
  type SubmitAnswerRequest,
  type CompleteInterviewRequest,
  type InterviewReportData,
  type CompleteWithReportRequest,
  type CancelInterviewRequest,
  type AddInterviewMessageRequest,
  type InterviewAnswerResponse,
  type QuestionEvaluationResponse,
  type InterviewReportResponse,
  type InterviewMessageResponse,
  type InterviewResponse,
  type InterviewsListResponse,
  type IGrpcInterviewService,

  // Question Service
  type GetQuestionRequest,
  type GetQuestionsRequest,
  type GetRandomQuestionsRequest,
  type CreateQuestionRequest,
  type GenerateQuestionsRequest,
  type UpdateQuestionRequest,
  type DeleteQuestionRequest,
  type GetPopularQuestionsRequest,
  type GetCommunityQuestionsRequest,
  type SubmitCommunityQuestionRequest,
  type UpvoteQuestionRequest,
  type UpvoteQuestionResponse,
  type McqOptionResponse,
  type QuestionResponse,
  type QuestionsListResponse,
  type StringListResponse,
  type IGrpcQuestionService,

  // AI Service
  type HandleVapiWebhookRequest,
  type HandleVapiWebhookResponse,
  type IGrpcAiService,
} from "./interfaces/grpc.interfaces";
