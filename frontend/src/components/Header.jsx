import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Услуги', href: '#services' },
    { label: 'Портфолио', href: '#portfolio' },
    { label: 'Команда', href: '#team' },
    { label: 'Контакты', href: '#contact' }
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-400 ${
        scrolled ? 'bg-[#0b0f17]/95 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 sm:gap-3 cursor-pointer group">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#7dd3fc] to-[#764ba2] rounded-full flex items-center justify-center shadow-lg shadow-[#7dd3fc]/30"
          >
            <span className="text-lg sm:text-xl font-bold text-white">N</span>
          </motion.div>
          <span className="text-lg sm:text-xl font-bold text-white group-hover:text-[#7dd3fc] transition-colors">
            NeuroExpert
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navItems.map((item) => (
            <motion.a
              key={item.href}
              href={item.href}
              whileHover={{ y: -2 }}
              className="text-white/70 hover:text-[#7dd3fc] transition-all duration-300 text-base lg:text-lg font-medium relative group"
            >
              {item.label}
              {/* Underline animation */}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#7dd3fc] to-[#764ba2] group-hover:w-full transition-all duration-300" />
            </motion.a>
          ))}
        </nav>

        {/* VK & CTA Buttons */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4">
          {/* VK Button */}
          <motion.a
            href="https://vk.com/club231722532"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            className="w-11 h-11 lg:w-12 lg:h-12 bg-gradient-to-br from-[#4680C2] to-[#5181B8] rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl hover:shadow-[#4680C2]/50 transition-all duration-300"
            title="ВКонтакте"
          >
            <svg className="w-6 h-6 lg:w-7 lg:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13.162 18.994c.609 0 .858-.406.851-.915-.031-1.917.714-2.949 2.059-1.604 1.488 1.488 1.796 2.519 3.603 2.519h3.2c.808 0 1.126-.26 1.126-.668 0-.863-1.421-2.386-2.625-3.504-1.686-1.565-1.765-1.602-.313-3.486 1.801-2.339 4.157-5.336 2.073-5.336h-3.981c-.772 0-.828.435-1.103 1.083-.995 2.347-2.886 5.387-3.604 4.922-.751-.485-.407-2.406-.35-5.261.015-.754.011-1.271-1.141-1.539-.629-.145-1.241-.205-1.809-.205-2.273 0-3.841.953-2.95 1.119 1.571.293 1.42 3.692 1.054 5.16-.638 2.556-3.036-2.024-4.035-4.305-.241-.548-.315-.974-1.175-.974h-3.255c-.492 0-.787.16-.787.516 0 .602 2.96 6.72 5.786 9.77 2.756 2.975 5.48 2.708 7.376 2.708z"/>
            </svg>
          </motion.a>

          {/* CTA Button */}
          <motion.a
            href="#contact"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-5 lg:px-7 py-2.5 lg:py-3.5 bg-gradient-to-r from-[#7dd3fc] to-[#764ba2] text-white font-bold text-sm lg:text-base rounded-xl hover:shadow-xl hover:shadow-[#7dd3fc]/50 transition-all duration-400 breathing-glow relative overflow-hidden group"
          >
            {/* Animated shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
            />
            <span className="relative z-10">🚀</span>
            <span className="relative z-10">Начать</span>
          </motion.a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white p-2"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-[#0b0f17]/95 backdrop-blur-xl border-t border-white/10"
        >
          <nav className="px-4 sm:px-6 py-4 space-y-2">
            {navItems.map((item, idx) => (
              <motion.a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="block text-white/70 hover:text-[#7dd3fc] hover:bg-white/5 transition-all duration-300 text-lg py-3 px-4 rounded-lg"
              >
                {item.label}
              </motion.a>
            ))}
            <motion.a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: navItems.length * 0.1 }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7dd3fc] to-[#764ba2] text-white font-bold text-center rounded-xl mt-4 shadow-lg shadow-[#7dd3fc]/30"
            >
              <span>🚀</span>
              <span>Начать</span>
            </motion.a>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
};

export default Header;