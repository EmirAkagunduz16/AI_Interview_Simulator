'use client'

import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import logo from '../../../../assets/logo.png'
import './navbar.styles.scss'

const Navbar = () => {
  const router = useRouter()

  return (
    <nav className="navbar">
      <div className="navbar__logo" onClick={() => router.push('/')}>
        <Image src={logo} alt="AI Coach" width={150} height={38} priority />
      </div>
      
      <div className="navbar__links">
        <a href="#features">Özellikler</a>
        <a href="#how-it-works">Nasıl Çalışır?</a>
        <a href="#pricing">Fiyatlandırma</a>
      </div>
      
      <div className="navbar__actions">
        <button className="navbar__btn navbar__btn--login">Giriş Yap</button>
        <button 
          className="navbar__btn navbar__btn--signup"
          onClick={() => router.push('/select-field')}
        >
          Ücretsiz Başla
        </button>
      </div>
    </nav>
  )
}

export default Navbar
