/**
 * Static interview configuration data.
 * All Turkish-localized field options, tech stacks, and difficulty levels.
 */

export interface FieldOption {
  id: string;
  label: string;
  icon: string;
}

export interface DifficultyOption {
  id: string;
  label: string;
  desc: string;
}

export const FIELDS: FieldOption[] = [
  { id: "backend", label: "Backend", icon: "🖥️" },
  { id: "frontend", label: "Frontend", icon: "🎨" },
  { id: "fullstack", label: "Fullstack", icon: "⚡" },
  { id: "mobile", label: "Mobile", icon: "📱" },
  { id: "devops", label: "DevOps", icon: "🔧" },
  { id: "data_science", label: "Data Science", icon: "📊" },
];

export const TECH_OPTIONS: Record<string, string[]> = {
  backend: [
    "Node.js",
    "NestJS",
    "Express",
    "Python",
    "Django",
    "FastAPI",
    "Java",
    "Spring Boot",
    "Go",
    "Rust",
    "C#",
    ".NET",
  ],
  frontend: [
    "React",
    "Next.js",
    "Vue.js",
    "Angular",
    "Svelte",
    "TypeScript",
    "Tailwind CSS",
    "Material UI",
  ],
  fullstack: [
    "React",
    "Next.js",
    "Node.js",
    "NestJS",
    "TypeScript",
    "Python",
    "Django",
    "Vue.js",
    "Angular",
  ],
  mobile: [
    "React Native",
    "Flutter",
    "Swift",
    "Kotlin",
    "SwiftUI",
    "Jetpack Compose",
    "Expo",
  ],
  devops: [
    "Docker",
    "Kubernetes",
    "AWS",
    "GCP",
    "Azure",
    "Terraform",
    "CI/CD",
    "Jenkins",
    "GitHub Actions",
  ],
  data_science: [
    "Python",
    "TensorFlow",
    "PyTorch",
    "Pandas",
    "NumPy",
    "SQL",
    "Spark",
    "R",
  ],
};

export const DIFFICULTIES: DifficultyOption[] = [
  { id: "junior", label: "Junior", desc: "0-2 yıl deneyim" },
  { id: "intermediate", label: "Mid-Level", desc: "2-5 yıl deneyim" },
  { id: "senior", label: "Senior", desc: "5+ yıl deneyim" },
];
