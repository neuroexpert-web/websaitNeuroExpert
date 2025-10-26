import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { Input } from './ui/input';
import { toast } from 'sonner';

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Привет! Я AI‑консультант NeuroExpert на базе Google Gemini. Опиши задачу — и я помогу найти решение 🚀' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Проверка устройства
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Отправка запроса в API (Google Gemini через наш endpoint)
  const callGemini = async (message) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: message }),
    });

    if (!response.ok) throw new Error('Network response was not ok');

    const data = await response.json();
    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Ошибка: не удалось получить ответ от Gemini.'
    );
  };

  // Обработка отправки сообщения
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const aiResponse = await callGemini(userMessage);
      setMessages((prev) => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Извини, произошла ошибка. Попробуй ещё раз.' },
      ]);
      toast.error('Ошибка связи с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <motion.div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7dd3fc] to-[#764ba2] shadow-lg flex items-center justify-center text-3xl"
        >
          💬
        </motion.button>
      </motion.div>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`fixed z-50 bg-gradient-to-br from-[#1a1f2e]/95 to-[#0b0f17]/95 backdrop-blur-xl border border-white/20 shadow-2xl flex flex-col overflow-hidden ${
              isMobile
                ? 'inset-0 rounded-none'
                : 'bottom-20 md:bottom-24 right-4 md:right-6 w-80 md:w-96 h-[500px] rounded-3xl'
            }`}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[#7dd3fc]/30 to-[#764ba2]/30 border-b border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7dd3fc] to-[#764ba2] flex items-center justify-center text-xl">🤖</div>
                <div>
                  <div className="font-bold text-white text-lg">NeuroExpert AI</div>
                  <div className="text-xs text-white/70">Google Gemini API</div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 text-white hover:bg-red-600/20 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-[#7dd3fc] to-[#764ba2] text-white'
                        : 'bg-white/10 text-white border border-white/10'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start text-white/70 text-sm">Генерация ответа ...</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10 flex gap-2 bg-black/20">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Напишите сообщение..."
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={loading}
                className="flex-1 rounded-xl bg-white/90 text-black placeholder-gray-500 px-3 py-2"
              />
              <motion.button
                onClick={handleSend}
                whileTap={{ scale: 0.95 }}
                disabled={!input.trim() || loading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7dd3fc] to-[#764ba2] text-white font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                <Send size={16} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChat;
