"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import logo from "../../../../assets/logo.png";
import "./navbar.styles.scss";

const Navbar = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
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
        {isAuthenticated && (
          <>
            <a
              href="/dashboard"
              onClick={(e) => {
                e.preventDefault();
                router.push("/dashboard");
              }}
            >
              Dashboard
            </a>
            <a
              href="/interview"
              onClick={(e) => {
                e.preventDefault();
                router.push("/interview");
              }}
            >
              Mulakat
            </a>
          </>
        )}
      </div>

      <div className="navbar__actions">
        {isAuthenticated ? (
          <>
            <span className="navbar__user-name">
              {user?.name || user?.email}
            </span>
            <button className="navbar__btn navbar__btn--logout" onClick={logout}>
              Cikis
            </button>
          </>
        ) : (
          <>
            <button
              className="navbar__btn navbar__btn--login"
              onClick={() => router.push("/login")}
            >
              Giris Yap
            </button>
            <button
              className="navbar__btn navbar__btn--signup"
              onClick={() => router.push("/register")}
            >
              Kayit Ol
            </button>
          </>
        )}

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
          {isAuthenticated ? (
            <>
              <a
                href="/dashboard"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  router.push("/dashboard");
                }}
              >
                Dashboard
              </a>
              <a
                href="/interview"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  router.push("/interview");
                }}
              >
                Mulakat
              </a>
              <button
                className="navbar__btn navbar__btn--logout navbar__btn--mobile"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
              >
                Cikis ({user?.name || user?.email})
              </button>
            </>
          ) : (
            <>
              <button
                className="navbar__btn navbar__btn--login navbar__btn--mobile"
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push("/login");
                }}
              >
                Giris Yap
              </button>
              <button
                className="navbar__btn navbar__btn--signup navbar__btn--mobile"
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push("/register");
                }}
              >
                Kayit Ol
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
