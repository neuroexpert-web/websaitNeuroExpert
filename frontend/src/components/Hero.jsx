import React from 'react';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="https://customer-assets.emergentagent.com/job_digital-breakthrough/artifacts/qr24qw27_NeuroExpert%20%D0%9E%D0%91%D0%9B%D0%9E%D0%96%D0%9A%D0%90.mp4" type="video/mp4" />
        </video>
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f17]/70 via-[#0b0f17]/50 to-[#0b0f17]" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-white mb-6 sm:mb-8 leading-tight px-2">
            Ваш цифровой прорыв —
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7dd3fc] to-[#764ba2]">
              с ИИ и командой NeuroExpert
            </span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/90 max-w-4xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4">
            Превращаем технологии в деньги. Быстро. Эффективно. С гарантией.
          </p>
          
          <motion.a
            href="#services"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block px-8 sm:px-12 py-4 sm:py-6 bg-gradient-to-r from-[#7dd3fc] to-[#764ba2] text-white font-bold text-lg sm:text-xl rounded-xl hover:shadow-2xl hover:shadow-[#7dd3fc]/50 transition-all duration-400"
          >
            Узнать больше
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;