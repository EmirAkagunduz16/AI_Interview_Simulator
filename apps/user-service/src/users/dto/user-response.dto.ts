export class UserResponseDto {
  id: string;
  authId: string;
  email: string;
  name?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class DashboardStatsDto {
  interviewCount: number;
  totalScore: number;
  averageScore: number;
  lastInterviewAt?: Date;
}

export class PaginatedUsersResponseDto {
  users: UserResponseDto[];
  total: number;
  page: number;
  totalPages: number;
}
