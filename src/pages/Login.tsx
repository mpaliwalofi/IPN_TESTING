import { useState } from "react";
import { useNavigate } from "react-router-dom";
import pawPrint from "@/assets/paw-print.png";
import dogImage from "@/assets/dog.png";
import { authService } from "@/services/authService";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await authService.login(email, password);

    if (result.success) {
      // Redirect to home on successful login
      navigate("/home");
    } else {
      setError(result.error || "Login failed. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Form */}
      <div className="w-1/2 p-16 flex flex-col justify-center bg-white">
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
                Upd Legacy Documentation
              </span>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
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
                  required
                  className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-emerald-600" />
                <span className="text-slate-600">Remember me</span>
              </label>
              <button 
                type="button"
                className="text-emerald-700 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white rounded-xl font-medium shadow-lg transition-all ${
                loading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:shadow-xl hover:scale-[1.02]'
              }`}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <a className="text-emerald-700 font-medium" href="#">
              Contact Administrator
            </a>
          </div>
        </div>
      </div>

      {/* Right Side - Keep existing design */}
      <div className="w-1/2 bg-gradient-to-br from-emerald-50 to-teal-50 relative flex items-center justify-center overflow-hidden">
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
            Upd Legacy
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