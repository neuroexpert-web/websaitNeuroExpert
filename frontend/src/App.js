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
import GlobalVideoBackground from "./components/GlobalVideoBackground";

function App() {
  return (
    <div className="App min-h-screen relative">
      <Toaster position="top-center" />
      <GlobalVideoBackground />
      
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
