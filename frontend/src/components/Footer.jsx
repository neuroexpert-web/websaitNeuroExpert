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
            <ul className="space-y-2 text-white/60 text-sm sm:text-base mb-4">
              <li>Email: info@neuroexpert.ru</li>
              <li>Telegram: @neuroexpert</li>
              <li>Работаем 24/7</li>
            </ul>
            {/* Social */}
            <a
              href="https://vk.com/club231722532"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#4680C2] to-[#5181B8] text-white rounded-lg hover:shadow-lg hover:shadow-[#4680C2]/30 transition-all duration-300 group"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.162 18.994c.609 0 .858-.406.851-.915-.031-1.917.714-2.949 2.059-1.604 1.488 1.488 1.796 2.519 3.603 2.519h3.2c.808 0 1.126-.26 1.126-.668 0-.863-1.421-2.386-2.625-3.504-1.686-1.565-1.765-1.602-.313-3.486 1.801-2.339 4.157-5.336 2.073-5.336h-3.981c-.772 0-.828.435-1.103 1.083-.995 2.347-2.886 5.387-3.604 4.922-.751-.485-.407-2.406-.35-5.261.015-.754.011-1.271-1.141-1.539-.629-.145-1.241-.205-1.809-.205-2.273 0-3.841.953-2.95 1.119 1.571.293 1.42 3.692 1.054 5.16-.638 2.556-3.036-2.024-4.035-4.305-.241-.548-.315-.974-1.175-.974h-3.255c-.492 0-.787.16-.787.516 0 .602 2.96 6.72 5.786 9.77 2.756 2.975 5.48 2.708 7.376 2.708z"/>
              </svg>
              <span className="text-sm font-semibold">ВКонтакте</span>
            </a>
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