import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() authId: string;
  @ApiProperty() email: string;
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() phone?: string;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class DashboardStatsDto {
  @ApiProperty() interviewCount: number;
  @ApiProperty() totalScore: number;
  @ApiProperty() averageScore: number;
  @ApiPropertyOptional() lastInterviewAt?: Date;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [UserResponseDto] }) users: UserResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() totalPages: number;
}
