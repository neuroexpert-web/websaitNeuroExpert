import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockTeam } from '../mock';

const Team = () => {
  const [flipped, setFlipped] = useState({});

  const handleFlip = (id) => {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-14 md:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
            <span className="animated-gradient-text text-glow">Кто мы</span>
          </h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-white/60"
          >
            Команда экспертов с проверенным опытом
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {mockTeam.map((member, idx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              onClick={() => handleFlip(member.id)}
              className="cursor-pointer perspective-1000"
            >
              <motion.div
                animate={{ rotateY: flipped[member.id] ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                className="relative h-[420px] sm:h-[450px] rounded-2xl preserve-3d shadow-2xl"
                style={{ transformStyle: 'preserve-3d' }}
                whileHover={{ scale: 1.02 }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 backface-hidden overflow-hidden rounded-2xl border-2 border-white/10"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  {member.image ? (
                    <>
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-[#0b0f17]/60 to-transparent" />
                    </>
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${member.gradient} relative`}>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-transparent to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-8xl opacity-20">👤</div>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 backdrop-blur-sm bg-gradient-to-t from-[#0b0f17]/90 to-transparent">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
                      {member.name}
                    </h3>
                    <p className="text-[#7dd3fc] font-semibold mb-2 text-sm sm:text-base">
                      {member.role}
                    </p>
                    <p className="text-white/80 text-xs sm:text-sm leading-relaxed">{member.strength}</p>
                    <div className="mt-3 text-center">
                      <span className="text-white/60 text-xs">Нажмите для подробностей ↻</span>
                    </div>
                  </div>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 backface-hidden p-6 sm:p-8 bg-gradient-to-br from-[#1a1f2e]/95 to-[#0b0f17]/95 backdrop-blur-xl border-2 border-[#7dd3fc]/30 flex items-center justify-center rounded-2xl shadow-lg shadow-[#7dd3fc]/20"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <div className="text-center">
                    <div className="text-4xl sm:text-5xl mb-4 sm:mb-5">⭐</div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                      {member.name}
                    </h3>
                    <p className="text-[#7dd3fc] mb-4 sm:mb-5 text-base sm:text-lg font-semibold">{member.role}</p>
                    <p className="text-white/80 leading-relaxed text-sm sm:text-base">
                      {member.bio}
                    </p>
                    <div className="mt-5">
                      <span className="text-white/60 text-xs">Нажмите еще раз ↻</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;