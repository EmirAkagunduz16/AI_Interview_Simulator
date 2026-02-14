import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    if (!supabaseUrl) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL is not set. Please add it to your .env.local file.",
      );
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

// Re-export as `supabase` for convenience (lazy getter)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});

export type Interview = {
  id: string;
  user_id: string;
  field: string;
  tech_stack: string[];
  difficulty: string;
  status: "preparing" | "in_progress" | "completed" | "cancelled";
  vapi_call_id?: string;
  total_score?: number;
  overall_feedback?: string;
  created_at: string;
  completed_at?: string;
};

export type InterviewQuestion = {
  id: string;
  interview_id: string;
  question_text: string;
  order_num: number;
  answer_transcript?: string;
  score?: number;
  feedback?: string;
  strengths: string[];
  improvements: string[];
  answered_at?: string;
};

export type InterviewReport = {
  id: string;
  interview_id: string;
  technical_score: number;
  communication_score: number;
  diction_score: number;
  confidence_score: number;
  overall_score: number;
  summary: string;
  recommendations: string[];
};
