import { useNavigate } from "react-router-dom";
import { Github, Mail, FileText, Code, Database } from "lucide-react";

export default function Footer() {
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300 border-t border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
              <FileText size={20} className="text-emerald-500" />
              IPN Docs
            </h3>
            <p className="text-sm leading-relaxed text-slate-400 mb-4">
              Comprehensive API documentation for Inspired Pet Nutrition's multi-repository architecture.
            </p>
            <div className="flex gap-3">
              <a 
                href="https://github.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Github size={18} />
              </a>
              <a 
                href="mailto:docs@example.com"
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button 
                  onClick={() => navigate('/home')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-2"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/overview')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-2"
                >
                  Overview
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/explore')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-2"
                >
                  Explorer
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/docs')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-2"
                >
                  Documentation
                </button>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-slate-400">
                <Code size={14} className="text-emerald-500" />
                <span>Backend (PHP)</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <Code size={14} className="text-blue-500" />
                <span>Frontend (Vue.js)</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <Database size={14} className="text-purple-500" />
                <span>CMS (Strapi)</span>
              </li>
            </ul>
          </div>

          {/* Statistics */}
          <div>
            <h4 className="text-white font-semibold mb-4">Documentation Stats</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between items-center">
                <span className="text-slate-400">Total Files</span>
                <span className="text-white font-semibold">4,516</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-slate-400">Backend</span>
                <span className="text-emerald-400 font-semibold">1,685</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-slate-400">Frontend</span>
                <span className="text-blue-400 font-semibold">2,073</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-slate-400">Other</span>
                <span className="text-slate-400 font-semibold">758</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            © {currentYear} Inspired Pet Nutrition. Auto-generated documentation.
          </p>
          <div className="flex gap-6 text-xs text-slate-500">
            <button className="hover:text-emerald-400 transition-colors">
              Privacy Policy
            </button>
            <button className="hover:text-emerald-400 transition-colors">
              Terms of Use
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}