import React from 'react';
import { motion } from 'framer-motion';
import { mockPortfolio } from '../mock';
import VideoBackground from './VideoBackground';

const Portfolio = () => {
  return (
    <section className="relative py-20 px-6 overflow-hidden">
      {/* Video Background */}
      <VideoBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold text-white mb-4">
            Наши клиенты зарабатывают больше
          </h2>
          <p className="text-xl text-white/60">
            Результаты говорят сами за себя
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            { value: '50+', label: 'Завершенных проектов' },
            { value: '98%', label: 'Довольных клиентов' },
            { value: '300%+', label: 'Средний ROI' }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="text-center p-6 rounded-none bg-white/5 backdrop-blur-xl border border-white/10"
            >
              <div className="text-5xl font-bold text-[#7dd3fc] mb-2">
                {stat.value}
              </div>
              <div className="text-white/70 text-lg">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {mockPortfolio.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="group relative cursor-pointer overflow-hidden rounded-none"
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-[#0b0f17]/60 to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="text-4xl mb-3">{project.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {project.title}
                </h3>
                <p className="text-white/70 mb-4">{project.description}</p>
                
                {/* Result */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-4xl font-bold text-[#7dd3fc]">
                    {project.result}
                  </div>
                  <div className="text-white/70">{project.metric}</div>
                </div>

                {/* Testimonial */}
                <div className="text-sm text-white/60 italic border-l-2 border-[#7dd3fc] pl-3">
                  "{project.testimonial}"
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#7dd3fc]/0 to-[#764ba2]/0 group-hover:from-[#7dd3fc]/20 group-hover:to-[#764ba2]/20 transition-all duration-500 pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Portfolio;