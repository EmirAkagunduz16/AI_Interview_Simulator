'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Button from '../../../../common/components/Button'
import './instructions-card.styles.scss'

interface Instruction {
  id: number
  title: string
  description: string
}

const instructions: Instruction[] = [
  {
    id: 1,
    title: 'Yapay Zeka İzlemesi:',
    description: 'Bu mülakat yapay zeka desteklidir, bu nedenle üçüncü taraf yardımı almayın. Tespit edilirse mülakat derhal sonlandırılır ve bir sonraki tura geçemezsiniz.',
  },
  {
    id: 2,
    title: 'Soru Türleri ve Süreleri:',
    description: 'Mülakat; çoktan seçmeli, sesli yanıt, video yanıt ve kodlama sorularından oluşur. Her birinin belirli zaman sınırları vardır. Gerçek sorulardan önce bir demo soru sunulacaktır.',
  },
  {
    id: 3,
    title: 'Cevap Kesinliği:',
    description: 'Bir cevap gönderildikten sonra değiştirilemez. Yanıtlarınız mülakatın sonunda değerlendirilecektir.',
  },
]

const InstructionsCard = () => {
  const router = useRouter()

  const handleNext = () => {
    router.push('/interview/demo')
  }

  return (
    <div className="instructions-card">
      <div className="instructions-card__list">
        {instructions.map((instruction) => (
          <div key={instruction.id} className="instructions-card__item">
            <div className="instructions-card__number">
              {instruction.id}
            </div>
            <div className="instructions-card__content">
              <h3 className="instructions-card__title">{instruction.title}</h3>
              <p className="instructions-card__description">{instruction.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="instructions-card__action">
        <Button onClick={handleNext}>İleri</Button>
      </div>
    </div>
  )
}

export default InstructionsCard
