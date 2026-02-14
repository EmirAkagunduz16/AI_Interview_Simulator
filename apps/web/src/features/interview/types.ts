export type QuestionType = "audio" | "video" | "mcq" | "coding";

export type InterviewField =
  | "backend"
  | "frontend"
  | "fullstack"
  | "mobile"
  | "devops";

export interface FieldInfo {
  id: InterviewField;
  title: string;
  description: string;
  icon: string;
  technologies: string[];
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  timeLimit: number;
  code?: string;
}

export interface InterviewState {
  selectedField: InterviewField | null;
  questions: Question[];
  currentQuestionIndex: number;
  totalQuestions: number;
  timeRemaining: number;
  isTimerRunning: boolean;
  answers: Record<string, string | string[]>;
  isInterviewStarted: boolean;
  isInterviewCompleted: boolean;
}

export interface UserInfo {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

export const INTERVIEW_FIELDS: FieldInfo[] = [
  {
    id: "backend",
    title: "Backend Geliştirici",
    description:
      "Sunucu taraflı uygulamalar, API geliştirme ve veritabanı yönetimi",
    icon: "⚙️",
    technologies: ["Java", "Node.js", "Python", "PostgreSQL", "MongoDB"],
  },
  {
    id: "frontend",
    title: "Frontend Geliştirici",
    description:
      "Kullanıcı arayüzleri, web uygulamaları ve interaktif deneyimler",
    icon: "🎨",
    technologies: ["React", "Vue.js", "TypeScript", "CSS", "Tailwind"],
  },
  {
    id: "fullstack",
    title: "Fullstack Geliştirici",
    description:
      "Hem frontend hem backend teknolojilerinde uçtan uca geliştirme",
    icon: "🚀",
    technologies: ["React", "Node.js", "TypeScript", "PostgreSQL", "Docker"],
  },
  {
    id: "mobile",
    title: "Mobil Geliştirici",
    description: "iOS ve Android için native ve cross-platform uygulamalar",
    icon: "📱",
    technologies: ["React Native", "Flutter", "Swift", "Kotlin"],
  },
  {
    id: "devops",
    title: "DevOps Mühendisi",
    description: "CI/CD, bulut altyapısı ve sistem otomasyonu",
    icon: "☁️",
    technologies: ["Docker", "Kubernetes", "AWS", "Terraform", "Jenkins"],
  },
];
