import React from 'react';
import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative py-12 px-6 bg-[#0b0f17] border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#7dd3fc] to-[#764ba2] rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-white">N</span>
              </div>
              <span className="text-xl font-bold text-white">NeuroExpert</span>
            </div>
            <p className="text-white/60 leading-relaxed">
              Цифровые решения с ИИ для вашего бизнеса
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">Услуги</h3>
            <ul className="space-y-2">
              <li>
                <a href="#service-1" className="text-white/60 hover:text-[#7dd3fc] transition-colors">
                  Цифровой аудит
                </a>
              </li>
              <li>
                <a href="#service-2" className="text-white/60 hover:text-[#7dd3fc] transition-colors">
                  AI-ассистент 24/7
                </a>
              </li>
              <li>
                <a href="#service-3" className="text-white/60 hover:text-[#7dd3fc] transition-colors">
                  Сайты под ключ
                </a>
              </li>
              <li>
                <a href="#service-4" className="text-white/60 hover:text-[#7dd3fc] transition-colors">
                  Техподдержка
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">Контакты</h3>
            <ul className="space-y-2 text-white/60">
              <li>Email: info@neuroexpert.ru</li>
              <li>Telegram: @neuroexpert</li>
              <li>Работаем 24/7</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/60 text-sm flex items-center gap-2">
            © 2025 NeuroExpert. Made with <Heart className="w-4 h-4 text-[#7dd3fc]" /> and AI
          </p>
          <div className="flex gap-6 text-sm text-white/60">
            <a href="#" className="hover:text-[#7dd3fc] transition-colors">
              Политика конфиденциальности
            </a>
            <a href="#" className="hover:text-[#7dd3fc] transition-colors">
              Условия использования
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;