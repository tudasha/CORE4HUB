"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { ShoppingCart, Cpu, Menu, X, User, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Button } from "@/components/ui/button";
import type { Session } from "next-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Catalog", href: "/catalog" },
  { label: "How it works", href: "/#how-it-works" },
];

export function Navbar({ session }: { session: Session | null }) {
  const { itemCount, setIsOpen: setCartOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 group"
              id="nav-logo"
            >
              <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                <Cpu className="w-4 h-4 text-green-400" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">
                Smart<span className="text-green-400">Env</span>
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Cart */}
              <button
                id="nav-cart-btn"
                onClick={() => setCartOpen(true)}
                className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                aria-label="Open cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 text-[10px] font-bold text-black flex items-center justify-center">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </button>

              {/* Auth */}
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    id="nav-user-menu"
                    className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 hover:bg-green-500/30 transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-[#111] border-white/10 text-white w-48"
                  >
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{session.user?.name}</p>
                      <p className="text-xs text-gray-500">{session.user?.email}</p>
                    </div>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      id="nav-dashboard-link"
                      className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white"
                      onClick={() => router.push('/dashboard')}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      id="nav-logout-btn"
                      className="flex items-center gap-2 cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/login">
                    <Button
                      id="nav-login-btn"
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white hover:bg-white/5"
                    >
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      id="nav-register-btn"
                      size="sm"
                      className="bg-green-500 hover:bg-green-400 text-black font-semibold"
                    >
                      Get started
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                id="nav-mobile-menu-btn"
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 px-4 py-4 space-y-3 bg-[#0a0a0a]">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-gray-400 hover:text-white transition-colors py-1"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!session && (
              <div className="pt-3 flex gap-2">
                <Link href="/login" className="flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button
                    size="sm"
                    className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold"
                  >
                    Get started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      <CartDrawer />
    </>
  );
}
