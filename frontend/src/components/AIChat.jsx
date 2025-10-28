import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { Input } from './ui/input';
import { toast } from 'sonner';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').trim();
const API_BASE_URL = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
const API_ENDPOINT = `${API_BASE_URL}/api/chat`.replace(/^\/api\/chat$/g, '/api/chat');
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Привет! Я AI‑консультант NeuroExpert. Расскажите, какая задача перед вами — я помогу найти решение 🚀',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sessionId, setSessionId] = useState('');

  // Initialize session ID
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      let storedSessionId = window.localStorage.getItem('neuroexpert_session_id');
      if (!storedSessionId) {
        storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        window.localStorage.setItem('neuroexpert_session_id', storedSessionId);
      }
      setSessionId(storedSessionId);
    } catch (error) {
      console.warn('Unable to access localStorage for session tracking:', error);
      setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const callAI = async (message, retryCount = 0) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          session_id: sessionId,
          message: message,
          model: 'claude-sonnet',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response || 'Ошибка: не удалось получить ответ.';
      
    } catch (error) {
      console.error(`AI API error (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error);
      
      // Don't retry on abort (timeout)
      if (error.name === 'AbortError') {
        throw new Error('Превышено время ожидания ответа. Попробуйте позже.');
      }
      
      // Retry with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
        return callAI(message, retryCount + 1);
      }
      
      // All retries failed
      throw error;
    }
  };

  const handleQuickAction = async (prompt) => {
    if (loading || !sessionId) return;
    
    setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
    setLoading(true);
    
    try {
      const aiResponse = await callAI(prompt);
      setMessages((prev) => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error('Quick action error:', error);
      const errorMessage = error.message || 'Произошла ошибка, попробуйте ещё раз.';
      toast.error(errorMessage);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Извините, возникла ошибка. Пожалуйста, попробуйте снова или напишите нам напрямую.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !sessionId) return;
    
    const userMessage = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    
    try {
      const aiResponse = await callAI(userMessage);
      setMessages((prev) => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error('Send message error:', error);
      const errorMessage = error.message || 'Ошибка при обращении к серверу';
      toast.error(errorMessage);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Извините, возникла ошибка. Пожалуйста, попробуйте снова или напишите нам напрямую.' },
      ]);
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7dd3fc] to-[#764ba2] flex items-center justify-center text-xl">
                  🤖
                </div>
                <div>
                  <div className="font-bold text-white text-lg">NeuroExpert AI</div>
                  <div className="text-xs text-white/70">AI Assistant</div>
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
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
                <div className="flex justify-start text-white/70 text-sm">
                  <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white/40 border-t-white rounded-full" />
                      Генерация ответа...
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick questions */}
            {!loading && messages.length <= 1 && (
              <div className="p-3 border-t border-white/10 grid grid-cols-2 gap-2">
                {[
                  { label: '💎 Аудит', text: 'Расскажите про цифровой аудит' },
                  { label: '🤖 AI‑бот', text: 'Интересует AI‑ассистент 24/7' },
                  { label: '🚀 Сайт', text: 'Хочу заказать сайт под ключ' },
                  { label: '🛡️ Поддержка', text: 'Нужна техподдержка' },
                ].map((q) => (
                  <button
                    key={q.label}
                    onClick={() => handleQuickAction(q.text)}
                    disabled={loading || !sessionId}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded text-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-white/10 flex gap-2 bg-black/20">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Напишите сообщение..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={loading || !sessionId}
                className="flex-1 rounded-xl bg-white/90 text-black placeholder-gray-500 px-3 py-2"
              />
              <motion.button
                onClick={handleSend}
                whileTap={{ scale: 0.95 }}
                disabled={!input.trim() || loading || !sessionId}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7dd3fc] to-[#764ba2] text-white font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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
