import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { Input } from './ui/input';
import { toast } from 'sonner';

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Привет! Помогу выбрать услугу 👋' }
  ]);
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [userData, setUserData] = useState({ name: '', contact: '' });
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickButtons = {
    services: [
      { label: '💎 Аудит', value: 'audit' },
      { label: '🤖 AI-бот', value: 'ai-bot' },
      { label: '🚀 Сайт', value: 'website' },
      { label: '🛡️ Поддержка', value: 'support' }
    ]
  };

  const handleQuickAction = async (action) => {
    const serviceMessages = {
      audit: 'Отличный выбор! Цифровой аудит поможет найти точки роста. Как мне к вам обращаться?',
      'ai-bot': 'AI-ассистент работает 24/7 и обработает 80% вопросов. Как вас зовут?',
      website: 'Создадим премиум сайт за 10-14 дней. Как мне к вам обращаться?',
      support: 'Техподдержка с SLA 99.9% uptime. Как вас зовут?'
    };

    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: serviceMessages[action] }
    ]);
    setStep('name');
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    // Simulate AI response with step logic
    setTimeout(() => {
      if (step === 'name') {
        setUserData(prev => ({ ...prev, name: userMessage }));
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `Приятно познакомиться, ${userMessage}! Оставьте ваш телефон или Telegram:` }
        ]);
        setStep('contact');
      } else if (step === 'contact') {
        setUserData(prev => ({ ...prev, contact: userMessage }));
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'Спасибо! Мы свяжемся с вами в течение 15 минут 🚀' }
        ]);
        toast.success('Заявка отправлена!');
        setStep('done');
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'Спасибо за сообщение! Чем ещё могу помочь?' }
        ]);
      }
      setLoading(false);
    }, 800);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative w-16 h-16 bg-gradient-to-br from-[#7dd3fc] to-[#764ba2] rounded-full shadow-lg shadow-[#7dd3fc]/50 flex items-center justify-center"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-full bg-[#7dd3fc]/30"
          />
          <span className="text-3xl relative z-10">🤖</span>
        </motion.button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-24 right-6 w-96 h-[600px] bg-[#121826] backdrop-blur-xl border border-white/20 rounded-none shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[#7dd3fc] to-[#764ba2] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                  🤖
                </div>
                <div>
                  <div className="font-semibold text-black">NeuroExpert AI</div>
                  <div className="text-xs text-black/70">Онлайн</div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-black hover:bg-black/10 p-1 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-[#7dd3fc] text-black'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-white p-3 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Buttons */}
            {step === 'services' && (
              <div className="p-4 border-t border-white/10 grid grid-cols-2 gap-2">
                {quickButtons.services.map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => handleQuickAction(btn.value)}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition-colors"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-white/10 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Напишите сообщение..."
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-none"
                disabled={loading}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={loading}
                className="px-4 py-2 bg-[#7dd3fc] text-black rounded-none hover:bg-white transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChat;