'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '../../../../common/hooks/useAppDispatch'
import { setSelectedField } from '../../store/interviewSlice'
import { INTERVIEW_FIELDS, InterviewField } from '../../types'
import './field-selector.styles.scss'

const FieldSelector = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { selectedField } = useAppSelector((state) => state.interview)

  const handleFieldSelect = (fieldId: InterviewField) => {
    dispatch(setSelectedField(fieldId))
  }

  const handleContinue = () => {
    if (selectedField) {
      router.push('/interview/welcome')
    }
  }

  return (
    <div className="field-selector">
      <div className="field-selector__header">
        <h1 className="field-selector__title">Uzmanlık Alanınızı Seçin</h1>
        <p className="field-selector__subtitle">
          Mülakat sorularınız seçtiğiniz alana göre hazırlanacaktır.
          Kendinizi en yetkin hissettiğiniz alanı seçin.
        </p>
      </div>

      <div className="field-selector__grid">
        {INTERVIEW_FIELDS.map((field) => (
          <div 
            key={field.id}
            className={`field-selector__card ${selectedField === field.id ? 'selected' : ''}`}
            onClick={() => handleFieldSelect(field.id)}
          >
            <div className="field-selector__card-icon">{field.icon}</div>
            <h3 className="field-selector__card-title">{field.title}</h3>
            <p className="field-selector__card-description">{field.description}</p>
            <div className="field-selector__card-techs">
              {field.technologies.slice(0, 3).map((tech, index) => (
                <span key={index} className="field-selector__tech-tag">{tech}</span>
              ))}
              {field.technologies.length > 3 && (
                <span className="field-selector__tech-more">+{field.technologies.length - 3}</span>
              )}
            </div>
            <div className="field-selector__card-check">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      <div className="field-selector__action">
        <button 
          className={`field-selector__btn ${!selectedField ? 'disabled' : ''}`}
          onClick={handleContinue}
          disabled={!selectedField}
        >
          Devam Et
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default FieldSelector
