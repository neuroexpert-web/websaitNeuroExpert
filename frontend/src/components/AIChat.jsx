import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
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
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  const models = [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', icon: '🧠', description: 'Самый умный' },
    { id: 'gpt-4o', name: 'GPT-4o', icon: '⚡', description: 'Быстрый и точный' }
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

  // Agent Router API call
  const callAgentRouter = async (message) => {
    const response = await fetch('https://agentrouter.org/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_AGENT_ROUTER_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: 'Ты AI-консультант NeuroExpert. Помогай клиентам с выбором услуг: цифровой аудит, AI-боты и ассистенты, разработка сайтов, техническая поддержка. Отвечай по-русски, профессионально и дружелюбно.' },
          { role: 'user', content: message }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  };

  const handleQuickAction = async (action) => {
    const serviceMessages = {
      audit: 'Расскажите о цифровом аудите',
      'ai-bot': 'Интересует AI-ассистент 24/7',
      website: 'Хочу заказать сайт под ключ',
      support: 'Нужна техподдержка'
    };

    const message = serviceMessages[action];
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setLoading(true);

    try {
      const aiResponse = await callAgentRouter(message);
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
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
      const aiResponse = await callAgentRouter(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

      // Check if user provided contact info
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
          whileHover={{ scale: 1.15, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          animate={{ 
            y: [0, -10, 0],
          }}
          transition={{ 
            y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          data-ai-chat-button="true"
          className="relative w-16 h-16 md:w-18 md:h-18 bg-gradient-to-br from-[#7dd3fc] to-[#764ba2] rounded-full shadow-2xl flex items-center justify-center"
          style={{
            boxShadow: '0 20px 40px -10px rgba(125, 211, 252, 0.6), 0 0 0 4px rgba(125, 211, 252, 0.2)'
          }}
        >
          <span className="text-3xl md:text-4xl">💬</span>
          <motion.span 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-4 border-[#0b0f17] shadow-lg"
          ></motion.span>
        </motion.button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed z-50 bg-gradient-to-br from-[#1a1f2e]/95 to-[#0b0f17]/95 backdrop-blur-xl border border-white/20 shadow-2xl flex flex-col overflow-hidden ${
              isMobile 
                ? 'inset-0 w-full h-full rounded-none' 
                : 'bottom-20 md:bottom-24 right-4 md:right-6 w-80 md:w-96 h-[500px] md:h-[600px] rounded-3xl'
            }`}
            style={{
              boxShadow: '0 25px 50px -12px rgba(125, 211, 252, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Header */}
            <div className={`p-4 bg-gradient-to-r from-[#7dd3fc]/30 to-[#764ba2]/30 backdrop-blur-sm border-b border-white/20 flex items-center justify-between ${
              isMobile ? 'rounded-none' : 'rounded-t-3xl'
            }`}>
              <div className="flex items-center gap-3">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="w-12 h-12 bg-gradient-to-br from-[#7dd3fc] to-[#764ba2] rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-[#7dd3fc]/50"
                >
                  🤖
                </motion.div>
                <div>
                  <div className="font-bold text-white text-lg">NeuroExpert AI</div>
                  <div className="text-xs text-white/70 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    {models.find(m => m.id === selectedModel)?.name}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowModelMenu(!showModelMenu)}
                  className="w-10 h-10 bg-gradient-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 rounded-xl transition-all flex items-center justify-center text-white shadow-lg border border-white/10"
                  title="Выбрать модель"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 bg-gradient-to-br from-white/10 to-white/5 hover:from-red-500/20 hover:to-red-600/20 rounded-xl transition-all flex items-center justify-center text-white shadow-lg border border-white/10"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Model Menu */}
            <AnimatePresence>
              {showModelMenu && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-gradient-to-r from-[#1a1f2e]/98 to-[#0b0f17]/98 backdrop-blur-xl border-b border-white/10 overflow-hidden"
                >
                  <div className="p-3 space-y-2">
                    {models.map((model) => (
                      <motion.button
                        key={model.id}
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedModel(model.id);
                          setShowModelMenu(false);
                        }}
                        className={`w-full p-3 rounded-xl transition-all flex items-center gap-3 ${
                          selectedModel === model.id
                            ? 'bg-gradient-to-r from-[#7dd3fc]/30 to-[#764ba2]/30 border-2 border-[#7dd3fc]/50 shadow-lg shadow-[#7dd3fc]/20'
                            : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                        }`}
                      >
                        <span className="text-3xl">{model.icon}</span>
                        <div className="flex-1 text-left">
                          <div className="text-white font-semibold text-sm">{model.name}</div>
                          <div className="text-white/60 text-xs">{model.description}</div>
                        </div>
                        {selectedModel === model.id && (
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-[#7dd3fc] text-xl"
                          >
                            ✓
                          </motion.span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-gradient-to-b from-transparent to-[#0b0f17]/30">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[80%] p-3 md:p-4 shadow-lg text-sm md:text-base ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-[#7dd3fc] to-[#764ba2] text-white rounded-2xl rounded-br-md'
                        : 'bg-gradient-to-br from-white/15 to-white/5 text-white border border-white/20 backdrop-blur-sm rounded-2xl rounded-bl-md'
                    }`}
                    style={msg.role === 'user' ? {
                      boxShadow: '0 10px 25px -5px rgba(125, 211, 252, 0.3)'
                    } : {}}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-gradient-to-br from-white/15 to-white/5 p-3 md:p-4 rounded-2xl border border-white/20 backdrop-blur-sm rounded-bl-md shadow-lg">
                    <div className="flex gap-1.5">
                      <motion.span 
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 bg-[#7dd3fc] rounded-full"
                      ></motion.span>
                      <motion.span 
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-[#764ba2] rounded-full"
                      ></motion.span>
                      <motion.span 
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-[#7dd3fc] rounded-full"
                      ></motion.span>
                    </div>
                  </div>
                </motion.div>
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
            <div className={`p-3 md:p-4 border-t border-white/10 bg-gradient-to-t from-[#0b0f17]/80 to-transparent backdrop-blur-sm flex gap-2 ${
              isMobile ? 'rounded-none' : 'rounded-b-3xl'
            }`}>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Напишите сообщение..."
                className="flex-1 bg-white/90 border-white/20 text-black placeholder:text-gray-500 rounded-2xl text-sm md:text-base focus:border-[#7dd3fc]/50 focus:shadow-lg focus:shadow-[#7dd3fc]/20 transition-all backdrop-blur-sm"
                style={{ color: 'black' }}
                disabled={loading}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-4 md:px-6 py-2 bg-gradient-to-r from-[#7dd3fc] to-[#764ba2] text-white rounded-2xl hover:shadow-xl hover:shadow-[#7dd3fc]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg"
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
