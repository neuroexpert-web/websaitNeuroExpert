import React from 'react';
import { motion } from 'framer-motion';
import { mockPortfolio } from '../mock';
import VideoBackground from './VideoBackground';

const Portfolio = () => {
  return (
    <section className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 overflow-hidden">
      {/* Video Background */}
      <VideoBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-14 md:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
            Наши клиенты зарабатывают больше
          </h2>
          <p className="text-lg sm:text-xl text-white/60">
            Результаты говорят сами за себя
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-14 md:mb-16">
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
              className="text-center p-4 sm:p-6 rounded-none bg-white/5 backdrop-blur-xl border border-white/10"
            >
              <div className="text-4xl sm:text-5xl font-bold text-[#7dd3fc] mb-2">
                {stat.value}
              </div>
              <div className="text-white/70 text-base sm:text-lg">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {mockPortfolio.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              whileHover={{ y: -10, scale: 1.03 }}
              className="group relative overflow-hidden rounded-xl"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${project.gradient} backdrop-blur-sm`} />
              <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/20 group-hover:border-[#7dd3fc]/50 transition-all duration-500" />
              
              {/* Neon glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#7dd3fc]/0 via-[#764ba2]/0 to-[#7dd3fc]/0 group-hover:from-[#7dd3fc]/10 group-hover:via-[#764ba2]/10 group-hover:to-[#7dd3fc]/10 transition-all duration-500" />

              {/* Content */}
              <div className="relative z-10 p-6 sm:p-8 flex flex-col h-full min-h-[420px] sm:min-h-[450px]">
                {/* Icon & Title */}
                <div className="mb-4">
                  <div className="text-5xl sm:text-6xl mb-4">{project.icon}</div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 group-hover:text-[#7dd3fc] transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-[#7dd3fc] font-semibold text-sm sm:text-base mb-3">
                    {project.company}
                  </p>
                  <p className="text-white/70 text-sm sm:text-base leading-relaxed">
                    {project.description}
                  </p>
                </div>

                {/* Services Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.services.map((service, sIdx) => (
                    <span 
                      key={sIdx}
                      className="px-3 py-1 bg-white/10 text-white/80 text-xs rounded-full border border-white/20"
                    >
                      {service}
                    </span>
                  ))}
                </div>
                
                {/* Result - Pushed to bottom with margin-top auto */}
                <div className="mt-auto">
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/10">
                    <div className="text-4xl sm:text-5xl font-bold text-[#7dd3fc]">
                      {project.result}
                    </div>
                    <div className="text-white/70 text-sm sm:text-base">{project.metric}</div>
                  </div>

                  {/* Testimonial */}
                  <div className="text-sm text-white/60 italic border-l-2 border-[#7dd3fc] pl-3 mb-4">
                    "{project.testimonial}"
                  </div>

                  {/* View Button */}
                  {project.link !== '#' ? (
                    <motion.a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="block w-full px-6 py-3 bg-gradient-to-r from-[#7dd3fc] to-[#764ba2] text-white font-bold text-center rounded-lg hover:shadow-xl hover:shadow-[#7dd3fc]/50 transition-all duration-300"
                    >
                      Смотреть проект →
                    </motion.a>
                  ) : (
                    <div className="w-full px-6 py-3 bg-white/5 text-white/50 font-semibold text-center rounded-lg border border-white/10">
                      Скоро...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Portfolio;