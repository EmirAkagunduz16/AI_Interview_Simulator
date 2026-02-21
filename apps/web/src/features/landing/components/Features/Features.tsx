import React from "react";
import "./features.styles.scss";

const features = [
  {
    icon: "🎯",
    title: "Kişiselleştirilmiş Sorular",
    description:
      "Seçtiğiniz alana özel, güncel teknolojilere uygun mülakat soruları",
  },
  {
    icon: "🤖",
    title: "AI Destekli Analiz",
    description:
      "Yapay zeka ile yanıtlarınızın anlık analizi ve değerlendirmesi",
  },
  {
    icon: "📊",
    title: "Detaylı Raporlama",
    description: "Performansınızı ölçen kapsamlı raporlar ve gelişim önerileri",
  },
  {
    icon: "🗣️",
    title: "Sesli İletişim",
    description:
      "Gerçek mülakat deneyimi için kesintisiz ve akıcı sesli yapay zeka desteği",
  },
  {
    icon: "⚡",
    title: "Anlık Geri Bildirim",
    description:
      "Verdiğiniz cevaplara anında yapay zeka yorumu ve bir sonraki soruya adaptasyon",
  },
  {
    icon: "⏱️",
    title: "Zaman Yönetimi",
    description: "Her soru için belirlenen süre ile gerçek mülakat simülasyonu",
  },
];

const Features = () => {
  return (
    <section className="features" id="features">
      <div className="features__header">
        <span className="features__tag">Özellikler</span>
        <h2 className="features__title">
          Başarılı Bir Mülakat İçin
          <br />
          <span className="features__title-highlight">
            İhtiyacınız Olan Her Şey
          </span>
        </h2>
        <p className="features__subtitle">
          Modern teknolojiler ve yapay zeka ile desteklenen platformumuz,
          mülakat hazırlığınızı bir üst seviyeye taşır.
        </p>
      </div>

      <div className="features__grid">
        {features.map((feature, index) => (
          <div key={index} className="features__card">
            <div className="features__card-icon">{feature.icon}</div>
            <h3 className="features__card-title">{feature.title}</h3>
            <p className="features__card-description">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
