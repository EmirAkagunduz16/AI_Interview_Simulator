import { QuestionType, Difficulty } from "../entities/question.entity";
import type { QuestionDocument } from "../entities/question.entity";

/**
 * 50+ Türkçe, alan-spesifik mülakat sorusu.
 * Her soru doğru category (field id) ve tags (teknoloji) ile eşleştirilir.
 */
export function getSeedQuestions(): Partial<QuestionDocument>[] {
  return [
    // ═══════════════════════════════════════════════════════
    // BACKEND — 12 soru
    // ═══════════════════════════════════════════════════════
    {
      title: "NestJS'de modüllerin rolü nedir?",
      content:
        "NestJS'de modüllerin rolü nedir ve neden kullanılır? Bir modülün temel bileşenlerini açıklayın.",
      sampleAnswer:
        "Modüller, uygulamanın farklı bölümlerini organize etmek için kullanılır. Controller, service ve provider'ları bir arada tutar.",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.EASY,
      category: "backend",
      tags: ["NestJS", "Node.js"],
    },
    {
      title: "Dependency Injection nedir?",
      content:
        "Dependency Injection (bağımlılık enjeksiyonu) nedir? NestJS'de nasıl çalışır ve neden önemlidir?",
      sampleAnswer:
        "DI, bağımlılıkların dışarıdan sağlanmasıdır. NestJS'de constructor injection ile yapılır. Test edilebilirlik ve gevşek bağlantı sağlar.",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.EASY,
      category: "backend",
      tags: ["NestJS", "Node.js"],
    },
    {
      title: "Middleware vs Guard vs Interceptor farkı",
      content:
        "NestJS'de middleware, guard ve interceptor arasındaki farkları açıklayın. Hangi durumlarda hangisini kullanırsınız?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "backend",
      tags: ["NestJS", "Node.js"],
    },
    {
      title: "REST API tasarım prensipleri",
      content:
        "RESTful API tasarlarken dikkat ettiğiniz temel prensipler nelerdir? İyi bir API endpoint yapısı nasıl olmalıdır?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.EASY,
      category: "backend",
      tags: ["Node.js", "Express", "NestJS"],
    },
    {
      title: "Express.js middleware zinciri nasıl çalışır?",
      content:
        "Express.js'de middleware zinciri nasıl çalışır? next() fonksiyonunun rolünü açıklayın.",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.EASY,
      category: "backend",
      tags: ["Express", "Node.js"],
    },
    {
      title: "Node.js Event Loop",
      content:
        "Node.js'in event loop mekanizmasını açıklayın. Asenkron işlemler nasıl yönetilir?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "backend",
      tags: ["Node.js"],
    },
    {
      title: "Veritabanı indeksleme stratejileri",
      content:
        "Veritabanlarında indeksleme nedir? Ne zaman ve nasıl indeks oluşturulmalıdır? Performans üzerindeki etkisini açıklayın.",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "backend",
      tags: ["MongoDB", "PostgreSQL"],
    },
    {
      title: "JWT Authentication nasıl çalışır?",
      content:
        "JSON Web Token (JWT) tabanlı kimlik doğrulama nasıl çalışır? Access token ve refresh token farkı nedir?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "backend",
      tags: ["Node.js", "NestJS", "Express"],
    },
    {
      title: "Mikroservis mimarisinin avantajları",
      content:
        "Mikroservis mimarisi nedir? Monolitik mimariye göre avantajları ve dezavantajları nelerdir?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.HARD,
      category: "backend",
      tags: ["Node.js", "NestJS"],
    },
    {
      title: "NestJS Pipe ve DTO kullanımı",
      content:
        "NestJS'de Pipe'lar ne işe yarar? DTO (Data Transfer Object) ile birlikte nasıl kullanılır? Validation pipe örneği verin.",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "backend",
      tags: ["NestJS"],
    },
    {
      title: "Rate limiting ve API güvenliği",
      content:
        "Bir API'da rate limiting neden önemlidir? Nasıl implement edilir? Diğer API güvenlik önlemleri nelerdir?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.HARD,
      category: "backend",
      tags: ["Node.js", "Express", "NestJS"],
    },
    {
      title: "Message queue ve event-driven mimari",
      content:
        "Message queue (Kafka, RabbitMQ) nedir? Event-driven mimaride nasıl kullanılır? Hangi problemleri çözer?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.HARD,
      category: "backend",
      tags: ["Node.js", "NestJS"],
    },

    // ═══════════════════════════════════════════════════════
    // FRONTEND — 12 soru
    // ═══════════════════════════════════════════════════════
    {
      title: "React'ta state kavramı",
      content:
        "React'ta state kavramı nedir ve neden önemlidir? useState hook'unu açıklayın.",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.EASY,
      category: "frontend",
      tags: ["React"],
    },
    {
      title: "React component lifecycle",
      content:
        "React'ta bir component'in yaşam döngüsünü açıklayın. useEffect hook'u hangi lifecycle metodlarının yerini alır?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "frontend",
      tags: ["React"],
    },
    {
      title: "Virtual DOM nedir?",
      content:
        "Virtual DOM nedir ve nasıl çalışır? React'ın performansını nasıl artırır?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.EASY,
      category: "frontend",
      tags: ["React"],
    },
    {
      title: "Next.js SSR vs SSG farkı",
      content:
        "Next.js'de Server-Side Rendering (SSR) ve Static Site Generation (SSG) arasındaki farkları açıklayın. Hangi durumda hangisini tercih edersiniz?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "frontend",
      tags: ["Next.js", "React"],
    },
    {
      title: "React'ta prop drilling sorunu",
      content:
        "Prop drilling nedir? Bu sorunu çözmek için hangi yöntemleri kullanırsınız? Context API ve state management kütüphanelerini karşılaştırın.",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "frontend",
      tags: ["React"],
    },
    {
      title: "useMemo ve useCallback farkı",
      content:
        "React'ta useMemo ve useCallback hook'ları ne işe yarar? Aralarındaki fark nedir? Ne zaman kullanılmalıdır?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "frontend",
      tags: ["React"],
    },
    {
      title: "Next.js App Router vs Pages Router",
      content:
        "Next.js'in App Router ve Pages Router yaklaşımları arasındaki farkları açıklayın. Yeni projelerde hangisini tercih edersiniz?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "frontend",
      tags: ["Next.js", "React"],
    },
    {
      title: "CSS-in-JS vs Utility-first CSS",
      content:
        "CSS-in-JS (styled-components, emotion) ve utility-first CSS (Tailwind) yaklaşımlarını karşılaştırın. Avantaj ve dezavantajları nelerdir?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.EASY,
      category: "frontend",
      tags: ["React", "Next.js"],
    },
    {
      title: "TypeScript generics kullanımı",
      content:
        "TypeScript'te generic tipler ne işe yarar? React component'lerinde nasıl kullanılır? Bir örnek verin.",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.HARD,
      category: "frontend",
      tags: ["TypeScript", "React"],
    },
    {
      title: "React performans optimizasyonu",
      content:
        "React uygulamalarında performans optimizasyonu için hangi teknikleri kullanırsınız? React.memo, lazy loading ve code splitting'i açıklayın.",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.HARD,
      category: "frontend",
      tags: ["React"],
    },
    {
      title: "Client-side vs Server-side rendering",
      content:
        "Client-side rendering ve server-side rendering arasındaki farklar nelerdir? SEO, performans ve kullanıcı deneyimi açısından değerlendirin.",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.EASY,
      category: "frontend",
      tags: ["React", "Next.js"],
    },
    {
      title: "Web erişilebilirlik standartları",
      content:
        "Web erişilebilirliği (accessibility) nedir? ARIA etiketleri ve semantik HTML'in önemi nedir? Projelerinizde nasıl uyguluyorsunuz?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "frontend",
      tags: ["React", "Next.js"],
    },

    // ═══════════════════════════════════════════════════════
    // FULLSTACK — 10 soru
    // ═══════════════════════════════════════════════════════
    {
      title: "Full-stack uygulama mimarisi",
      content:
        "Sıfırdan bir full-stack uygulama tasarlasanız, mimari kararlarınız neler olur? Frontend, backend ve veritabanı seçimlerini gerekçelendirin.",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "fullstack",
      tags: ["React", "Node.js", "NestJS"],
    },
    {
      title: "API tasarımı: REST vs GraphQL",
      content:
        "REST ve GraphQL arasındaki temel farklar nelerdir? Hangi senaryolarda hangisini tercih edersiniz?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "fullstack",
      tags: ["Node.js", "React"],
    },
    {
      title: "Authentication ve Authorization farkı",
      content:
        "Authentication ve authorization kavramları arasındaki farkı açıklayın. Bir web uygulamasında nasıl implement edersiniz?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.EASY,
      category: "fullstack",
      tags: ["Node.js", "React", "NestJS"],
    },
    {
      title: "Monorepo yapısının avantajları",
      content:
        "Monorepo nedir? Multi-repo yaklaşımına göre avantajları ve dezavantajları nelerdir? Hangi araçları kullanırsınız?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "fullstack",
      tags: ["Node.js", "React"],
    },
    {
      title: "Veritabanı seçimi: SQL vs NoSQL",
      content:
        "SQL ve NoSQL veritabanları arasındaki farklar nelerdir? Hangi senaryolarda hangisini tercih edersiniz?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.EASY,
      category: "fullstack",
      tags: ["MongoDB", "PostgreSQL"],
    },
    {
      title: "Caching stratejileri",
      content:
        "Web uygulamalarında caching neden önemlidir? Client-side ve server-side caching stratejilerini açıklayın. Redis'in rolü nedir?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.HARD,
      category: "fullstack",
      tags: ["Node.js", "React"],
    },
    {
      title: "WebSocket vs REST API",
      content:
        "WebSocket ve REST API arasındaki farklar nelerdir? Real-time uygulamalarda WebSocket nasıl kullanılır?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "fullstack",
      tags: ["Node.js", "React"],
    },
    {
      title: "Error handling best practices",
      content:
        "Full-stack bir uygulamada hata yönetimi (error handling) nasıl yapılmalıdır? Frontend ve backend tarafında en iyi pratikler nelerdir?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "fullstack",
      tags: ["Node.js", "React", "NestJS"],
    },
    {
      title: "Testing stratejileri",
      content:
        "Unit test, integration test ve e2e test arasındaki farklar nelerdir? Test piramidi kavramını açıklayın.",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "fullstack",
      tags: ["Node.js", "React"],
    },
    {
      title: "Deployment ve CI/CD pipeline",
      content:
        "Bir full-stack uygulamayı production'a nasıl deploy edersiniz? CI/CD pipeline'ın temel adımları nelerdir?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.HARD,
      category: "fullstack",
      tags: ["Node.js", "React"],
    },

    // ═══════════════════════════════════════════════════════
    // MOBILE — 8 soru
    // ═══════════════════════════════════════════════════════
    {
      title: "React Native vs Native geliştirme",
      content:
        "React Native ile native (Swift/Kotlin) geliştirme arasındaki farklar nelerdir? Hangi senaryolarda hangisini tercih edersiniz?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.EASY,
      category: "mobile",
      tags: ["React Native"],
    },
    {
      title: "React Native performans optimizasyonu",
      content:
        "React Native uygulamalarında performans sorunlarını nasıl tespit eder ve çözersiniz? FlatList optimizasyonu nasıl yapılır?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "mobile",
      tags: ["React Native"],
    },
    {
      title: "Mobil uygulama state yönetimi",
      content:
        "Bir mobil uygulamada state yönetimi nasıl yapılmalıdır? Redux, MobX veya Zustand gibi araçları karşılaştırın.",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "mobile",
      tags: ["React Native"],
    },
    {
      title: "Flutter widget sistemi",
      content:
        "Flutter'da widget kavramı nedir? StatelessWidget ve StatefulWidget arasındaki farkı açıklayın.",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.EASY,
      category: "mobile",
      tags: ["Flutter"],
    },
    {
      title: "Mobil uygulama güvenliği",
      content:
        "Mobil uygulamalarda güvenlik önlemleri nelerdir? Token saklama, SSL pinning ve veri şifreleme nasıl yapılır?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.HARD,
      category: "mobile",
      tags: ["React Native", "Flutter"],
    },
    {
      title: "Native modül entegrasyonu",
      content:
        "React Native'de native modül yazmak neden gerekir? Bridge mekanizması nasıl çalışır?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.HARD,
      category: "mobile",
      tags: ["React Native"],
    },
    {
      title: "Mobil uygulama test stratejileri",
      content:
        "Mobil uygulamalarda test stratejisi nasıl olmalıdır? Detox veya Appium gibi araçları kullandınız mı?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "mobile",
      tags: ["React Native", "Flutter"],
    },
    {
      title: "Offline-first mobil uygulama",
      content:
        "Offline-first bir mobil uygulama nasıl tasarlanır? Veri senkronizasyonu ve çakışma çözümü nasıl yapılır?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.HARD,
      category: "mobile",
      tags: ["React Native", "Flutter"],
    },

    // ═══════════════════════════════════════════════════════
    // DEVOPS — 6 soru
    // ═══════════════════════════════════════════════════════
    {
      title: "Docker container vs VM farkı",
      content:
        "Docker container ve sanal makine (VM) arasındaki farklar nelerdir? Container teknolojisinin avantajları nelerdir?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.EASY,
      category: "devops",
      tags: ["Docker"],
    },
    {
      title: "Docker Compose kullanımı",
      content:
        "Docker Compose nedir? Multi-container uygulamaları nasıl yönetir? Bir docker-compose.yml dosyasının temel bileşenlerini açıklayın.",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "devops",
      tags: ["Docker"],
    },
    {
      title: "Kubernetes temel kavramları",
      content:
        "Kubernetes'in temel kavramlarını açıklayın: Pod, Service, Deployment, Ingress. Container orchestration neden önemlidir?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "devops",
      tags: ["Kubernetes", "Docker"],
    },
    {
      title: "CI/CD pipeline tasarımı",
      content:
        "İdeal bir CI/CD pipeline nasıl olmalıdır? GitHub Actions veya GitLab CI ile nasıl kurarsınız? Hangi adımlar bulunmalıdır?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "devops",
      tags: ["CI/CD"],
    },
    {
      title: "Infrastructure as Code",
      content:
        "Infrastructure as Code (IaC) nedir? Terraform veya Ansible gibi araçları kullandınız mı? Avantajları nelerdir?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.HARD,
      category: "devops",
      tags: ["Docker", "Kubernetes"],
    },
    {
      title: "Monitoring ve logging stratejileri",
      content:
        "Production ortamında monitoring ve logging nasıl yapılır? Prometheus, Grafana veya ELK Stack deneyiminiz var mı?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.HARD,
      category: "devops",
      tags: ["Docker", "Kubernetes"],
    },

    // ═══════════════════════════════════════════════════════
    // DATA SCIENCE — 6 soru
    // ═══════════════════════════════════════════════════════
    {
      title: "Makine öğrenmesi temel kavramları",
      content:
        "Supervised ve unsupervised learning arasındaki farkı açıklayın. Her biri için örnek kullanım alanları verin.",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.EASY,
      category: "data_science",
      tags: ["Python"],
    },
    {
      title: "Overfitting ve underfitting",
      content:
        "Overfitting ve underfitting nedir? Bu sorunları nasıl tespit eder ve çözersiniz? Regularization yöntemlerini açıklayın.",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "data_science",
      tags: ["Python"],
    },
    {
      title: "Pandas ile veri manipülasyonu",
      content:
        "Pandas kütüphanesi ile veri temizleme ve ön işleme adımlarını açıklayın. Eksik verileri nasıl yönetirsiniz?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.EASY,
      category: "data_science",
      tags: ["Python"],
    },
    {
      title: "Feature engineering",
      content:
        "Feature engineering nedir? Bir makine öğrenmesi projesinde feature selection ve feature extraction nasıl yapılır?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "data_science",
      tags: ["Python"],
    },
    {
      title: "Model değerlendirme metrikleri",
      content:
        "Accuracy, precision, recall ve F1-score arasındaki farkları açıklayın. Hangi senaryolarda hangisi daha önemlidir?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.MEDIUM,
      category: "data_science",
      tags: ["Python"],
    },
    {
      title: "Derin öğrenme temelleri",
      content:
        "Neural network'lerin temel yapısını açıklayın. CNN ve RNN arasındaki farklar nelerdir? Hangi problemlerde kullanılırlar?",
      type: QuestionType.TECHNICAL,
      difficulty: Difficulty.HARD,
      category: "data_science",
      tags: ["Python"],
    },
  ];
}
