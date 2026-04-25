import { CheckCircle2, Cpu, Rocket } from "lucide-react";

const steps = [
  {
    icon: CheckCircle2,
    step: "01",
    title: "Describe",
    description: "Tell us your problem in plain language. No tech knowledge required.",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI Matches",
    description: "Our AI selects the exact sensors and devices for your environment.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    icon: Rocket,
    step: "03",
    title: "Deploy",
    description: "Receive your hardware and follow guided setup tutorials in your dashboard.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-24 px-4 border-t border-white/5"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-3">
            Process
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Three steps to smart.
          </h2>
          <p className="text-gray-500 mt-3 max-w-md mx-auto">
            From problem to deployed IoT system — faster than ever.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map(({ icon: Icon, step, title, description, color, bg, border }, i) => (
            <div
              key={step}
              className="relative glass rounded-2xl p-6 card-hover border border-white/5"
            >
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 -right-3 w-6 h-px bg-white/10 z-10" />
              )}

              <div className={`w-12 h-12 rounded-xl ${bg} border ${border} flex items-center justify-center mb-5`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>

              <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                Step {step}
              </span>
              <h3 className="text-xl font-bold text-white mt-1 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
