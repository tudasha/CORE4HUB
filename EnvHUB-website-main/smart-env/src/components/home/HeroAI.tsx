"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Loader2, ShoppingCart, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/CartProvider";
import type { AIRecommendation } from "@/types";

const PLACEHOLDERS = [
  "My basement floods when it rains...",
  "I want to monitor my greenhouse remotely...",
  "My farm crops keep drying out...",
  "I need to automate my irrigation system...",
  "My home energy bill is too high...",
  "I want motion alerts for my farm gate...",
];

const CATEGORY_ICONS: Record<string, string> = {
  SENSOR: "📡",
  ACTUATOR: "⚙️",
  GATEWAY: "🌐",
  HUB: "🏠",
  KIT: "📦",
};

export function HeroAI() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { handleAddToCart } = useCart();

  // Cycle placeholder text
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDERS.length);
      setPlaceholder(PLACEHOLDERS[(placeholderIdx + 1) % PLACEHOLDERS.length]);
    }, 3000);
    return () => clearInterval(interval);
  }, [placeholderIdx]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/ai-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) throw new Error("Failed to get recommendation");
      const data: AIRecommendation = await res.json();
      setResult(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPackageToCart = async () => {
    if (!result) return;
    for (const product of result.products) {
      await handleAddToCart(product.id);
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 dot-bg opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-green-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-green-500/3 blur-[100px] pointer-events-none" />

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/20 bg-green-500/10 mb-8"
      >
        <Sparkles className="w-3.5 h-3.5 text-green-400" />
        <span className="text-xs font-medium text-green-400">
          AI-Powered Hardware Matching
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-4xl sm:text-6xl md:text-7xl font-black text-center max-w-4xl leading-[1.05] tracking-tight mb-5"
      >
        Describe your{" "}
        <span className="gradient-text">environment.</span>
        <br />
        We build your kit.
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-gray-500 text-base sm:text-lg text-center max-w-xl mb-12"
      >
        Tell us your problem. Our AI matches the exact sensors, actuators, and
        devices you need — ready to deploy in minutes.
      </motion.p>

      {/* Input form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="w-full max-w-2xl"
      >
        <form onSubmit={handleSubmit} id="hero-ai-form">
          <div className="relative glass-strong rounded-2xl p-1.5 glow-green-sm">
            <textarea
              ref={textareaRef}
              id="hero-ai-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="w-full bg-transparent text-white placeholder-gray-600 resize-none px-4 pt-3 pb-2 text-base focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="flex items-center justify-between px-3 pb-2">
              <span className="text-xs text-gray-700">
                Press Enter to submit · Shift+Enter for new line
              </span>
              <Button
                id="hero-ai-submit"
                type="submit"
                disabled={loading || !query.trim()}
                className="bg-green-500 hover:bg-green-400 text-black font-bold px-5 h-9 rounded-xl disabled:opacity-40"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Analyze <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </motion.div>

      {/* AI Loading State */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-10 flex flex-col items-center gap-3"
          >
            <div className="flex items-center gap-3 glass rounded-xl px-5 py-3">
              <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
              <span className="text-sm text-gray-400">
                AI is analyzing your environment...
              </span>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-green-500/60"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            {error}
            <button onClick={() => setError(null)} className="ml-2">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-10 w-full max-w-2xl"
            id="ai-result"
          >
            <div className="glass rounded-2xl p-6 border border-green-500/20 glow-green">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400 font-medium uppercase tracking-wide">
                      AI Recommendation
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white">{result.packageName}</h2>
                  <p className="text-sm text-gray-500 mt-1">{result.description}</p>
                </div>
                <button
                  onClick={() => setResult(null)}
                  className="text-gray-600 hover:text-gray-400 transition-colors ml-4"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Products */}
              <div className="space-y-2 mb-5">
                {result.products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                  >
                    <span className="text-2xl">
                      {CATEGORY_ICONS[product.category] ?? "📦"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{product.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {product.description}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-green-400 flex-shrink-0">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer CTA */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div>
                  <p className="text-xs text-gray-500">Total package</p>
                  <p className="text-2xl font-black text-white">
                    ${result.totalPrice.toFixed(2)}
                  </p>
                </div>
                <Button
                  id="ai-add-to-cart-btn"
                  onClick={handleAddPackageToCart}
                  className="bg-green-500 hover:bg-green-400 text-black font-bold px-6 h-11"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add Package to Cart
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
