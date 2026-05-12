const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 py-6 mt-12">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {currentYear} - Được phát triển và xây dựng bởi{" "}
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              BotDev
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
