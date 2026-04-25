import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your SmartEnv account.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 pb-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 dot-bg opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-green-500/5 blur-[100px] pointer-events-none" />
      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  );
}
