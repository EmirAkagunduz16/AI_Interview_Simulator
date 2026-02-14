import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>("supabase.url");
    const serviceRoleKey = this.configService.get<string>(
      "supabase.serviceRoleKey",
    );

    if (url && serviceRoleKey) {
      this.client = createClient(url, serviceRoleKey);
      this.logger.log("Supabase client initialized");
    } else {
      this.logger.warn("Supabase not configured — database features disabled");
    }
  }

  getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error("Supabase client not initialized");
    }
    return this.client;
  }

  // ========== Interviews ==========

  async createInterview(data: {
    user_id: string;
    field: string;
    tech_stack: string[];
    difficulty: string;
    vapi_call_id?: string;
  }) {
    const { data: interview, error } = await this.getClient()
      .from("interviews")
      .insert({
        ...data,
        status: "preparing",
      })
      .select()
      .single();

    if (error) throw error;
    return interview;
  }

  async updateInterview(id: string, data: Record<string, any>) {
    const { data: interview, error } = await this.getClient()
      .from("interviews")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return interview;
  }

  async getInterview(id: string) {
    const { data, error } = await this.getClient()
      .from("interviews")
      .select("*, interview_questions(*), interview_reports(*)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  async getUserInterviews(userId: string) {
    const { data, error } = await this.getClient()
      .from("interviews")
      .select(
        "*, interview_reports(overall_score, technical_score, communication_score)",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }

  // ========== Interview Questions ==========

  async saveQuestions(
    interviewId: string,
    questions: { question_text: string; order: number }[],
  ) {
    const rows = questions.map((q) => ({
      interview_id: interviewId,
      question_text: q.question_text,
      order_num: q.order,
    }));

    const { data, error } = await this.getClient()
      .from("interview_questions")
      .insert(rows)
      .select();

    if (error) throw error;
    return data;
  }

  async getQuestions(interviewId: string) {
    const { data, error } = await this.getClient()
      .from("interview_questions")
      .select("*")
      .eq("interview_id", interviewId)
      .order("order_num", { ascending: true });

    if (error) throw error;
    return data;
  }

  async saveAnswer(questionId: string, answerTranscript: string) {
    const { data, error } = await this.getClient()
      .from("interview_questions")
      .update({
        answer_transcript: answerTranscript,
        answered_at: new Date().toISOString(),
      })
      .eq("id", questionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateQuestionEvaluation(
    questionId: string,
    evaluation: {
      score: number;
      feedback: string;
      strengths: string[];
      improvements: string[];
    },
  ) {
    const { error } = await this.getClient()
      .from("interview_questions")
      .update(evaluation)
      .eq("id", questionId);

    if (error) throw error;
  }

  // ========== Interview Reports ==========

  async saveReport(
    interviewId: string,
    report: {
      technical_score: number;
      communication_score: number;
      diction_score: number;
      confidence_score: number;
      overall_score: number;
      summary: string;
      recommendations: string[];
    },
  ) {
    const { data, error } = await this.getClient()
      .from("interview_reports")
      .insert({
        interview_id: interviewId,
        ...report,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
