import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { mockServices } from '../mock';
import { Badge } from './ui/badge';
import { Check } from 'lucide-react';

const ServiceDetails = () => {
  const refs = useRef({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    Object.values(refs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative py-20 px-6 bg-[#0b0f17]">
      <div className="max-w-6xl mx-auto space-y-32">
        {mockServices.map((service) => (
          <motion.div
            key={service.id}
            id={`service-${service.id}`}
            ref={(el) => (refs.current[service.id] = el)}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="opacity-0"
          >
            {/* Header */}
            <div className="flex items-start gap-6 mb-8">
              <div className="text-6xl">{service.icon}</div>
              <div className="flex-1">
                <h2 className="text-4xl font-bold text-white mb-3">
                  {service.title}
                </h2>
                <p className="text-xl text-white/60 italic">
                  {service.problem}
                </p>
              </div>
              <Badge variant="outline" className="text-[#7dd3fc] border-[#7dd3fc] text-lg px-4 py-2">
                {service.price}
              </Badge>
            </div>

            {/* Benefits */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-white mb-4">Что получаете:</h3>
                {service.benefits.map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <Check className="w-6 h-6 text-[#7dd3fc] mt-1 flex-shrink-0" />
                    <span className="text-lg text-white/80">{benefit}</span>
                  </motion.div>
                ))}
              </div>

              {/* Case Study */}
              <div className="p-6 rounded-none bg-white/5 backdrop-blur-xl border border-white/10">
                <div className="text-sm text-[#7dd3fc] uppercase tracking-wider mb-2">
                  Реальный кейс
                </div>
                <h4 className="text-xl font-semibold text-white mb-2">
                  {service.case.title}
                </h4>
                <div className="text-4xl font-bold text-[#7dd3fc] mb-2">
                  {service.case.result}
                </div>
                <p className="text-white/70">{service.case.details}</p>
                <Badge className="mt-4 bg-[#7dd3fc]/20 text-[#7dd3fc] border-none">
                  {service.guarantee}
                </Badge>
              </div>
            </div>

            {/* FAQ Accordion */}
            <div>
              <h3 className="text-2xl font-semibold text-white mb-4">Частые вопросы</h3>
              <Accordion type="single" collapsible className="space-y-3">
                {service.faqs.map((faq, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`item-${service.id}-${idx}`}
                    className="border border-white/10 rounded-none bg-white/5 backdrop-blur-xl px-6"
                  >
                    <AccordionTrigger className="text-white hover:text-[#7dd3fc] text-left">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-white/70">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* CTA Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-8 px-8 py-4 bg-[#7dd3fc] text-black font-semibold text-lg rounded-none transition-all duration-400 hover:bg-white hover:shadow-lg hover:shadow-[#7dd3fc]/50"
            >
              Заказать сейчас
            </motion.button>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ServiceDetails;