import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    service: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.contact || !formData.service) {
      toast.error('Пожалуйста, заполните обязательные поля');
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/contact`, formData);
      
      if (response.data.success) {
        toast.success(response.data.message || 'Спасибо! Мы свяжемся с вами в течение 15 минут');
        setFormData({ name: '', contact: '', service: '', message: '' });
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Ошибка. Попробуйте ещё раз');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="relative py-12 md:py-20 px-4 md:px-6 overflow-hidden">
      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
            <span className="animated-gradient-text text-glow">Получить консультацию</span>
          </h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-white/60"
          >
            Ответим в течение <span className="color-pulse font-semibold">15 минут</span>
          </motion.p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="relative overflow-hidden rounded-xl"
        >
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#7dd3fc]/10 via-[#764ba2]/10 to-[#7dd3fc]/10" />
          <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/20" />
          
          {/* Neon glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#7dd3fc]/0 to-[#764ba2]/0 hover:from-[#7dd3fc]/5 hover:to-[#764ba2]/5 transition-all duration-500" />
          
          {/* Form Content */}
          <div className="relative z-10 p-6 md:p-8 space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-white mb-2 text-sm font-medium">
                Ваше имя *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Иван Петров"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-lg h-12 focus:border-[#7dd3fc] focus:ring-2 focus:ring-[#7dd3fc]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-white mb-2 text-sm font-medium">
                Телефон / Telegram *
              </label>
              <Input
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="+7 (999) 123-45-67"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-lg h-12 focus:border-[#7dd3fc] focus:ring-2 focus:ring-[#7dd3fc]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-white mb-2 text-sm font-medium">
              Выберите услугу *
            </label>
            <Select value={formData.service} onValueChange={(value) => setFormData({ ...formData, service: value })}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white rounded-lg h-12 focus:border-[#7dd3fc] focus:ring-2 focus:ring-[#7dd3fc]/20 transition-all">
                <SelectValue placeholder="Выберите услугу" />
              </SelectTrigger>
              <SelectContent className="bg-[#121826] border-white/20 rounded-lg">
                <SelectItem value="Цифровой аудит" className="text-white focus:bg-[#7dd3fc]/20">💎 Цифровой аудит</SelectItem>
                <SelectItem value="AI-ассистент 24/7" className="text-white focus:bg-[#7dd3fc]/20">🤖 AI-ассистент 24/7</SelectItem>
                <SelectItem value="Сайты под ключ" className="text-white focus:bg-[#7dd3fc]/20">🚀 Сайты под ключ</SelectItem>
                <SelectItem value="Техподдержка" className="text-white focus:bg-[#7dd3fc]/20">🛡️ Техподдержка</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-white mb-2 text-sm font-medium">
              Сообщение (необязательно)
            </label>
            <Textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Расскажите о вашем проекте..."
              rows={4}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-lg resize-none focus:border-[#7dd3fc] focus:ring-2 focus:ring-[#7dd3fc]/20 transition-all"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-8 py-4 bg-gradient-to-r from-[#7dd3fc] to-[#764ba2] text-black font-semibold text-lg rounded-lg transition-all duration-400 hover:shadow-xl hover:shadow-[#7dd3fc]/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group"
          >
            {/* Button glow effect */}
            <motion.div
              className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0, 0.3, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            />
            
            <span className="relative z-10">
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full inline-block mr-2" />
                  Отправка...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 inline-block mr-2" />
                  Получить консультацию
                </>
              )}
            </span>
          </motion.button>

          {/* Social Links */}
          <div className="flex justify-center gap-6 pt-6 border-t border-white/10">
            <motion.a 
              href="https://t.me/neuroexpert" 
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -2 }}
              className="text-white/60 hover:text-[#7dd3fc] transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.885 8.414l-1.97 9.281c-.148.655-.537.816-1.084.508l-3-2.211-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.585-4.463c.537-.196 1.006.128.831.953z"/>
              </svg>
            </motion.a>
            <motion.a 
              href="#" 
              whileHover={{ scale: 1.1, y: -2 }}
              className="text-white/60 hover:text-[#7dd3fc] transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </motion.a>
            <motion.a 
              href="#" 
              whileHover={{ scale: 1.1, y: -2 }}
              className="text-white/60 hover:text-[#7dd3fc] transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/>
              </svg>
            </motion.a>
          </div>
          </div>
        </motion.form>
      </div>
    </section>
  );
};

export default ContactForm;