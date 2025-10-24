import React from 'react';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-28 lg:py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl font-bold text-white mb-4 sm:mb-6 md:mb-8 leading-tight px-2">
            Ваш цифровой прорыв
            <br />
            <span className="text-white">
              с ИИ и командой NeuroExpert
            </span>
          </h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-white/90 max-w-4xl mx-auto mb-6 sm:mb-8 md:mb-12 leading-relaxed px-4 text-center"
          >
            Превращаем технологии в деньги. Быстро. Эффективно. С гарантией.
          </motion.p>
          
          <motion.a
            href="#services"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block px-6 sm:px-8 md:px-10 lg:px-12 py-3 sm:py-4 md:py-5 lg:py-6 bg-gradient-to-r from-[#7dd3fc] to-[#764ba2] text-white font-bold text-base sm:text-lg md:text-xl rounded-xl hover:shadow-2xl hover:shadow-[#7dd3fc]/50 transition-all duration-400 breathing-glow"
          >
            Узнать больше
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;