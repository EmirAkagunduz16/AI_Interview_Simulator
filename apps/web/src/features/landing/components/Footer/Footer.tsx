"use client";

import React from "react";
import Image from "next/image";
import logo from "../../../../assets/logo.png";
import "./footer.styles.scss";

const Footer = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

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
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("how-it-works");
              }}
            >
              Nasil Calisir?
            </a>
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("features");
              }}
            >
              Ozellikler
            </a>
          </div>

          <div className="footer__column">
            <h4 className="footer__column-title">Iletisim</h4>
            <a href="mailto:info@aicoach.com.tr">info@aicoach.com.tr</a>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <p>&copy; 2026 AI Coach. Tum haklari saklidir.</p>
      </div>
    </footer>
  );
};

export default Footer;
