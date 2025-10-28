import React, { lazy, Suspense } from "react";
import "./App.css";
import { Toaster } from "./components/ui/sonner";
import Header from "./components/Header";
import Hero from "./components/Hero";
import ServiceCards from "./components/ServiceCards";
import Footer from "./components/Footer";
import StickyCTA from "./components/StickyCTA";
import GlobalVideoBackground from "./components/GlobalVideoBackground";

// Lazy load heavy components
const Portfolio = lazy(() => import("./components/Portfolio"));
const Advantages = lazy(() => import("./components/Advantages"));
const Team = lazy(() => import("./components/Team"));
const ContactForm = lazy(() => import("./components/ContactForm"));
const AIChat = lazy(() => import("./components/AIChat"));

function App() {
  return (
    <div className="App bg-[#0b0f17] min-h-screen relative">
      <Toaster position="top-center" />
      
      {/* Global Video Background (for sections after Hero) */}
      <GlobalVideoBackground />
      
      {/* Content above video background */}
      <div className="relative z-10">
        <Header />
        <StickyCTA />
        
        <main>
          {/* 1. Hero с видео */}
          <Hero />
          
          {/* 2. Карточки услуг с AI консультация */}
          <ServiceCards />
          
          {/* 3. Портфолио/Кейсы */}
          <Suspense fallback={<div className="py-20 text-center text-white">Загрузка...</div>}>
            <section id="portfolio">
              <Portfolio />
            </section>
          </Suspense>
          
          {/* 4. Почему мы */}
          <Suspense fallback={<div className="py-20 text-center text-white">Загрузка...</div>}>
            <Advantages />
          </Suspense>
          
          {/* 5. Кто мы */}
          <Suspense fallback={<div className="py-20 text-center text-white">Загрузка...</div>}>
            <section id="team">
              <Team />
            </section>
          </Suspense>
          
          {/* 6. Форма обратной связи */}
          <Suspense fallback={<div className="py-20 text-center text-white">Загрузка...</div>}>
            <ContactForm />
          </Suspense>
        </main>
        
        <Footer />
      </div>
      
      <Suspense fallback={null}>
        <AIChat />
      </Suspense>
    </div>
  );
}

export default App;
