"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, redirect to dashboard
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 bg-brand-700 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-xl font-bold text-gray-900">
              Organic SEO
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Create your account
          </h1>
          <p className="text-gray-600 mt-1">
            Start tracking your AI search visibility for free
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="input pl-11"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input pl-11"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="input pl-11"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base"
          >
            Create Account
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {[
            "Free forever for basic usage",
            "Track rankings across ChatGPT, Perplexity & Gemini",
            "AI-powered website analysis included",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 text-sm text-gray-600"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              {item}
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-brand-600 hover:text-brand-700 font-semibold"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
