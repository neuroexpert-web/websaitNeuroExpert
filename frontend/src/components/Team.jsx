import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { mockTeam } from '../mock';

const Team = () => {
  const [flipped, setFlipped] = useState({});

  const handleFlip = (id) => {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="relative py-20 px-6 bg-[#121826]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold text-white mb-4">
            Кто мы
          </h2>
          <p className="text-xl text-white/60">
            Команда экспертов с проверенным опытом
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {mockTeam.map((member, idx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => handleFlip(member.id)}
              className="cursor-pointer perspective-1000"
            >
              <motion.div
                animate={{ rotateY: flipped[member.id] ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                className="relative h-96 rounded-none preserve-3d"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 backface-hidden overflow-hidden rounded-none"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-[#0b0f17]/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-2xl font-bold text-white mb-1">
                      {member.name}
                    </h3>
                    <p className="text-[#7dd3fc] font-semibold mb-2">
                      {member.role}
                    </p>
                    <p className="text-white/70 text-sm">{member.strength}</p>
                  </div>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 backface-hidden p-6 bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center rounded-none"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-4">💪</div>
                    <h3 className="text-xl font-bold text-white mb-3">
                      {member.name}
                    </h3>
                    <p className="text-[#7dd3fc] mb-4">{member.role}</p>
                    <p className="text-white/70 leading-relaxed">
                      {member.bio}
                    </p>
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