export class QuestionEvaluationDto {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export class InterviewReportDto {
  technicalScore: number;
  communicationScore: number;
  dictionScore: number;
  confidenceScore: number;
  overallScore: number;
  summary: string;
  recommendations: string[];
  questionEvaluations: QuestionEvaluationDto[];
}
