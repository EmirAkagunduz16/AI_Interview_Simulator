"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Sparkles } from "lucide-react";
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
      <div
        className="navbar__logo"
        onClick={() => router.push("/")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            padding: "6px",
            borderRadius: "8px",
          }}
        >
          <Sparkles color="white" size={20} />
        </div>
        <span
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            background: "linear-gradient(to right, #fff, #a5b4fc)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          AI Coach
        </span>
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
          Özellikler
        </a>
        <a
          href="#how-it-works"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection("how-it-works");
          }}
        >
          Nasıl Çalışır?
        </a>
        {isAuthenticated && (
          <>
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              Dashboard
            </Link>
            <Link href="/interview" onClick={() => setMobileMenuOpen(false)}>
              Mülakat
            </Link>
          </>
        )}
      </div>

      <div className="navbar__actions">
        {isAuthenticated ? (
          <>
            <span className="navbar__user-name">
              {user?.name || user?.email}
            </span>
            <button
              className="navbar__btn navbar__btn--logout"
              onClick={logout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="navbar__btn navbar__btn--login">
              Giriş Yap
            </Link>
            <Link href="/register" className="navbar__btn navbar__btn--signup">
              Kayıt Ol
            </Link>
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
            Özellikler
          </a>
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("how-it-works");
            }}
          >
            Nasıl Çalışır?
          </a>
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                Dashboard
              </Link>
              <Link href="/interview" onClick={() => setMobileMenuOpen(false)}>
                Mülakat
              </Link>
              <button
                className="navbar__btn navbar__btn--logout navbar__btn--mobile"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
              >
                Logout ({user?.name || user?.email})
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="navbar__btn navbar__btn--login navbar__btn--mobile"
                onClick={() => setMobileMenuOpen(false)}
              >
                Giriş Yap
              </Link>
              <Link
                href="/register"
                className="navbar__btn navbar__btn--signup navbar__btn--mobile"
                onClick={() => setMobileMenuOpen(false)}
              >
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
