export interface InterviewStats {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  bestScore: number;
}

export interface InterviewListItem {
  id: string;
  field: string;
  techStack: string[];
  status: string;
  score?: number;
  createdAt: string;
}
