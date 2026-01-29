'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch } from '../../../../common/hooks/useAppDispatch'
import { setUser } from '../../../auth/store/authSlice'
import Card from '../../../../common/components/Card'
import Button from '../../../../common/components/Button'
import Input from '../../../../common/components/Input'
import './basic-details-form.styles.scss'

const BasicDetailsForm = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleBack = () => {
    router.push('/interview/welcome')
  }

  const handleNext = () => {
    dispatch(setUser({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
    }))
    router.push('/interview/tutorial')
  }

  return (
    <Card title="Temel Bilgileri Doldurun" className="basic-details-form">
      <form onSubmit={(e) => e.preventDefault()}>
        <Input 
          label="Adınız Soyadınız"
          placeholder="Ahmet Yılmaz"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
        
        <Input 
          label="E-posta"
          type="email"
          placeholder="ahmet.yilmaz@mail.com"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
        
        <Input 
          label="Telefon Numarası"
          type="tel"
          placeholder="532 123 45 67"
          prefix="+90"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />
        
        <div className="basic-details-form__actions">
          <Button variant="secondary" onClick={handleBack}>Geri</Button>
          <Button onClick={handleNext}>İleri</Button>
        </div>
      </form>
    </Card>
  )
}

export default BasicDetailsForm
