'use client'

import Image from 'next/image'
import React from 'react'
import logo from '../../../assets/logo.png'
import './header.styles.scss'

interface HeaderProps {
  showFaqs?: boolean;
  showTimer?: boolean;
  showUserProfile?: boolean;
  timeRemaining?: number;
  userName?: string;
}

const Header = ({ 
  showFaqs = true, 
  showTimer = false, 
  showUserProfile = false,
  timeRemaining = 0,
  userName = 'Emir'
}: HeaderProps) => {
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className='header'>
      <div className='header__logo'>
        <Image src={logo} alt='happierwork logo' width={160} height={40} priority />
      </div>
      
      <div className='header__right'>
        {showTimer && (
          <div className='header__timer'>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            {formatTime(timeRemaining)}
          </div>
        )}
        
        {showFaqs && (
          <button className='header__faqs-btn'>
            <span className='header__faqs-icon'>?</span>
            FAQs
          </button>
        )}
        
        {showUserProfile && (
          <div className='header__user'>
            <div className='header__user-avatar'>
              <span>{userName.charAt(0).toUpperCase()}</span>
            </div>
            <span className='header__user-name'>{userName}</span>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header