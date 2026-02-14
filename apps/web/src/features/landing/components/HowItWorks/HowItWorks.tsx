"use client";

import React from "react";
import { useRouter } from "next/navigation";
import "./how-it-works.styles.scss";

const steps = [
  {
    number: "01",
    title: "Alan Secin",
    description:
      "Backend, Frontend, Fullstack, Mobile veya DevOps gibi uzmanlik alaninizi secin. Sorular sectiginiz alana gore hazirlanir.",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Bilgilerinizi Girin",
    description:
      "Ad, e-posta gibi temel bilgilerinizi doldurun ve kisa tanitim videosunu izleyerek sistemi taniyin.",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Mulakata Baslayin",
    description:
      "Sesli, goruntulu, coktan secmeli ve kodlama sorulariyla gercek bir mulakat deneyimi yasayin. Her sorunun belirli bir suresi vardir.",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Sonuclari Gorun",
    description:
      "Mulakat tamamlandiginda AI destekli analizle performansinizi goruntuleyin, guclu ve zayif yonlerinizi kesfedein.",
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

const HowItWorks = () => {
  const router = useRouter();

  return (
    <section className="how-it-works" id="how-it-works">
      <div className="how-it-works__header">
        <span className="how-it-works__tag">Nasil Calisir?</span>
        <h2 className="how-it-works__title">
          4 Basit Adimda
          <br />
          <span className="how-it-works__title-highlight">
            Mulakatinizi Tamamlayin
          </span>
        </h2>
        <p className="how-it-works__subtitle">
          Platformumuzu kullanmak cok kolay. Birka&ccedil; dakika i&ccedil;inde
          mulakat pratigi yapmaya baslayabilirsiniz.
        </p>
      </div>

      <div className="how-it-works__steps">
        {steps.map((step, index) => (
          <div key={step.number} className="how-it-works__step">
            <div className="how-it-works__step-icon">{step.icon}</div>
            <div className="how-it-works__step-number">{step.number}</div>
            <h3 className="how-it-works__step-title">{step.title}</h3>
            <p className="how-it-works__step-description">{step.description}</p>
            {index < steps.length - 1 && (
              <div className="how-it-works__connector">
                <svg width="40" height="12" viewBox="0 0 40 12" fill="none">
                  <path
                    d="M0 6h32m0 0l-6-5m6 5l-6 5"
                    stroke="#00bfa5"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="how-it-works__cta">
        <button
          className="how-it-works__btn"
          onClick={() => router.push("/interview")}
        >
          Hemen Deneyin
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </section>
  );
};

export default HowItWorks;
