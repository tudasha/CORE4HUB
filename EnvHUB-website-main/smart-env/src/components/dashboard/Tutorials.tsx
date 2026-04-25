import { Play, BookOpen } from "lucide-react";

const TUTORIALS = [
  {
    id: "tut-1",
    title: "Getting Started",
    duration: "5 min",
    category: "Basics",
    icon: "🚀",
    color: "from-green-500/20 to-green-900/10",
  },
  {
    id: "tut-2",
    title: "Setup Soil Sensors",
    duration: "8 min",
    category: "Farming",
    icon: "🌱",
    color: "from-emerald-500/20 to-emerald-900/10",
  },
  {
    id: "tut-3",
    title: "Automate Irrigation",
    duration: "12 min",
    category: "Farming",
    icon: "💧",
    color: "from-blue-500/20 to-blue-900/10",
  },
  {
    id: "tut-4",
    title: "Configure Hub",
    duration: "10 min",
    category: "Home",
    icon: "🏠",
    color: "from-purple-500/20 to-purple-900/10",
  },
  {
    id: "tut-5",
    title: "Motion Alerts Setup",
    duration: "6 min",
    category: "Security",
    icon: "🔔",
    color: "from-yellow-500/20 to-yellow-900/10",
  },
  {
    id: "tut-6",
    title: "Dashboard Overview",
    duration: "4 min",
    category: "Basics",
    icon: "📊",
    color: "from-orange-500/20 to-orange-900/10",
  },
];

export function Tutorials() {
  return (
    <div className="glass rounded-2xl p-6 border border-white/5 h-fit" id="tutorials">
      <div className="flex items-center gap-2 mb-5">
        <BookOpen className="w-5 h-5 text-green-400" />
        <h2 className="font-bold text-white text-lg">Tutorials</h2>
      </div>

      <div className="space-y-3">
        {TUTORIALS.map((tutorial) => (
          <button
            key={tutorial.id}
            id={tutorial.id}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-green-500/20 hover:bg-white/8 transition-all group text-left"
          >
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tutorial.color} flex items-center justify-center text-lg flex-shrink-0`}
            >
              {tutorial.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{tutorial.title}</p>
              <p className="text-xs text-gray-600 mt-0.5">
                {tutorial.category} · {tutorial.duration}
              </p>
            </div>
            <Play className="w-4 h-4 text-gray-700 group-hover:text-green-400 transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
