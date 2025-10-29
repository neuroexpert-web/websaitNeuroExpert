import React from "react";
import "./App.css";
import { Toaster } from "./components/ui/sonner";
import Header from "./components/Header";
import Hero from "./components/Hero";
import ServiceCards from "./components/ServiceCards";
import Portfolio from "./components/Portfolio";
import Advantages from "./components/Advantages";
import Team from "./components/Team";
import ContactForm from "./components/ContactForm";
import AIChat from "./components/AIChat";
import Footer from "./components/Footer";
import StickyCTA from "./components/StickyCTA";

function App() {
  return (
    <div className="App bg-[#0b0f17] min-h-screen relative">
      <Toaster position="top-center" />

      <video
        autoPlay
        muted
        playsInline
        loop
        preload="auto"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          zIndex: 0
        }}
        src="/background.webm"
      />
      
      <div className="relative z-10">
        <Header />
        <StickyCTA />
        
        <main>
          <Hero />
          
          <ServiceCards />
          
          <section id="portfolio">
            <Portfolio />
          </section>
          
          <Advantages />
          
          <section id="team">
            <Team />
          </section>
          
          <ContactForm />
        </main>
        
        <Footer />
      </div>
      
      <AIChat />
    </div>
  );
}

export default App;
