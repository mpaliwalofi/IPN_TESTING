import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import logoImage from "@/assets/logoImage.png";
import { authService } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/home", label: "HOME" },
    { path: "/overview", label: "OVERVIEW" },
    { path: "/explore", label: "EXPLORER" },
    { path: "/docs", label: "DOCUMENTATION" },
  ];

  const handleLogout = async () => {
    await authService.logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#004536] text-white shadow">
      <div className="w-full px-6 lg:px-12">

        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => navigate("/home")}
          >
            <img
              src={logoImage}
              alt="Inspired Pet Nutrition"
              className="h-12 w-auto object-contain"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`text-sm font-semibold tracking-wide transition-colors ${
                  isActive(link.path)
                    ? "text-white"
                    : "text-emerald-200 hover:text-white"
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2"
            >
              {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
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
