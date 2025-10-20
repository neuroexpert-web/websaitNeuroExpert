import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { Input } from './ui/input';
import { toast } from 'sonner';

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Привет! Я AI-консультант NeuroExpert. Расскажите, какая задача перед вами стоит, и я помогу найти оптимальное решение! 🚀' }
  ]);
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [userData, setUserData] = useState({ name: '', contact: '' });
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('claude-sonnet');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  const models = [
    { id: 'claude-sonnet', name: 'Claude Sonnet 4', icon: '🧠', description: 'Самый умный' },
    { id: 'gpt-4o', name: 'GPT-4o', icon: '⚡', description: 'Быстрый и точный' },
    { id: 'gemini-pro', name: 'Gemini 2.0 Flash', icon: '✨', description: 'Креативный' }
  ];

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
      audit: 'Расскажите о цифровом аудите',
      'ai-bot': 'Интересует AI-ассистент 24/7',
      website: 'Хочу заказать сайт под ключ',
      support: 'Нужна техподдержка'
    };

    // Send as user message to AI
    const message = serviceMessages[action];
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setLoading(true);

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: message,
          model: selectedModel,
          user_data: userData.contact ? userData : null
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.response }
      ]);

    } catch (error) {
      console.error('Error sending quick action:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Извините, произошла ошибка. Попробуйте еще раз.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Call backend API
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage,
          model: selectedModel,
          user_data: userData.contact ? userData : null
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.response }
      ]);

      // Check if user provided contact info in the message
      const phoneRegex = /(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/;
      const telegramRegex = /@\w+/;
      
      if (phoneRegex.test(userMessage) || telegramRegex.test(userMessage)) {
        setUserData(prev => ({ ...prev, contact: userMessage }));
        toast.success('Контакт сохранен! Мы свяжемся с вами в течение 15 минут');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Извините, произошла ошибка. Попробуйте еще раз или свяжитесь с нами напрямую.' }
      ]);
      toast.error('Ошибка отправки сообщения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50"
      >
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          data-ai-chat-button="true"
          className="relative w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#7dd3fc] to-[#764ba2] rounded-full shadow-lg shadow-[#7dd3fc]/50 flex items-center justify-center"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-full bg-[#7dd3fc]/30"
          />
          <span className="text-2xl md:text-3xl relative z-10">🤖</span>
        </motion.button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className={`fixed z-50 bg-[#121826] backdrop-blur-xl border border-white/20 rounded-none shadow-2xl flex flex-col overflow-hidden ${
              isMobile 
                ? 'inset-0 w-full h-full' 
                : 'bottom-20 md:bottom-24 right-4 md:right-6 w-80 md:w-96 h-[500px] md:h-[600px]'
            }`}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[#7dd3fc] to-[#764ba2] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                  🤖
                </div>
                <div>
                  <div className="font-semibold text-black">NeuroExpert AI</div>
                  <div className="text-xs text-black/70">{models.find(m => m.id === selectedModel)?.name}</div>
                </div>
              </div>
              <div className="flex gap-2">
                {/* Model selector button */}
                <button
                  onClick={() => setShowModelMenu(!showModelMenu)}
                  className="w-9 h-9 bg-black/10 hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center text-black"
                  title="Выбрать модель"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-black hover:bg-black/10 p-1 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Model Menu */}
            <AnimatePresence>
              {showModelMenu && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[#1a1f2e]/95 border-b border-white/10 overflow-hidden"
                >
                  <div className="p-3 space-y-2">
                    {models.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model.id);
                          setShowModelMenu(false);
                        }}
                        className={`w-full p-3 rounded-lg transition-all flex items-center gap-3 ${
                          selectedModel === model.id
                            ? 'bg-gradient-to-r from-[#7dd3fc]/20 to-[#764ba2]/20 border border-[#7dd3fc]/30'
                            : 'bg-white/5 hover:bg-white/10 border border-transparent'
                        }`}
                      >
                        <span className="text-2xl">{model.icon}</span>
                        <div className="flex-1 text-left">
                          <div className="text-white font-semibold text-sm">{model.name}</div>
                          <div className="text-white/60 text-xs">{model.description}</div>
                        </div>
                        {selectedModel === model.id && (
                          <span className="text-[#7dd3fc]">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[80%] p-2 md:p-3 rounded-lg text-sm md:text-base ${
                      msg.role === 'user'
                        ? 'bg-[#7dd3fc] text-black'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-white p-2 md:p-3 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Buttons */}
            {messages.length <= 1 && (
              <div className="p-3 md:p-4 border-t border-white/10 grid grid-cols-2 gap-2">
                {quickButtons.services.map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => handleQuickAction(btn.value)}
                    disabled={loading}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded text-xs md:text-sm transition-colors disabled:opacity-50"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 md:p-4 border-t border-white/10 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Напишите сообщение..."
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-none text-sm md:text-base"
                disabled={loading}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-3 md:px-4 py-2 bg-[#7dd3fc] text-black rounded-none hover:bg-white transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChat;