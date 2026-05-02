import { InjectionToken, OptionalFactoryDependency } from "@nestjs/common";
import { Observable } from "rxjs";

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

export interface ValidateTokenRequest {
  accessToken: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  userId: string;
  email: string;
  role: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  accessToken: string;
}

export interface TokenUserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: TokenUserInfo;
}

export interface LogoutResponse {
  message: string;
}

export interface IGrpcAuthService {
  validateToken(data: ValidateTokenRequest): Observable<ValidateTokenResponse>;
  register(data: RegisterRequest): Observable<TokenResponse>;
  login(data: LoginRequest): Observable<TokenResponse>;
  refresh(data: RefreshRequest): Observable<TokenResponse>;
  logout(data: LogoutRequest): Observable<LogoutResponse>;
}

// ===========================
// User Service
// ===========================

export interface GetUserByAuthIdRequest {
  authId: string;
}

export interface UpdateUserRequest {
  authId: string;
  name?: string;
  avatar?: string;
  bio?: string;
  targetRole?: string;
  experienceLevel?: string;
  skills?: string[];
}

export interface GetUserStatsRequest {
  authId: string;
}

export interface GetUserStatsResponse {
  jsonData: string;
}

export interface GetUsersRequest {
  page: number;
  limit: number;
}

export interface UserProfileResponse {
  avatar: string;
  bio: string;
  targetRole: string;
  experienceLevel: string;
  skills: string[];
}

export interface UserSubscriptionResponse {
  plan: string;
  interviewsUsed: number;
  interviewsLimit: number;
}

export interface UserResponse {
  id: string;
  authId: string;
  email: string;
  name: string;
  role: string;
  profile: UserProfileResponse;
  subscription: UserSubscriptionResponse;
  isActive: boolean;
}

export interface UsersListResponse {
  users: UserResponse[];
  total: number;
  page: number;
  totalPages: number;
}

export interface IGrpcUserService {
  getUserByAuthId(data: GetUserByAuthIdRequest): Observable<UserResponse>;
  updateUser(data: UpdateUserRequest): Observable<UserResponse>;
  getUserStats(data: GetUserStatsRequest): Observable<GetUserStatsResponse>;
  getUsers(data: GetUsersRequest): Observable<UsersListResponse>;
}

// ===========================
// Interview Service
// ===========================

export interface GetInterviewRequest {
  interviewId: string;
  userId: string;
}

export interface GetInterviewByVapiCallIdRequest {
  vapiCallId: string;
}

export interface GetUserInterviewsRequest {
  userId: string;
  page: number;
  limit: number;
  status?: string;
}

export interface GetInterviewStatsRequest {
  userId: string;
}

export interface InterviewStatsResponse {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  bestScore: number;
  totalQuestionsAnswered: number;
}

export interface CreateInterviewRequest {
  userId: string;
  field: string;
  techStack: string[];
  difficulty: string;
  title?: string;
  vapiCallId?: string;
  questionCount?: number;
}

export interface StartInterviewRequest {
  interviewId: string;
  userId: string;
  questionIds?: string[];
}

export interface SubmitAnswerRequest {
  interviewId: string;
  userId: string;
  questionId: string;
  questionTitle: string;
  answer: string;
}

export interface CompleteInterviewRequest {
  interviewId: string;
  userId: string;
}

export interface InterviewReportData {
  technicalScore: number;
  communicationScore: number;
  dictionScore: number;
  confidenceScore: number;
  overallScore: number;
  summary: string;
  recommendations: string[];
  questionEvaluations?: QuestionEvaluationResponse[];
}

export interface CompleteWithReportRequest {
  interviewId: string;
  report: InterviewReportData;
  overallFeedback: string;
}

export interface CancelInterviewRequest {
  interviewId: string;
  userId: string;
}

export interface AddInterviewMessageRequest {
  interviewId: string;
  userId: string;
  role: string;
  content: string;
}

export interface InterviewAnswerResponse {
  questionId: string;
  questionTitle: string;
  answer: string;
  feedback?: string;
  score?: number;
  strengths: string[];
  improvements: string[];
}

export interface QuestionEvaluationResponse {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface InterviewReportResponse {
  technicalScore: number;
  communicationScore: number;
  dictionScore: number;
  confidenceScore: number;
  overallScore: number;
  summary: string;
  recommendations: string[];
  questionEvaluations: QuestionEvaluationResponse[];
}

export interface InterviewMessageResponse {
  role: string;
  content: string;
  createdAt: string;
}

export interface InterviewResponse {
  id: string;
  userId: string;
  title: string;
  field: string;
  techStack: string[];
  type: string;
  status: string;
  difficulty: string;
  durationMinutes: number;
  totalScore?: number;
  overallFeedback?: string;
  createdAt: string;
  questionIds?: string[];
  answers: InterviewAnswerResponse[];
  report?: InterviewReportResponse;
  messages?: InterviewMessageResponse[];
}

export interface InterviewsListResponse {
  interviews: InterviewResponse[];
  total: number;
  page: number;
  totalPages: number;
}

export interface IGrpcInterviewService {
  getInterview(data: GetInterviewRequest): Observable<InterviewResponse>;
  getInterviewByVapiCallId(
    data: GetInterviewByVapiCallIdRequest,
  ): Observable<InterviewResponse>;
  getUserInterviews(
    data: GetUserInterviewsRequest,
  ): Observable<InterviewsListResponse>;
  getInterviewStats(
    data: GetInterviewStatsRequest,
  ): Observable<InterviewStatsResponse>;
  createInterview(data: CreateInterviewRequest): Observable<InterviewResponse>;
  startInterview(data: StartInterviewRequest): Observable<InterviewResponse>;
  submitAnswer(data: SubmitAnswerRequest): Observable<InterviewResponse>;
  completeInterview(
    data: CompleteInterviewRequest,
  ): Observable<InterviewResponse>;
  completeWithReport(
    data: CompleteWithReportRequest,
  ): Observable<InterviewResponse>;
  cancelInterview(data: CancelInterviewRequest): Observable<InterviewResponse>;
  addInterviewMessage(
    data: AddInterviewMessageRequest,
  ): Observable<InterviewResponse>;
}

// ===========================
// Question Service
// ===========================

export interface GetPopularQuestionsRequest {
  limit: number;
  category?: string;
  difficulty?: string;
}

export interface GetCommunityQuestionsRequest {
  page: number;
  limit: number;
  category?: string;
  difficulty?: string;
  companyTag?: string;
  sortBy?: string;
  tag?: string;
}

export interface SubmitCommunityQuestionRequest {
  title?: string;
  content: string;
  type: string;
  difficulty?: string;
  category: string;
  companyTag: string;
  tags: string[];
  submittedBy: string;
  submitterName: string;
  hints?: string;
  sampleAnswer?: string;
}

export interface UpvoteQuestionRequest {
  questionId: string;
  userId: string;
}

export interface UpvoteQuestionResponse {
  questionId: string;
  upvoteCount: number;
  upvoted: boolean;
}

export interface GetQuestionRequest {
  questionId: string;
}

export interface GetQuestionsRequest {
  type?: string;
  difficulty?: string;
  category?: string;
  page: number;
  limit: number;
}

export interface GetRandomQuestionsRequest {
  count: number;
  type?: string;
  difficulty?: string;
  category?: string;
  tags?: string;
  excludeIds?: string[];
  excludeCommunity?: boolean;
}

export interface CreateQuestionRequest {
  title: string;
  content: string;
  type: string;
  difficulty: string;
  category: string;
  hints?: string;
  sampleAnswer?: string;
  tags?: string[];
}

export interface GenerateQuestionsRequest {
  field: string;
  techStack: string[];
  difficulty: string;
  count: number;
}

export interface UpdateQuestionRequest {
  questionId: string;
  title?: string;
  content?: string;
  type?: string;
  difficulty?: string;
  category?: string;
  hints?: string;
  sampleAnswer?: string;
  tags?: string[];
}

export interface DeleteQuestionRequest {
  questionId: string;
}

export interface McqOptionResponse {
  text: string;
  isCorrect: boolean;
}

export interface QuestionResponse {
  id: string;
  title: string;
  content: string;
  hints: string;
  sampleAnswer: string;
  type: string;
  difficulty: string;
  category: string;
  tags: string[];
  mcqOptions: McqOptionResponse[];
  usageCount: number;
  companyTag: string;
  upvoteCount: number;
  createdBy: string;
  submitterName: string;
  createdAt: string;
}

export interface QuestionsListResponse {
  questions: QuestionResponse[];
  total: number;
  page: number;
  totalPages: number;
}

export interface StringListResponse {
  items: string[];
}

export interface IGrpcQuestionService {
  getQuestion(data: GetQuestionRequest): Observable<QuestionResponse>;
  getQuestions(data: GetQuestionsRequest): Observable<QuestionsListResponse>;
  getRandomQuestions(
    data: GetRandomQuestionsRequest,
  ): Observable<{ questions: QuestionResponse[] }>;
  getCategories(data: Record<string, never>): Observable<StringListResponse>;
  getTags(data: Record<string, never>): Observable<StringListResponse>;
  createQuestion(data: CreateQuestionRequest): Observable<QuestionResponse>;
  generateQuestions(
    data: GenerateQuestionsRequest,
  ): Observable<{ questions: QuestionResponse[] }>;
  updateQuestion(data: UpdateQuestionRequest): Observable<QuestionResponse>;
  deleteQuestion(
    data: DeleteQuestionRequest,
  ): Observable<Record<string, never>>;
  getPopularQuestions(
    data: GetPopularQuestionsRequest,
  ): Observable<{ questions: QuestionResponse[] }>;
  getCommunityQuestions(
    data: GetCommunityQuestionsRequest,
  ): Observable<QuestionsListResponse>;
  getCommunityTags(data: Record<string, never>): Observable<StringListResponse>;
  submitCommunityQuestion(
    data: SubmitCommunityQuestionRequest,
  ): Observable<QuestionResponse>;
  upvoteQuestion(
    data: UpvoteQuestionRequest,
  ): Observable<UpvoteQuestionResponse>;
}

// ===========================
// AI Service
// ===========================

export interface HandleVapiWebhookRequest {
  jsonBody: string;
  userId?: string;
}

export interface HandleVapiWebhookResponse {
  jsonResponse: string;
}

export interface IGrpcAiService {
  handleVapiWebhook(
    data: HandleVapiWebhookRequest,
  ): Observable<HandleVapiWebhookResponse>;
}
