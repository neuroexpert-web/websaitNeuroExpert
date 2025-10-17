import React from 'react';
import { motion } from 'framer-motion';
import { mockAdvantages } from '../mock';
import VideoBackground from './VideoBackground';

const Advantages = () => {
  return (
    <section className="relative py-20 px-6 overflow-hidden">
      {/* Video Background */}
      <VideoBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl font-bold text-white text-center mb-16"
        >
          Почему мы?
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {mockAdvantages.map((advantage, idx) => (
            <motion.div
              key={advantage.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ rotate: 2, scale: 1.05 }}
              className="p-6 rounded-none bg-white/5 backdrop-blur-xl border border-white/10 hover:border-[#7dd3fc] transition-all duration-400 text-center group"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="text-5xl mb-4 inline-block"
              >
                {advantage.icon}
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#7dd3fc] transition-colors">
                {advantage.title}
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                {advantage.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Advantages;