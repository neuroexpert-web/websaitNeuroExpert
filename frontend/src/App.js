import React, { useRef } from "react";
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
    <div className="App bg-[#0b0f17] min-h-screen">
      <Toaster position="top-center" />
      <Header />
      <StickyCTA />
      
      <main>
        {/* 1. Hero с видео */}
        <Hero />
        
        {/* 2. Карточки услуг с AI консультация */}
        <ServiceCards />
        
        {/* 3. Портфолио/Кейсы */}
        <section id="portfolio">
          <Portfolio />
        </section>
        
        {/* 4. Почему мы */}
        <Advantages />
        
        {/* 5. Кто мы */}
        <section id="team">
          <Team />
        </section>
        
        {/* 6. Форма обратной связи */}
        <ContactForm />
      </main>
      
      <Footer />
      <AIChat />
    </div>
  );
}

export default App;
