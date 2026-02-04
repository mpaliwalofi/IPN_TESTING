import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import logoImage from "@/assets/logoImage.png";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/home", label: "Home" },
    { path: "/overview", label: "Overview" },
    { path: "/explore", label: "Explorer" },
    { path: "/docs", label: "Documentation" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-gradient-to-r from-[#024639] via-[#025a49] to-[#024639] text-white shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-3 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/home')}
          >
            <img 
              src={logoImage} 
              alt="Inspired Pet Nutrition" 
              className="h-10 w-auto object-contain"
            />
            <div className="hidden sm:block">
              <div className="text-sm font-bold">IPN Docs</div>
              <div className="text-xs text-emerald-200">API Documentation</div>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <motion.button
                key={link.path}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(link.path)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.path)
                    ? "bg-emerald-700 text-white shadow-md"
                    : "text-emerald-100 hover:text-white hover:bg-emerald-700/50"
                }`}
              >
                {link.label}
              </motion.button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-emerald-700/50 transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-emerald-800 border-t border-emerald-700 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <motion.button
                  key={link.path}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    navigate(link.path);
                    setIsMenuOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-3 rounded-lg text-base font-medium transition-all ${
                    isActive(link.path)
                      ? "bg-emerald-700 text-white"
                      : "text-emerald-100 hover:text-white hover:bg-emerald-700/50"
                  }`}
                >
                  {link.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}