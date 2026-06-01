const colorToGradient = {
  "bg-blue-500/10 text-blue-400": "from-blue-500 to-indigo-500",
  "bg-emerald-500/10 text-emerald-400": "from-emerald-500 to-teal-500",
  "bg-red-500/10 text-red-400": "from-red-500 to-rose-500",
  "bg-violet-500/10 text-violet-400": "from-violet-500 to-purple-500",
  "bg-amber-500/10 text-amber-400": "from-amber-500 to-orange-500"
};

const InfoCard = ({ icon, label, value, color, onClick }) => {
  const gradientClass = colorToGradient[color] || "from-violet-500 to-indigo-500";

  return (
    <div
      onClick={onClick}
      className="relative group overflow-hidden flex flex-col gap-4 p-5 rounded-3xl cursor-pointer transition-all duration-300
        bg-white dark:bg-[#0F172A] border border-slate-200/60 dark:border-white/10 shadow-sm
        hover:shadow-xl hover:-translate-y-1 hover:border-slate-300/40 dark:hover:border-white/15"
    >
      {/* Background Hover Gradient Circles */}
      <div className={`absolute -right-8 -top-8 w-28 h-28 rounded-full opacity-10 bg-gradient-to-br ${gradientClass} transition-transform duration-700 ease-out group-hover:scale-[2.5]`} />
      <div className={`absolute -left-8 -bottom-8 w-20 h-20 rounded-full opacity-5 bg-gradient-to-tr ${gradientClass} transition-transform duration-700 ease-out group-hover:scale-[2]`} />

      <div className={`relative z-10 w-11 h-11 flex items-center justify-center rounded-xl ${color} transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-xs`}>
        {icon}
      </div>
      
      <div className="relative z-10">
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-1.5
          text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p className="text-xl font-bold tracking-tight leading-tight break-words
          text-slate-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
};

export default InfoCard;
