"use client";

import Link from "next/link";
import { Cpu, Code, Globe, Mail } from "lucide-react";

const links = {
  product: [
    { label: "Catalog", href: "/catalog" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
  ],
  legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#080808]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-green-400" />
              </div>
              <span className="font-bold text-white text-lg">
                Smart<span className="text-green-400">Env</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-[220px]">
              AI-powered IoT solutions for smarter homes and more efficient farms.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[
                { Icon: Code, href: "#", label: "GitHub" },
                { Icon: Globe, href: "#", label: "Website" },
                { Icon: Mail, href: "#", label: "Email" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:border-white/20 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            { title: "Product", items: links.product },
            { title: "Company", items: links.company },
            { title: "Legal", items: links.legal },
          ].map(({ title, items }) => (
            <div key={title}>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                {title}
              </h4>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-500 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} SmartEnv. All rights reserved.
          </p>
          <p className="text-xs text-gray-700">
            Built with Next.js · Tailwind CSS · Prisma · Neon
          </p>
        </div>
      </div>
    </footer>
  );
}
