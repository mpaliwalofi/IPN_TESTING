import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import pawPrint from "@/assets/paw-print.png";
import dogImage from "@/assets/dog.png";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simple validation
    if (!email || !password) {
      setError("Please enter both email and password");
      setIsLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      // Attempt login with Firebase
      await login(email, password);
      // Navigate to home on success
      navigate("/home");
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Form */}
      <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white">
        <div className="max-w-md mx-auto w-full">
          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-emerald-700 rounded-full" />
              <div className="w-2 h-2 bg-emerald-600 rounded-full" />
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            </div>

            <h1 className="text-4xl font-light text-slate-800 mb-2">
              Welcome Back
            </h1>
            <p className="text-slate-500">
              Sign in to access{" "}
              <span className="font-medium text-emerald-700">
                IPN Legacy Documentation
              </span>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:border-emerald-500 transition-all"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:border-emerald-500 transition-all"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-emerald-600 cursor-pointer" />
                <span className="text-slate-600">Remember me</span>
              </label>
              <a href="#" className="text-emerald-700 hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:from-emerald-800 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <span className="text-emerald-700 font-medium">
              Contact Administrator
            </span>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-emerald-50 to-teal-50 relative items-center justify-center overflow-hidden">
        {/* Decorative paw prints */}
        {[...Array(8)].map((_, i) => (
          <img
            key={i}
            src={pawPrint}
            alt="Paw print"
            className="absolute w-10 h-10 opacity-15"
            style={{
              top: `${Math.random() * 80 + 10}%`,
              left: `${Math.random() * 80 + 10}%`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}

        {/* Branding */}
        <div className="absolute top-12 text-center">
          <div className="text-5xl font-extralight text-emerald-800">
            IPN Legacy
          </div>
          <div className="text-lg font-light text-emerald-600 tracking-widest uppercase opacity-70">
            Documentation
          </div>
        </div>

        {/* Dog Image */}
        <img
          src={dogImage}
          alt="Friendly dog"
          className="w-full max-w-2xl object-contain relative z-10 mt-32"
        />
      </div>
    </div>
  );
}