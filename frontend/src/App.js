import React, { useRef } from "react";
import "./App.css";
import { Toaster } from "./components/ui/sonner";
import Header from "./components/Header";
import Hero from "./components/Hero";
import ServiceDetails from "./components/ServiceDetails";
import Portfolio from "./components/Portfolio";
import Advantages from "./components/Advantages";
import Team from "./components/Team";
import ContactForm from "./components/ContactForm";
import AIChat from "./components/AIChat";
import Footer from "./components/Footer";

function App() {
  const handleServiceClick = (serviceId) => {
    const element = document.getElementById(`service-${serviceId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="App bg-[#0b0f17] min-h-screen">
      <Toaster position="top-center" />
      <Header />
      
      <main>
        <Hero onServiceClick={handleServiceClick} />
        
        <section id="services">
          <ServiceDetails />
        </section>
        
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
      <AIChat />
    </div>
  );
}

export default App;
