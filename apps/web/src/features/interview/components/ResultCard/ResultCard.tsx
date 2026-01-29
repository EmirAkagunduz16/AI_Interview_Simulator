'use client'

import React from 'react'
import Card from '../../../../common/components/Card'
import './result-card.styles.scss'

const ResultCard = () => {
  return (
    <div className="result-card-wrapper">
      <Card title="" className="result-card">
        <div className="result-card__content">
          <h2 className="result-card__title">
            Tebrikler <span className="result-card__emoji">🙌</span>
          </h2>
          <p className="result-card__subtitle">
            Mülakatı tamamladığınız için teşekkür ederiz.
          </p>
          <p className="result-card__message">
            Performansınız ekibimiz tarafından değerlendirilecektir.<br />
            En kısa sürede sizinle iletişime geçeceğiz.
          </p>
        </div>
      </Card>
      
      <p className="result-card__contact">
        Sorularınız için bize ulaşın:{' '}
        <a href="mailto:destek@aicoach.com.tr" className="result-card__link">
          destek@aicoach.com.tr
        </a>
      </p>
    </div>
  )
}

export default ResultCard
