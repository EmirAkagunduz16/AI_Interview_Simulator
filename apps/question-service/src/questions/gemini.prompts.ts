/**
 * Prompt builder functions for Gemini API calls.
 * Keeping prompts in a dedicated file makes them easy to review and tune
 * without touching service logic.
 */

/** Builds the prompt for generating interview questions. */
export function buildGenerateQuestionsPrompt(
  field: string,
  techStack: string[],
  difficulty: string,
  count: number,
): string {
  return `Sen bir teknik mülakat uzmanısın. Aşağıdaki bilgilere göre ${count} adet özgün mülakat sorusu oluştur.

Alan: ${field}
Teknolojiler: ${techStack.join(", ")}
Seviye: ${difficulty}

Kurallar:
- Sorular Türkçe olmalı
- Her soru "${field}" alanı ve belirtilen teknolojilerle doğrudan ilgili olmalı
- Sorular "${difficulty}" seviyesine uygun olmalı
- Açık uçlu, düşündürücü sorular sor
- Hem teori hem pratik soruları karıştır
- Her soru benzersiz olmalı, birbirine benzer sorular olmasın

JSON formatında yanıt ver:
[
  {
    "title": "Kısa soru başlığı",
    "content": "Tam soru metni — detaylı ve açıklayıcı",
    "sampleAnswer": "Beklenen cevabın özeti (2-3 cümle)"
  }
]

Sadece JSON dizisi döndür, başka hiçbir şey yazma.`;
}

/** Builds the prompt for classifying a community-submitted question. */
export function buildClassifyQuestionPrompt(content: string): string {
  return `Sen kıdemli bir teknik mülakat uzmanısın. Verilen soruyu analiz edip sınıflandır.

SORU:
"""
${content}
"""

══════════════════════════════════════════════
ADIM 1 — ALAN (category)
══════════════════════════════════════════════

Geçerli değerler (yalnızca bu 6 değerden biri):
  backend      | data_science | devops | frontend | fullstack | mobile

Karar ağacı — SIRAYLA kontrol et:

1. Soruda şunlardan biri var mı?
   iOS, Android, Swift, Kotlin, Flutter, "React Native", "mobil uygulama", "cross-platform uygulama"
   → EVET ise: "mobile". DURAKSAMA, başka seçeneğe geçme.

2. Soruda şunlardan biri var mı?
   makine öğrenmesi, derin öğrenme, "Overfitting", "Underfitting", neural network, model eğit,
   scikit-learn, TensorFlow, PyTorch, pandas, numpy, veri bilimi, NLP, "Computer Vision",
   regresyon, sınıflandırma modeli, bias-variance, gradient descent
   → EVET ise: "data_science". Asla "backend" yazma.

3. Soruda şunlardan biri var mı?
   Docker, Kubernetes, CI/CD, Terraform, Helm, Jenkins, "GitHub Actions", pipeline, deployment, monitoring
   → EVET ise: "devops".

4. Soru YALNIZCA tarayıcı/UI konusunda mı?
   (React/Vue/Angular/HTML/CSS/DOM ve backend bileşeni YOK)
   → EVET ise: "frontend".

5. Soru hem frontend (React/Vue/CSS) hem backend (API/DB/NestJS) bileşenini AÇIKÇA birlikte ele alıyor mu?
   → İKİSİ DE VARSA: "fullstack". Eğer sadece biri varsa ya da belli değilse "fullstack" YASAK.

6. Diğer tüm durumlar (NestJS, Node.js, Express, Django, Spring, SQL/NoSQL, Redis, Kafka,
   REST/gRPC/GraphQL API, JWT, Microservices, System Design, Blockchain, ZKP, sharding, caching…)
   → "backend".

══════════════════════════════════════════════
ADIM 2 — ZORLUK (difficulty)
══════════════════════════════════════════════

Geçerli değerler (yalnızca bu 3 değerden biri):
  junior | intermediate | senior

─────────────────────────────────────────────
TEMEL ÇERÇEVE — şu soruyu sor:
"Bu soruyu cevaplamak için ne kadar deneyim gerekir?"
─────────────────────────────────────────────

► ADIM A — Önce SENIOR kontrol et:
  Aşağıdakilerden biri varsa → "senior":
  • Dağıtık/ölçekli sistem tasarımı: dağıtık, distributed, CAP teoremi, eventual consistency,
    sharding, replication, yüksek trafik, saniyede milyonlarca istek, load balancing
  • Kriptografik/protokol derinliği: ZKP, ZK-SNARKs, TLS el sıkışması, matematiksel güvenlik
  • Mimari karar + tradeoff: CQRS, Event Sourcing, Saga, microservice vs monolith, tradeoff
  • Üretim ortamı tasarımı: MLOps, model drift, production pipeline, deployment stratejisi

► ADIM B — Sonra JUNIOR kontrol et:
  Cevabı bulmak için giriş düzeyi (beginner) belgesi yeterliyse → "junior".
  Bu iki soruyu sor:
    1) Soru bir ya da birkaç kavramın TANIMI ya da TEMEL AÇIKLAMASI mı istiyor?
    2) Cevap ezber ya da doküman okuyunca bulunabilir mi?
  
  Evet ise → "junior". Örüntüler:
  • "X nedir?"                         → junior (tek kavram tanımı)
  • "X nedir ve nasıl çalışır?"        → junior (tanım + basit açıklama)
  • "X ne demek / ne işe yarar?"       → junior
  • "X nasıl kurulur / tanımlanır?"    → junior
  • "X ve Y nelerdir?" — yüzeysel bilgi gerekiyorsa → junior
    (örn. "App Store ve Play Store arasındaki yayınlama farkları nelerdir?" → junior,
           çünkü cevap herhangi bir mobil geliştirici rehberinde geçer)
  • "TCP ile UDP arasındaki temel fark nedir?" → junior (protokol tanımları)

  NOT: Karşılaştırma soruları her zaman intermediate değildir.
  İki şey arasındaki YÜZEYSEL fark (kim/ne/nerede düzeyi) → junior olabilir.
  İki mekanizma arasındaki DERİN fark (nasıl/neden/ne zaman analizi) → intermediate.

► ADIM C — Geri kalan her şey INTERMEDIATE:
  • İki kavramın mekanizma düzeyinde karşılaştırması
    ("Pipe ve Guard'ın çalışma sırası ve yetki mantığı farkı nedir?" → intermediate)
  • Bir aracın/sistemin iç çalışma prensibi (Event Loop, GC, index, connection pool)
  • Framework özelliğinin kullanım senaryoları ve ne zaman tercih edilir
  • Teknoloji seçimi için teknik kriterlerin değerlendirilmesi
  • Problem çözme — belirli bir senaryoda nasıl yaklaşılır

─────────────────────────────────────────────
KALİBRASYON ÖRNEKLERİ:
─────────────────────────────────────────────
  junior:       "NestJS'de Provider nedir?"
  junior:       "NestJS'de Provider nedir ve nasıl çalışır?"
  junior:       "REST API nedir?"
  junior:       "Overfitting nedir?"
  junior:       "App Store ve Google Play'e nasıl uygulama yüklenir; temel farklar nelerdir?"
  junior:       "TCP ile UDP arasındaki temel fark nedir?"
  junior:       "Git commit ve Git push arasındaki fark nedir?"
  intermediate: "Pipe ve Guard'ın NestJS request lifecycle'ındaki farkı ve çalışma sırası"
  intermediate: "Overfitting ve Underfitting'i metriklerle nasıl tespit edersiniz?"
  intermediate: "Native vs Cross-Platform seçimini etkileyen teknik kriterler"
  intermediate: "JavaScript Event Loop nasıl çalışır?"
  intermediate: "CSR / SSR / SSG arasındaki farklar ve ne zaman kullanılır?"
  intermediate: "Index nasıl veritabanı sorgularını hızlandırır?"
  senior:       "CAP Teoremi çerçevesinde mikroservis veri tutarlılığı nasıl sağlanır?"
  senior:       "ZKP / zk-SNARKs matematiksel güvenlik temeli"
  senior:       "Yüksek trafikli API için Database Sharding ve Read Replica stratejisi"
  senior:       "Dağıtık Rate Limiter tasarımı (saniyede milyonlarca istek)"

══════════════════════════════════════════════
ADIM 3 — ETİKETLER (tags)
══════════════════════════════════════════════

2-6 etiket. Türkçe terimleri İngilizce yaz:
  "makine öğrenmesi"→"Machine Learning", "blokzinciri"→"Blockchain", "yapay zeka"→"AI"

══════════════════════════════════════════════
ADIM 4 — BAŞLIK (title)
══════════════════════════════════════════════

50-80 karakter, Türkçe, soru işareti yok.

══════════════════════════════════════════════
ÇIKTI — Yalnızca JSON, başka hiçbir şey yazma:
══════════════════════════════════════════════

{"title":"...","category":"...","difficulty":"...","tags":["...","..."]}`;
}
