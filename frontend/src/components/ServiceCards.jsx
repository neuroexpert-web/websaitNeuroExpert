import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mockServices } from '../mock';
import { X, Send } from 'lucide-react';
import { Input } from './ui/input';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ServiceCards = () => {
  const [selectedService, setSelectedService] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId] = useState(`session-${Date.now()}`);

  const auditContent = {
    title: 'Цифровой аудит бизнеса',
    price: 'от 5000₽',
    icon: '💎',
    forWhom: [
      'Ваш сайт не приносит заявок, хотя на него заходят люди',
      'Реклама сливает бюджет, а клиентов мало',
      'Не понимаете, куда уходят деньги на маркетинг',
      'Конкуренты обходят вас, хотя ваш продукт не хуже',
      'Хотите расти, но не знаете, с чего начать',
      'Нужен план действий, а не абстрактные советы'
    ],
    risks: [
      'Вы продолжите терять 20-40% потенциальной прибыли каждый месяц',
      'Конкуренты, которые оптимизируются, обойдут вас',
      'Вложения в рекламу будут работать вполсилы',
      'Через год отставание станет критичным — догнать будет в 5 раз дороже'
    ],
    steps: [
      'Оставьте заявку (кнопка ниже) или напишите в Telegram',
      'Менеджер свяжется с вами за 15 минут, задаст 5-7 вопросов о бизнесе',
      'Оплатите 5 000₽ (безопасная оплата через ВК Pay)',
      'Получите доступы к аналитике (Google Analytics / Яндекс.Метрика)',
      'Через 3 дня получите отчёт + видео + калькулятор в Telegram'
    ],
    bonuses: [
      'Бесплатная стратегическая сессия 30 минут (стоимость 15 000₽)',
      'Скидка 20% на внедрение рекомендаций (экономия до 80 000₽)',
      'Реферальные ссылки на AI-инструменты (экономия 5 000₽)'
    ],
    faqs: [
      { q: 'Что, если у меня нет сайта?', a: 'Аудитируем ваши соцсети, рекламу, бизнес-процессы. Подскажем, нужен ли вам сайт, или можно обойтись без него.' },
      { q: 'Подходит ли для малого бизнеса?', a: 'Да! 60% наших клиентов — малый бизнес с оборотом 3-10 млн₽/год. Аудит окупается даже при таких масштабах.' },
      { q: 'Можно ли получить аудит быстрее?', a: 'Да, экспресс-аудит за 1 день стоит 8 000₽. В нём меньше деталей, но основные проблемы находим.' },
      { q: 'Вы работаете с любой нишей?', a: 'Да, опыт в 50+ отраслях: от e-commerce до B2B-услуг. Специализация не важна — проблемы цифрового маркетинга универсальны.' },
      { q: 'Что, если мне не понравится отчёт?', a: 'Напишите, что именно не устроило. Либо доработаем бесплатно, либо вернём деньги. Таких случаев не было за 2 года работы.' }
    ],
    guarantees: [
      'Срок: Отчёт готов ровно через 3 рабочих дня. Опоздание = возврат денег + 10 000₽ компенсация',
      'Качество: Если не найдём минимум 5 серьёзных проблем — аудит бесплатно',
      'ROI: Гарантируем рекомендации с потенциалом +100 000₽ дохода в первые 3 месяца',
      'Конфиденциальность: NDA, все данные удаляются после проекта'
    ]
  };

  const websiteContent = {
    title: 'Сайты под ключ',
    price: 'от 12 000₽',
    icon: '🚀',
    intro: 'Сайт или приложение — это не просто красивая картинка в интернете. Это цифровой сотрудник, который работает круглосуточно: привлекает клиентов, рассказывает о вашем продукте, собирает заявки и зарабатывает деньги, пока вы спите.',
    types: [
      {
        title: 'Сайты',
        desc: 'Лендинги, корпоративные порталы, интернет-магазины — всё, что работает в браузере'
      },
      {
        title: 'Мобильные приложения',
        desc: 'Для iOS и Android — ваш бизнес в кармане клиента'
      },
      {
        title: 'Web-приложения',
        desc: 'Сложные системы для автоматизации бизнес-процессов (CRM, ERP, личные кабинеты)'
      }
    ],
    problems: [
      {
        title: '"Красивый, но не продаёт"',
        desc: 'Дизайнер сделал "для души", а конверсия 0.5%. Клиенты заходят и уходят, не оставив заявки.'
      },
      {
        title: '"Долго загружается"',
        desc: 'Сайт открывается 7 секунд → 40% посетителей уходят, не дождавшись. Google вас понижает в выдаче.'
      },
      {
        title: '"Не работает на телефонах"',
        desc: '70% трафика с мобильных, но кнопки не нажимаются, текст не читается. Вы теряете большинство клиентов.'
      },
      {
        title: '"Сделали и забыли"',
        desc: 'Разработчик исчез после запуска. Хотите изменить текст — некому. Сайт "умер" через полгода.'
      },
      {
        title: '"Безопасность — дыра"',
        desc: 'Взломали, украли базу клиентов, навесили вирусы. Репутация уничтожена, штрафы от Роскомнадзора.'
      },
      {
        title: '"Переплатили вдвое"',
        desc: 'Фрилансер обещал за 30 000₽, в итоге заплатили 150 000₽ за переделки и "неожиданные" доработки.'
      }
    ],
    approach: [
      'Анализируем вашу нишу → изучаем конкурентов, поведение клиентов, лучшие практики',
      'Проектируем путь клиента → от первого клика до покупки, без лишних шагов',
      'Строим на современных технологиях → быстро, безопасно, масштабируемо',
      'Тестируем до запуска → 200+ проверок, чтобы всё работало идеально',
      'Сопровождаем после запуска → обучаем команду, исправляем баги, развиваем продукт'
    ]
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        session_id: sessionId,
        message: userMessage
      });

      if (response.data.response) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Ошибка отправки сообщения');
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <>
      <section id="services" className="relative py-20 px-6 bg-[#121826]">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl font-bold text-white text-center mb-16"
          >
            Наши услуги
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="relative p-6 rounded-none bg-white/5 backdrop-blur-xl border border-white/20 hover:border-[#7dd3fc] transition-all duration-400 h-full flex flex-col">
                  <div className="text-5xl mb-4">{service.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">{service.title}</h3>
                  <div className="text-[#7dd3fc] font-bold text-lg mb-3">{service.price}</div>
                  <p className="text-white/70 text-sm leading-relaxed mb-6 flex-grow">{service.shortDesc}</p>
                  
                  {/* Neon Button */}
                  <motion.button
                    onClick={() => setSelectedService(service)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-full px-6 py-3 bg-transparent border-2 border-[#7dd3fc] text-[#7dd3fc] font-semibold rounded-none overflow-hidden group-hover:text-black transition-colors duration-300"
                  >
                    <span className="relative z-10">AI консультация</span>
                    <motion.div
                      className="absolute inset-0 bg-[#7dd3fc]"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                    {/* Neon glow */}
                    <div className="absolute inset-0 bg-[#7dd3fc] blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0b0f17] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 bg-[#0b0f17]/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-4xl">
                  {selectedService.id === 1 ? auditContent.icon : selectedService.id === 3 ? websiteContent.icon : selectedService.icon}
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedService.id === 1 ? auditContent.title : selectedService.id === 3 ? websiteContent.title : selectedService.title}
                  </h2>
                  <p className="text-[#7dd3fc]">
                    {selectedService.id === 1 ? auditContent.price : selectedService.id === 3 ? websiteContent.price : selectedService.price}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-5xl mx-auto px-6 py-12 pb-64">
                {selectedService.id === 1 && (
                  <>
                    {/* For Whom */}
                    <section className="mb-12">
                      <h3 className="text-3xl font-bold text-white mb-6">Для кого этот аудит?</h3>
                      <div className="space-y-3">
                        {auditContent.forWhom.map((item, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-start gap-3 p-4 bg-white/5 rounded-lg"
                          >
                            <span className="text-green-400 text-xl">✅</span>
                            <span className="text-white/80">{item}</span>
                          </motion.div>
                        ))}
                      </div>
                    </section>

                    {/* Risks */}
                    <section className="mb-12">
                      <h3 className="text-3xl font-bold text-white mb-6">Что будет, если не делать аудит?</h3>
                      <div className="space-y-3">
                        {auditContent.risks.map((item, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                          >
                            <span className="text-red-400 text-xl">❌</span>
                            <span className="text-white/80">{item}</span>
                          </motion.div>
                        ))}
                      </div>
                    </section>

                    {/* Steps */}
                    <section className="mb-12">
                      <h3 className="text-3xl font-bold text-white mb-6">Как заказать аудит?</h3>
                      <div className="space-y-4">
                        {auditContent.steps.map((step, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-start gap-4 p-4 bg-white/5 rounded-lg"
                          >
                            <div className="flex-shrink-0 w-8 h-8 bg-[#7dd3fc] rounded-full flex items-center justify-center text-black font-bold">
                              {idx + 1}
                            </div>
                            <span className="text-white/80">{step}</span>
                          </motion.div>
                        ))}
                      </div>
                    </section>

                    {/* Bonuses */}
                    <section className="mb-12">
                      <h3 className="text-3xl font-bold text-white mb-6">Бонус для первых 10 клиентов</h3>
                      <div className="space-y-4">
                        {auditContent.bonuses.map((bonus, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-6 bg-gradient-to-r from-[#7dd3fc]/20 to-[#764ba2]/20 border border-[#7dd3fc]/30 rounded-lg"
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">🎁</span>
                              <span className="text-white">{bonus}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </section>

                    {/* FAQs */}
                    <section className="mb-12">
                      <h3 className="text-3xl font-bold text-white mb-6">Часто задаваемые вопросы</h3>
                      <div className="space-y-4">
                        {auditContent.faqs.map((faq, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-6 bg-white/5 rounded-lg"
                          >
                            <div className="flex items-start gap-3 mb-3">
                              <span className="text-[#7dd3fc] text-xl">❓</span>
                              <h4 className="text-lg font-semibold text-white">{faq.q}</h4>
                            </div>
                            <p className="text-white/70 ml-9">{faq.a}</p>
                          </motion.div>
                        ))}
                      </div>
                    </section>

                    {/* Guarantees */}
                    <section className="mb-12">
                      <h3 className="text-3xl font-bold text-white mb-6">Гарантии NeuroExpert</h3>
                      <div className="space-y-3">
                        {auditContent.guarantees.map((guarantee, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
                          >
                            <span className="text-green-400 text-xl">✅</span>
                            <span className="text-white/80">{guarantee}</span>
                          </motion.div>
                        ))}
                      </div>
                    </section>

                    {/* CTA */}
                    <div className="text-center py-8">
                      <p className="text-white/60 mb-4">⏰ Осталось 3 места по акции в октябре</p>
                      <p className="text-red-400 mb-8">Цена актуальна до 31 октября 2025. С 1 ноября стоимость — 12 000₽.</p>
                      <div className="flex flex-wrap gap-4 justify-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-8 py-4 bg-[#7dd3fc] text-black font-bold text-lg rounded-none hover:shadow-2xl hover:shadow-[#7dd3fc]/50"
                        >
                          ОСТАВИТЬ ЗАЯВКУ
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-8 py-4 bg-white/10 text-white font-bold text-lg rounded-none border border-white/20 hover:bg-white hover:text-black"
                        >
                          НАПИСАТЬ В TELEGRAM
                        </motion.button>
                      </div>
                    </div>
                  </>
                )}

                {/* Website Content */}
                {selectedService.id === 3 && (
                  <>
                    {/* Intro */}
                    <section className="mb-12">
                      <div className="p-6 bg-gradient-to-r from-[#7dd3fc]/20 to-[#764ba2]/20 border border-[#7dd3fc]/30 rounded-lg">
                        <h3 className="text-2xl font-bold text-white mb-4">Что мы создаём? Просто о сложном</h3>
                        <p className="text-white/80 text-lg leading-relaxed">{websiteContent.intro}</p>
                      </div>
                    </section>

                    {/* Types */}
                    <section className="mb-12">
                      <h3 className="text-3xl font-bold text-white mb-6">Мы создаём digital-продукты трёх типов:</h3>
                      <div className="grid md:grid-cols-3 gap-6">
                        {websiteContent.types.map((type, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-6 bg-white/5 rounded-lg border border-white/10 hover:border-[#7dd3fc] transition-all"
                          >
                            <h4 className="text-xl font-semibold text-[#7dd3fc] mb-3">{type.title}</h4>
                            <p className="text-white/70">{type.desc}</p>
                          </motion.div>
                        ))}
                      </div>
                    </section>

                    {/* Problems */}
                    <section className="mb-12">
                      <h3 className="text-3xl font-bold text-white mb-6">Почему ваш сайт не работает?</h3>
                      <p className="text-white/60 mb-8">Типичные проблемы, которые мы решаем:</p>
                      <div className="space-y-4">
                        {websiteContent.problems.map((problem, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg"
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-red-400 text-xl flex-shrink-0">❌</span>
                              <div>
                                <h4 className="text-lg font-semibold text-white mb-2">{problem.title}</h4>
                                <p className="text-white/70">{problem.desc}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </section>

                    {/* Approach */}
                    <section className="mb-12">
                      <h3 className="text-3xl font-bold text-white mb-6">Наш подход: технологии + бизнес-логика</h3>
                      <p className="text-white/80 text-lg mb-8">Мы не просто "рисуем сайты". Каждый проект — это инженерное решение бизнес-задачи:</p>
                      <div className="space-y-4">
                        {websiteContent.approach.map((step, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-start gap-4 p-4 bg-white/5 rounded-lg"
                          >
                            <span className="text-green-400 text-xl flex-shrink-0">✅</span>
                            <span className="text-white/80">{step}</span>
                          </motion.div>
                        ))}
                      </div>
                    </section>

                    {/* CTA */}
                    <div className="text-center py-8">
                      <p className="text-white/60 mb-8 text-lg">Готовы начать свой digital-проект?</p>
                      <div className="flex flex-wrap gap-4 justify-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-8 py-4 bg-[#7dd3fc] text-black font-bold text-lg rounded-none hover:shadow-2xl hover:shadow-[#7dd3fc]/50"
                        >
                          ПОЛУЧИТЬ РАСЧЁТ
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-8 py-4 bg-white/10 text-white font-bold text-lg rounded-none border border-white/20 hover:bg-white hover:text-black"
                        >
                          ПОРТФОЛИО
                        </motion.button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* AI Chat at bottom - Fixed */}
            <div className="flex-shrink-0 bg-[#121826] border-t border-white/10 p-4">
              <div className="max-w-5xl mx-auto">
                {/* Chat Messages */}
                {chatMessages.length > 0 && (
                  <div className="mb-4 max-h-40 overflow-y-auto space-y-2">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-[#7dd3fc] text-black'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Задайте вопрос AI-ассистенту..."
                      className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-none pr-10"
                      disabled={chatLoading}
                    />
                    {chatInput && (
                      <button
                        onClick={() => setChatInput('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-white/60" />
                      </button>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    disabled={chatLoading}
                    className="px-6 py-2 bg-[#7dd3fc] text-black rounded-none hover:bg-white transition-colors disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ServiceCards;
