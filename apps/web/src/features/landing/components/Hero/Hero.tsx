'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import './hero.styles.scss'

const Hero = () => {
  const router = useRouter()

  const handleStart = () => {
    router.push('/select-field')
  }

  return (
    <section className="hero">
      <div className="hero__background">
        <div className="hero__gradient" />
        <div className="hero__pattern" />
      </div>
      
      <div className="hero__content">
        <div className="hero__badge">
          <span className="hero__badge-icon">🤖</span>
          <span>Yapay Zeka Destekli</span>
        </div>
        
        <h1 className="hero__title">
          Mülakat Hazırlığında
          <span className="hero__title-highlight"> Yeni Nesil</span>
          <br />
          Deneyim
        </h1>
        
        <p className="hero__subtitle">
          AI Coach ile gerçek mülakat deneyimi yaşayın. Yapay zeka destekli 
          sorular, anlık geri bildirimler ve kişiselleştirilmiş önerilerle 
          hayalinizdeki işe bir adım daha yaklaşın.
        </p>
        
        <div className="hero__cta">
          <button className="hero__btn hero__btn--primary" onClick={handleStart}>
            Mülakata Başla
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
          <button className="hero__btn hero__btn--secondary">
            Nasıl Çalışır?
          </button>
        </div>
        
        <div className="hero__stats">
          <div className="hero__stat">
            <span className="hero__stat-number">10K+</span>
            <span className="hero__stat-label">Başarılı Mülakat</span>
          </div>
          <div className="hero__stat">
            <span className="hero__stat-number">95%</span>
            <span className="hero__stat-label">Memnuniyet Oranı</span>
          </div>
          <div className="hero__stat">
            <span className="hero__stat-number">50+</span>
            <span className="hero__stat-label">Teknoloji Alanı</span>
          </div>
        </div>
      </div>
      
      <div className="hero__visual">
        <div className="hero__card hero__card--1">
          <div className="hero__card-icon">💻</div>
          <span>Kodlama Soruları</span>
        </div>
        <div className="hero__card hero__card--2">
          <div className="hero__card-icon">🎤</div>
          <span>Sesli Yanıtlar</span>
        </div>
        <div className="hero__card hero__card--3">
          <div className="hero__card-icon">📹</div>
          <span>Video Mülakat</span>
        </div>
        <div className="hero__card hero__card--4">
          <div className="hero__card-icon">✅</div>
          <span>Çoktan Seçmeli</span>
        </div>
      </div>
    </section>
  )
}

export default Hero
