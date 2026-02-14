import React from "react";
import Navbar from "../src/features/landing/components/Navbar";
import Hero from "../src/features/landing/components/Hero";
import Features from "../src/features/landing/components/Features";
import HowItWorks from "../src/features/landing/components/HowItWorks";
import Footer from "../src/features/landing/components/Footer";

const Home = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Footer />
    </>
  );
};

export default Home;
