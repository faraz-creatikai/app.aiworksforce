"use client";

import { useEffect, useState } from "react";
import { useEmployeeAuth } from "@/context/EmployeeAuthContext";
import BrandLogo from "@/app/component/labels/BrandLogo";
import { Lock, Eye, EyeOff, ArrowRight, Users, TrendingUp, Star, Check } from "lucide-react";
import { useRouter } from "next/navigation";

// TODO: swap for a real brand photo once one is available
const WORKSPACE_IMAGE = "/employee-login-bg.png";
//"https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80";

export default function EmployeeLogin() {
  const { login, employee } = useEmployeeAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login({ Email: email, Password: password });
    if (employee) {
      router.push("/employee/attendance");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (employee) {
      router.push("/employee/attendance");
    }
  }, [employee, router]);

  return (
    <div className="h-screen w-full overflow-hidden flex bg-white">
      {/* --- LEFT PANEL: brand + photo (hidden on mobile so nothing scrolls) --- */}
      <div className="hidden md:flex md:w-1/2 h-full relative flex-col justify-between bg-gradient-to-b  px-12 py-10 overflow-hidden">
        {/* Workspace photo, fading in from the left */}
        <div
          className="absolute inset-y-0 right-0 w-[60%] bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to right, white, rgba(255,255,255,0) 20%), url(${WORKSPACE_IMAGE})`,
          }}
        />
        {/* Small quote card floating over the photo */}
        <div className="absolute top-24 right-10 z-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-5 py-4 max-w-[170px] border border-gray-100">
          <p className="text-[var(--color-primary)] font-bold leading-snug">
            Same team.
            <br />
            Bigger tomorrows.
          </p>
        </div>

        <div className="relative z-10">
          <BrandLogo variant="text" className="h-14 w-44 object-contain" />
        </div>

        <div className="relative z-10 max-w-sm space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold text-gray-900 leading-tight tracking-tight">
              A better workplace for{" "}
              <span className="text-[var(--color-primary)]">a brighter tomorrow</span>
            </h1>
            <p className="text-[var(--color-gray)] font-medium leading-relaxed">
              Empowering our people to create, collaborate and grow — together.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              { icon: Users, title: "Collaborate", desc: "Stronger teams, bigger possibilities" },
              { icon: TrendingUp, title: "Grow", desc: "Continuous learning, real impact" },
              { icon: Star, title: "Make an impact", desc: "Your work shapes what's next" },
            ].map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="w-10 h-10 shrink-0 rounded-full bg-[var(--color-primary-lighter)] flex items-center justify-center">
                  <Icon size={18} className="text-[var(--color-primary)]" />
                </span>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{title}</p>
                  <p className="text-sm text-[var(--color-gray)]">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p
          className="relative z-10 text-2xl text-[var(--color-primary-darker)] opacity-70"
          style={{ fontFamily: "cursive" }}
        >
          Good people, great things
        </p>
      </div>

      {/* --- RIGHT PANEL: login card --- */}
      {/* Base tint uses a static Tailwind color, not var(), so the panel reliably
          reads as part of the page even if the custom color tokens aren't picked
          up wherever this renders. Buttons, links, icons and focus rings below
          still use the brand var(--color-primary) tokens as normal. */}
      <div className="w-full md:w-1/2 h-full relative flex flex-col items-center justify-center gap-3 bg-blue-50 px-6 py-4 overflow-hidden">
        {/* Decorative corner shapes — static colors so they always render */}
        <div className="absolute -top-28 -right-28 w-80 h-80 rounded-full bg-blue-100 opacity-70 pointer-events-none" />
        <div className="absolute bottom-[-18%] right-[2%] w-72 h-72 rounded-full border-[26px] border-blue-100 opacity-80 pointer-events-none" />
        <div className="absolute top-[10%] left-[-10%] w-40 h-40 rounded-full bg-blue-100 opacity-50 pointer-events-none" />

        {/* Logo shown only on mobile, since the branded panel is hidden */}
        <div className="md:hidden relative z-10">
          <BrandLogo variant="text" className="h-16 w-56 object-contain" />
        </div>

        <div className="relative z-10 w-full max-w-md rounded-[28px]  p-6 sm:p-8">
          <div className="w-11 h-11 rounded-2xl bg-[var(--color-primary-lighter)] flex items-center justify-center mb-4">
            <Lock size={20} className="text-[var(--color-primary)]" />
          </div>

          <p className="text-xs font-bold tracking-[0.15em] text-gray-400 mb-2">WELCOME BACK</p>
          <h1 className="text-3xl font-extrabold text-gray-900">Employee Login</h1>
          <p className="text-[var(--color-gray)] mt-1.5 mb-8 text-sm">
            Sign in to access your workspace, tools and resources.
          </p>

          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Floating-label input: no box, no fill — the placeholder itself
                rises into the label position on focus or once a value exists. */}
            <div className="relative z-0">
              <input
                id="employee-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                className="peer block w-full py-2 px-0 text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-200 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-primary)] transition-colors"
              />
              <label
                htmlFor="employee-email"
                className="absolute left-0 top-2 -z-10 origin-[0] text-sm text-gray-400 duration-200 -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-[var(--color-primary)]"
              >
                Email address
              </label>
            </div>

            <div className="relative z-0">
              <input
                id="employee-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                className="peer block w-full py-2 px-0 pr-8 text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-200 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-primary)] transition-colors"
              />
              <label
                htmlFor="employee-password"
                className="absolute left-0 top-2 -z-10 origin-[0] text-sm text-gray-400 duration-200 -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-[var(--color-primary)]"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-0 top-1.5 text-gray-400 hover:text-[var(--color-primary)] transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2.5 text-[var(--color-gray)] cursor-pointer select-none">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={keepSignedIn}
                  onClick={() => setKeepSignedIn((v) => !v)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${keepSignedIn
                      ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                      : "border-[var(--color-muted)] bg-white"
                    }`}
                >
                  {keepSignedIn && <Check size={13} className="text-white" strokeWidth={3} />}
                </button>
                Keep me signed in
              </label>
              {/* TODO: point this at the real forgot-password route once it exists */}
              <a href="/employee/forgot-password" className="font-semibold text-[var(--color-primary)] hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold rounded-full shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--color-gray)] mt-6">
            Need help?{" "}
            <a
              href="https://creatikai.com/resourses/contact-us"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--color-primary)] hover:underline"
            >
              Contact IT Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}