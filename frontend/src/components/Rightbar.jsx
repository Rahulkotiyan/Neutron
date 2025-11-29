import React from "react";
import {
  Calendar,
  TrendingUp,
  ChevronRight,
  ExternalLink,
  Clock,
} from "lucide-react";

const Rightbar = () => {
  const trends = [
    { tag: "#IPLFinal", posts: "12.5k posts" },
    { tag: "#SemesterExams", posts: "8.2k posts" },
    { tag: "#DAIT_FEST24", posts: "5.1k posts" },
    { tag: "#CampusLife", posts: "2.3k posts" },
  ];

  return (
    <aside className="w-80 bg-black border-l border-white/10 p-6 hidden lg:block fixed right-0 h-full overflow-y-auto no-scrollbar font-sans z-10">
      {/* TRENDING */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={18} className="text-white" />
          <h3 className="font-bold text-zinc-400 tracking-wide text-sm uppercase">
            What's Trending
          </h3>
        </div>

        <div className="space-y-3">
          {trends.map((item, index) => (
            <div
              key={index}
              className="group flex items-center justify-between p-3 rounded-xl hover:bg-zinc-900 cursor-pointer transition-all border border-transparent hover:border-white/10"
            >
              <div>
                <p className="font-bold text-sm text-zinc-300 group-hover:text-white transition-all">
                  {item.tag}
                </p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{item.posts}</p>
              </div>
              <ChevronRight
                size={14}
                className="text-zinc-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1"
              />
            </div>
          ))}
        </div>
      </div>

      {/* EVENTS */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-5">
          <Calendar size={18} className="text-zinc-300" />
          <h3 className="font-bold text-zinc-400 tracking-wide text-sm uppercase">
            Upcoming Events
          </h3>
        </div>
        <div className="space-y-4">
          {/* Using grayscale gradients for a sleek look */}
          <EventCard
            title="Hackathon 2024"
            loc="Main Auditorium"
            date="June 10"
            color="from-zinc-700 to-black"
          />
          <EventCard
            title="Robotics Workshop"
            loc="Lab Complex B"
            date="June 12"
            color="from-zinc-800 to-zinc-900"
          />
        </div>
      </div>

      {/* QUICK LINKS */}
      <div>
        <h3 className="font-bold text-zinc-400 tracking-wide text-sm uppercase mb-5">
          Quick Access
        </h3>
        <a
          href="#"
          className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900 border border-white/5 hover:border-white/20 group transition-all shadow-lg"
        >
          <div className="bg-zinc-800 p-2 rounded-lg text-zinc-400 group-hover:text-white group-hover:bg-black transition-colors">
            <ExternalLink size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">
              Student Portal
            </p>
            <p className="text-[10px] text-zinc-600">
              View grades & attendance
            </p>
          </div>
        </a>
      </div>
    </aside>
  );
};

const EventCard = ({ title, loc, date, color }) => (
  <div className="relative group p-4 rounded-2xl bg-zinc-900/50 border border-white/5 hover:bg-zinc-900 hover:border-white/10 transition-all cursor-pointer overflow-hidden">
    <div
      className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity`}
    ></div>
    <div className="flex items-start gap-4 relative z-10">
      <div
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${color} shadow-lg text-white border border-white/10`}
      >
        <span className="text-[10px] font-medium uppercase opacity-80">
          {date.split(" ")[0]}
        </span>
        <span className="text-lg font-bold leading-none">
          {date.split(" ")[1]}
        </span>
      </div>
      <div>
        <h4 className="font-bold text-zinc-300 text-sm group-hover:text-white transition-colors">
          {title}
        </h4>
        <div className="flex items-center gap-1 mt-1 text-zinc-500 text-xs">
          <Clock size={12} />
          <span>10:00 AM • {loc}</span>
        </div>
      </div>
    </div>
  </div>
);

export default Rightbar;
