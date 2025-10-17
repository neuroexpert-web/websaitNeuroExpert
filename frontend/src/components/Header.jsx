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
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#7dd3fc] to-[#764ba2] rounded-full flex items-center justify-center">
            <span className="text-lg sm:text-xl font-bold text-white">N</span>
          </div>
          <span className="text-lg sm:text-xl font-bold text-white">NeuroExpert</span>
        </motion.div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-white/70 hover:text-[#7dd3fc] transition-colors text-base lg:text-lg font-medium"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* CTA Button */}
        <motion.a
          href="#contact"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="hidden md:block px-4 lg:px-6 py-2 lg:py-3 bg-[#7dd3fc] text-black font-semibold text-sm lg:text-base rounded-xl hover:bg-white transition-all duration-400"
        >
          Начать
        </motion.a>

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
          className="md:hidden bg-[#0b0f17] border-t border-white/10"
        >
          <nav className="px-4 sm:px-6 py-4 space-y-4">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-white/70 hover:text-[#7dd3fc] transition-colors text-lg py-2"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-6 py-3 bg-[#7dd3fc] text-black font-semibold text-center rounded-xl mt-4"
            >
              Начать
            </a>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
};

export default Header;