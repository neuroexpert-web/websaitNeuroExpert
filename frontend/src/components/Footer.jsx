import React from 'react';
import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative py-8 sm:py-10 md:py-12 px-4 sm:px-6 bg-[#0b0f17] border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12 mb-6 sm:mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#7dd3fc] to-[#764ba2] rounded-full flex items-center justify-center">
                <span className="text-lg sm:text-xl font-bold text-white">N</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-white">NeuroExpert</span>
            </div>
            <p className="text-white/60 leading-relaxed text-sm sm:text-base">
              Цифровые решения с ИИ для вашего бизнеса
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Услуги</h3>
            <ul className="space-y-2">
              <li>
                <a href="#service-1" className="text-white/60 hover:text-[#7dd3fc] transition-colors text-sm sm:text-base">
                  Цифровой аудит
                </a>
              </li>
              <li>
                <a href="#service-2" className="text-white/60 hover:text-[#7dd3fc] transition-colors text-sm sm:text-base">
                  AI-ассистент 24/7
                </a>
              </li>
              <li>
                <a href="#service-3" className="text-white/60 hover:text-[#7dd3fc] transition-colors text-sm sm:text-base">
                  Сайты под ключ
                </a>
              </li>
              <li>
                <a href="#service-4" className="text-white/60 hover:text-[#7dd3fc] transition-colors text-sm sm:text-base">
                  Техподдержка
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Контакты</h3>
            <ul className="space-y-2 text-white/60 text-sm sm:text-base">
              <li>Email: info@neuroexpert.ru</li>
              <li>Telegram: @neuroexpert</li>
              <li>Работаем 24/7</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 sm:pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-white/60 text-xs sm:text-sm flex items-center gap-2 text-center md:text-left">
            © 2025 NeuroExpert. Made with <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-[#7dd3fc]" /> and AI
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-xs sm:text-sm text-white/60 text-center">
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