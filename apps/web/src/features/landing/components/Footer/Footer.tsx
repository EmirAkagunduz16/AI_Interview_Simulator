import React from 'react'
import Image from 'next/image'
import logo from '../../../../assets/logo.png'
import './footer.styles.scss'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__brand">
          <Image src={logo} alt="AI Coach" width={140} height={35} />
          <p className="footer__tagline">
            Yapay zeka destekli mülakat hazırlık platformu
          </p>
        </div>
        
        <div className="footer__links">
          <div className="footer__column">
            <h4 className="footer__column-title">Platform</h4>
            <a href="#">Nasıl Çalışır?</a>
            <a href="#">Özellikler</a>
            <a href="#">Fiyatlandırma</a>
          </div>
          
          <div className="footer__column">
            <h4 className="footer__column-title">Kaynaklar</h4>
            <a href="#">Blog</a>
            <a href="#">Mülakat İpuçları</a>
            <a href="#">SSS</a>
          </div>
          
          <div className="footer__column">
            <h4 className="footer__column-title">İletişim</h4>
            <a href="mailto:info@aicoach.com.tr">info@aicoach.com.tr</a>
            <a href="#">Destek</a>
          </div>
        </div>
      </div>
      
      <div className="footer__bottom">
        <p>&copy; 2026 AI Coach. Tüm hakları saklıdır.</p>
        <div className="footer__legal">
          <a href="#">Gizlilik Politikası</a>
          <a href="#">Kullanım Koşulları</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
