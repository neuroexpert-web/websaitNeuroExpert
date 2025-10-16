import React from 'react';
import { motion } from 'framer-motion';
import { mockServices } from '../mock';

const Hero = ({ onServiceClick }) => {
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
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0f17]/80 via-[#0b0f17]/60 to-[#0b0f17]" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Ваш цифровой прорыв —
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7dd3fc] to-[#764ba2]">
              с ИИ и командой NeuroExpert
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto">
            Превращаем технологии в деньги. Быстро. Эффективно. С гарантией.
          </p>
        </motion.div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => onServiceClick(service.id)}
              className="group relative cursor-pointer"
            >
              {/* Glassmorphism Card */}
              <div className="relative p-6 rounded-none bg-white/5 backdrop-blur-xl border border-white/20 hover:border-[#7dd3fc] transition-all duration-400 h-full">
                {/* Icon */}
                <div className="text-5xl mb-4">{service.icon}</div>
                
                {/* Title */}
                <h3 className="text-xl font-semibold text-white mb-2">
                  {service.title}
                </h3>
                
                {/* Price */}
                <div className="text-[#7dd3fc] font-bold text-lg mb-3">
                  {service.price}
                </div>
                
                {/* Description */}
                <p className="text-white/70 text-sm leading-relaxed">
                  {service.shortDesc}
                </p>

                {/* Hover Benefit */}
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  whileHover={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-white/10 overflow-hidden"
                >
                  <p className="text-[#7dd3fc] text-sm font-medium">
                    ✓ {service.benefits[0]}
                  </p>
                </motion.div>

                {/* Glow Effect */}
                <div className="absolute inset-0 rounded-none bg-gradient-to-br from-[#7dd3fc]/0 to-[#764ba2]/0 group-hover:from-[#7dd3fc]/10 group-hover:to-[#764ba2]/10 transition-all duration-400 pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;