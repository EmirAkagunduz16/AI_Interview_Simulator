-- Supabase SQL Schema for AI Coach
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Interviews table
create table if not exists interviews (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  field text not null,
  tech_stack text[] default '{}',
  difficulty text default 'intermediate',
  status text default 'preparing' check (status in ('preparing', 'in_progress', 'completed', 'cancelled')),
  vapi_call_id text,
  total_score integer,
  overall_feedback text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Interview questions table
create table if not exists interview_questions (
  id uuid primary key default uuid_generate_v4(),
  interview_id uuid references interviews(id) on delete cascade,
  question_text text not null,
  order_num integer not null,
  answer_transcript text,
  score integer,
  feedback text,
  strengths text[] default '{}',
  improvements text[] default '{}',
  answered_at timestamptz,
  created_at timestamptz default now()
);

-- Interview reports table
create table if not exists interview_reports (
  id uuid primary key default uuid_generate_v4(),
  interview_id uuid references interviews(id) on delete cascade unique,
  technical_score integer not null,
  communication_score integer not null,
  diction_score integer not null,
  confidence_score integer not null,
  overall_score integer not null,
  summary text,
  recommendations text[] default '{}',
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_interviews_user_id on interviews(user_id);
create index if not exists idx_interviews_status on interviews(status);
create index if not exists idx_interview_questions_interview_id on interview_questions(interview_id);
create index if not exists idx_interview_reports_interview_id on interview_reports(interview_id);

-- Row Level Security (enable for production)
alter table interviews enable row level security;
alter table interview_questions enable row level security;
alter table interview_reports enable row level security;

-- Policies (allow all for service_role, restrict for anon)
create policy "Service role full access" on interviews for all using (true);
create policy "Service role full access" on interview_questions for all using (true);
create policy "Service role full access" on interview_reports for all using (true);

-- Anon can read own interviews
create policy "Users can view own interviews" on interviews
  for select using (auth.uid()::text = user_id);
create policy "Users can view own questions" on interview_questions
  for select using (
    interview_id in (select id from interviews where user_id = auth.uid()::text)
  );
create policy "Users can view own reports" on interview_reports
  for select using (
    interview_id in (select id from interviews where user_id = auth.uid()::text)
  );
