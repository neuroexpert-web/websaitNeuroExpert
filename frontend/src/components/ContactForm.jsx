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
      // Mock API call - will be replaced with real backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Спасибо! Мы свяжемся с вами в течение 15 минут');
      
      setFormData({ name: '', contact: '', service: '', message: '' });
    } catch (error) {
      toast.error('Ошибка. Попробуйте ещё раз');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="relative py-20 px-6 bg-[#0b0f17]">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl font-bold text-white mb-4">
            Получить консультацию
          </h2>
          <p className="text-xl text-white/60">
            Ответим в течение 15 минут
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="p-8 rounded-none bg-white/5 backdrop-blur-xl border border-white/10 space-y-6"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white mb-2 text-sm font-medium">
                Ваше имя *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Иван Петров"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-none"
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
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-white mb-2 text-sm font-medium">
              Выберите услугу *
            </label>
            <Select value={formData.service} onValueChange={(value) => setFormData({ ...formData, service: value })}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white rounded-none">
                <SelectValue placeholder="Выберите услугу" />
              </SelectTrigger>
              <SelectContent className="bg-[#121826] border-white/20">
                <SelectItem value="audit" className="text-white">💎 Цифровой аудит</SelectItem>
                <SelectItem value="ai-assistant" className="text-white">🤖 AI-ассистент 24/7</SelectItem>
                <SelectItem value="website" className="text-white">🚀 Сайты под ключ</SelectItem>
                <SelectItem value="support" className="text-white">🛡️ Техподдержка</SelectItem>
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
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-none resize-none"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-8 py-4 bg-[#7dd3fc] text-black font-semibold text-lg rounded-none transition-all duration-400 hover:bg-white hover:shadow-lg hover:shadow-[#7dd3fc]/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" />
                Отправка...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Получить консультацию
              </>
            )}
          </motion.button>

          {/* Social Links */}
          <div className="flex justify-center gap-6 pt-6 border-t border-white/10">
            <a href="#" className="text-white/60 hover:text-[#7dd3fc] transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3 8h-1.35c-.538 0-.65.221-.65.778v1.222h2l-.209 2h-1.791v7h-3v-7h-2v-2h2v-2.308c0-1.769.931-2.692 3.029-2.692h1.971v3z"/>
              </svg>
            </a>
            <a href="#" className="text-white/60 hover:text-[#7dd3fc] transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z"/>
              </svg>
            </a>
            <a href="#" className="text-white/60 hover:text-[#7dd3fc] transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm4.441 16.892c-2.102.144-6.784.144-8.883 0-2.276-.156-2.541-1.27-2.558-4.892.017-3.629.285-4.736 2.558-4.892 2.099-.144 6.782-.144 8.883 0 2.277.156 2.541 1.27 2.559 4.892-.018 3.629-.285 4.736-2.559 4.892zm-6.441-7.234l4.917 2.338-4.917 2.346v-4.684z"/>
              </svg>
            </a>
          </div>
        </motion.form>
      </div>
    </section>
  );
};

export default ContactForm;