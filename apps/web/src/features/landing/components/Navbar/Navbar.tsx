"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logo from "../../../../assets/logo.png";
import "./navbar.styles.scss";

const Navbar = () => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar__logo" onClick={() => router.push("/")}>
        <Image src={logo} alt="AI Coach" width={150} height={38} priority />
      </div>

      <div
        className={`navbar__links ${mobileMenuOpen ? "navbar__links--open" : ""}`}
      >
        <a
          href="#features"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection("features");
          }}
        >
          Ozellikler
        </a>
        <a
          href="#how-it-works"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection("how-it-works");
          }}
        >
          Nasil Calisir?
        </a>
      </div>

      <div className="navbar__actions">
        <button
          className="navbar__btn navbar__btn--signup"
          onClick={() => router.push("/interview")}
        >
          Mulakata Git
        </button>

        <button
          className={`navbar__hamburger ${mobileMenuOpen ? "navbar__hamburger--open" : ""}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="navbar__mobile-menu">
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("features");
            }}
          >
            Ozellikler
          </a>
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("how-it-works");
            }}
          >
            Nasil Calisir?
          </a>
          <button
            className="navbar__btn navbar__btn--signup navbar__btn--mobile"
            onClick={() => {
              setMobileMenuOpen(false);
              router.push("/interview");
            }}
          >
            Mulakata Git
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
