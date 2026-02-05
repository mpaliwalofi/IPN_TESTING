import { useState } from "react";
import { UserPlus, Users, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { authService } from "@/services/authService";

export default function AdminPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await authService.createEmployee(email, password);

    if (result.success) {
      setMessage({ 
        type: 'success', 
        text: `Employee account created successfully for ${email}` 
      });
      setEmail("");
      setPassword("");
    } else {
      setMessage({ 
        type: 'error', 
        text: result.error || 'Failed to create account' 
      });
    }

    setLoading(false);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/20 to-gray-50 flex flex-col">
      <Navigation />

      <div className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-emerald-600 rounded-xl">
              <Users className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Admin Panel
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Create and manage employee accounts for documentation access
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          {/* Create Employee Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <UserPlus className="text-emerald-600" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Create Employee Account
              </h2>
            </div>

            {/* Message Display */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle size={20} className="shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                )}
                <span className="text-sm">{message.text}</span>
              </motion.div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Employee Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    placeholder="employee@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Generate Password
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Enter or generate password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Password must be at least 6 characters long
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-semibold shadow-lg transition-all ${
                  loading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:shadow-xl hover:scale-[1.02]'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <UserPlus size={20} />
                    Create Employee Account
                  </span>
                )}
              </button>
            </form>
          </motion.div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6"
          >
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <AlertCircle size={20} />
              Important Notes
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Share the credentials securely with the employee</li>
              <li>• Employees can access all documentation pages</li>
              <li>• Only admin accounts can access this panel</li>
              <li>• Passwords cannot be retrieved once created</li>
            </ul>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}