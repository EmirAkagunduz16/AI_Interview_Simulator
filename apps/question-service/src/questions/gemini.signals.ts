/**
 * Keyword lists used by the heuristic classifier.
 * Each list is checked in priority order: mobile → data_science → devops → frontend/backend.
 *
 * Keep these in sync with the decision-tree rules in gemini.prompts.ts.
 */

export const MOBILE_SIGNALS = [
  "ios",
  "android",
  "reactnative", // normalised from "react native"
  "flutter",
  "kotlin",
  "swift",
  "mobile",
  "mobil ", // Turkish "mobil uygulama"
  "cross-platform",
  "cross platform",
  "native app",
];

/** Strong mobile signals used for post-Gemini override. */
export const STRONG_MOBILE_SIGNALS = [
  "reactnative",
  "flutter",
  "kotlin",
  "swift",
  "ios",
  "android",
  "mobil uygulama",
  "mobile app",
];

export const DATA_SCIENCE_SIGNALS = [
  "machine learning",
  "makine öğrenmesi",
  "makine ogrenmesi",
  "derin öğrenme",
  "deep learning",
  "yapay zeka",
  "veri bilimi",
  "veri analizi",
  "overfitting",
  "underfitting",
  "aşırı öğrenme",
  "eksik öğrenme",
  "neural network",
  "sinir ağı",
  "model eğit",
  "eğitim verisi",
  "feature engineering",
  "öznitelik",
  "pandas",
  "numpy",
  "scikit",
  "tensorflow",
  "pytorch",
  "keras",
  "huggingface",
  "transformer",
  "llm",
  "nlp",
  "computer vision",
  "data science",
  "bias-variance",
  "cross-validation",
  "cross validation",
  "gradient descent",
  "loss function",
  "regularization",
  "regresyon",
  "regression",
  "sınıflandırma modeli",
];

/** Strong data science signals used for post-Gemini override. */
export const STRONG_DATA_SCIENCE_SIGNALS = [
  "makine öğrenmesi",
  "machine learning",
  "overfitting",
  "underfitting",
  "neural network",
  "sinir ağı",
  "derin öğrenme",
  "deep learning",
  "model eğit",
  "yapay zeka",
];

export const DEVOPS_SIGNALS = [
  "kubernetes",
  "k8s",
  "ci/cd",
  "terraform",
  "helm",
  "jenkins",
  "github actions",
  "gitlab ci",
  "devops",
  "deployment pipeline",
  "prometheus",
  "grafana",
  "ansible",
];

/** Frontend signals — intentionally excludes plain "react" to avoid false positives. */
export const FRONTEND_SIGNALS = [
  "react.js",
  "reactjs",
  "vue.js",
  "vuejs",
  "angular",
  "html",
  "css",
  " dom ",
  "tarayıcı api",
  "browser api",
  "state management",
  "redux",
  "zustand",
  "tailwind",
  "scss",
  "webpack",
  "vite",
  "next.js rendering",
  "nuxt",
  "frontend",
  "client-side rendering",
  "server-side rendering",
  "static site",
  "ui component",
  "responsive design",
];

export const BACKEND_SIGNALS = [
  "nestjs",
  "express",
  "node.js",
  "nodejs",
  "fastapi",
  "django",
  "spring",
  "laravel",
  "flask",
  "rails",
  "graphql",
  "grpc",
  "sql",
  "nosql",
  "mongodb",
  "postgresql",
  "mysql",
  "redis",
  "rabbitmq",
  "kafka",
  "microservice",
  "middleware",
  "event loop",
  "orm",
  "prisma",
  "typeorm",
  "authentication",
  "jwt",
  "dependency injection",
  "system design",
  "rate limit",
  "sharding",
  "caching",
  "queue",
  "server",
  "blockchain",
  "kriptografi",
  "cryptography",
  "zero-knowledge",
  "zkp",
  "dağıtık",
  "distributed",
  "cap teoremi",
];

// ─── Difficulty signals ─────────────────────────────────────────────────────

export const SENIOR_SIGNALS = [
  // Distributed systems
  "dağıtık sistem",
  "dağıtık bir",   // "dağıtık bir rate limiter", "dağıtık bir servis"
  "dağıtık mimari",
  "distributed system",
  "distributed transaction",
  "distributed ",   // catches "distributed rate limiter", "distributed cache" etc.
  "eventual consistency",
  "cap teoremi",
  "cap theorem",
  "consensus",
  "raft ",
  "paxos",
  // Scale & performance design
  "sharding",
  "horizontal scaling",
  "yüksek trafik",
  "high traffic",
  "milyonlarca istek",
  "millions of request",
  "rate limiter tasarla",
  "nasıl tasarlan",  // "nasıl tasarlanır?" = design question → senior
  "sistem tasarla",
  "system design",
  "sistem mimarisi",
  "microservis mimarisi",
  // Architectural patterns
  "cqrs",
  "event sourcing",
  "saga pattern",
  // Cryptography & security protocols
  "zero-knowledge proof",
  "zk-snark",
  "zkp",
  "kriptografik güvenlik",
  "cryptographic security",
  "mathematical security",
  "matematiksel güvenlik",
  "protokolün çalışma mantığı",
  "protocol design",
  // ML/Data engineering at scale
  "mlops",
  "model drift",
  "production pipeline",
  "data pipeline",
  // Infrastructure design
  "replication stratej",
  "database sharding",
  "read replica",
  "load balanc",
  "yük dengeleme",
  "cdn stratej",
  // Security threats & analysis
  "güvenlik açığı analiz",
  "saldırı vektörü",
  // Trade-off / architecture decisions
  "tradeoff",
  "trade-off",
  "mimari karar",
  "architectural decision",
];

/**
 * Linguistic patterns that identify JUNIOR questions based on Turkish question grammar.
 * These are applied WITHOUT any length restriction — length is not a reliable signal.
 *
 * Principle: a question is junior when it asks for a DEFINITION or a BASIC FACTUAL answer
 * that any beginner can find in introductory documentation.
 *
 * Each pattern matches a distinct question form:
 *
 *   "X nedir ve nasıl çalışır?"   → definition + simple explanation (compound junior)
 *   "X ne demek / ne demektir?"   → meaning/definition
 *   "X ne işe yarar?"             → purpose/utility definition
 *   "X ne için kullanılır?"        → use-case at the most basic level
 *   "X nasıl tanımlanır?"         → definition
 *   "X nasıl kurulur?"            → basic setup procedure
 */
export const JUNIOR_DEFINITIVE_PATTERNS: RegExp[] = [
  // "X nedir ve nasıl çalışır?" — compound but still definitional
  /\bnedir\b.{0,100}\bnasıl\s+çalışır\b/i,
  // "ne demek" / "ne demektir"
  /\bne\s+demek(tir)?\s*[?!.]?\s*$/i,
  // "ne işe yarar?"
  /\bne\s+işe\s+yarar\s*[?!.]?\s*$/i,
  // "ne için kullanılır?"
  /\bne\s+için\s+kullanılır\s*[?!.]?\s*$/i,
  // "nasıl tanımlanır?"
  /\bnasıl\s+tanımlan/i,
  // "nasıl kurulur?"
  /\bnasıl\s+kurulur\s*[?!.]?\s*$/i,
];

/**
 * Matches questions that END with "nedir?" or "nelerdir?" — these are definitional
 * IF the question is not asking about a mechanism comparison or design decision.
 */
export const JUNIOR_NEDIR_PATTERN = /\bnedir\s*[?!.]?\s*$/i;
export const JUNIOR_NELERDIR_PATTERN = /\bnelerdir\s*[?!.]?\s*$/i;

/**
 * When present in a question that ends with "nedir?" or "nelerdir?",
 * these terms indicate the question is actually INTERMEDIATE (comparison / mechanism).
 *
 * Principle: these words show the question requires understanding beyond definitions.
 */
export const COMPARISON_OR_MECHANISM_TERMS = [
  // Explicit comparison phrases
  "arasındaki fark",
  "ile fark",
  " farkı ",
  " farkını ",
  "karşılaştır",
  "karşılaştırınız",
  // Decision / evaluation — requires experience, not just facts
  "hangi durumlarda",
  "ne zaman tercih",
  "nasıl implemente",
  "nasıl optimize",
  "nasıl yönet",
  "nasıl sağlan",
  "hangi strateji",
  "hangi yaklaşım",
  "performans açısından",
  // Selection criteria — implies analysis, not definitions
  "seçimini etkileyen",
  "seçim kriteri",
  "etkileyen faktörler",
  "teknik kriterler",
  "kriterler nelerdir",
  "avantaj ve dezavantaj",
  "avantajları ve dezavantajları",
];
