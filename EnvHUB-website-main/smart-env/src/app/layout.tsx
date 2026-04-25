import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/components/cart/CartProvider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SmartEnv — Intelligent IoT for Home & Farm",
    template: "%s | SmartEnv",
  },
  description:
    "AI-powered smart environment solutions. Automate your home, optimize your farm. Hardware bundles curated by AI, delivered to your door.",
  keywords: ["IoT", "smart home", "smart farm", "sensors", "automation", "AI"],
  authors: [{ name: "SmartEnv" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "SmartEnv",
    title: "SmartEnv — Intelligent IoT for Home & Farm",
    description: "AI-powered smart environment solutions.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartEnv",
    description: "AI-powered smart environment solutions.",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-[#0a0a0a] text-white antialiased">
        <SessionProvider session={session}>
          <CartProvider>
            <Navbar session={session} />
            <main className="min-h-screen">{children}</main>
            <Footer />
            <Toaster />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
