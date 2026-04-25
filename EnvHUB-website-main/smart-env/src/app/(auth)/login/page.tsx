"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Cpu, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div>
      {/* Logo */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="w-9 h-9 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
          <Cpu className="w-5 h-5 text-green-400" />
        </div>
        <span className="font-bold text-white text-xl">
          Smart<span className="text-green-400">Env</span>
        </span>
      </div>

      <div className="glass rounded-2xl p-8 border border-white/8">
        <div className="mb-7">
          <h1 className="text-2xl font-black text-white">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {state?.error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {state.error}
          </div>
        )}

        <form action={formAction} id="login-form" className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-sm text-gray-400">
              Email
            </Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-green-500/50 focus:ring-0 h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password" className="text-sm text-gray-400">
              Password
            </Label>
            <Input
              id="login-password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-green-500/50 focus:ring-0 h-11"
            />
          </div>

          <Button
            id="login-submit-btn"
            type="submit"
            disabled={isPending}
            className="w-full h-11 bg-green-500 hover:bg-green-400 text-black font-bold text-base"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          No account?{" "}
          <Link
            href="/register"
            id="login-register-link"
            className="text-green-400 hover:text-green-300 font-medium transition-colors"
          >
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
