import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Sun, Moon, TrendingUp, Shield, BarChart3, Wallet, Target, Sparkles, 
    Star, ArrowRight, Check, ChevronRight, Menu, X, ArrowUpRight, ShieldCheck, Zap
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { usePageTitle } from '../hooks/usePageTitle.js';
import favicon from '../assets/logo/favicon.png';

const LandingPage = () => {
    const navigate = useNavigate();
    usePageTitle("Trang chủ");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollTo = (id) => {
        setMobileMenuOpen(false);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    const navLinks = [
        { label: 'Tính Năng', target: 'features' },
        { label: 'Mục Tiêu', target: 'goals' },
        { label: 'Bảng Giá', target: 'pricing' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0A0E1A] text-slate-900 dark:text-slate-100 font-['Inter',sans-serif] antialiased scroll-smooth selection:bg-amber-500/30">

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  Floating Navbar                                                    */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <nav className={`fixed top-0 inset-x-0 z-50 transition duration-300 ${scrolled ? 'py-4' : 'py-6'}`}>
                <div className={`max-w-7xl mx-auto px-4 lg:px-6 transition duration-300 ${
                    scrolled 
                    ? 'backdrop-blur-xl bg-white/80 dark:bg-[#0F172A]/80 border border-slate-200/60 dark:border-white/10 rounded-2xl shadow-lg dark:shadow-black/20'
                    : 'bg-transparent border-transparent'
                }`}>
                    <div className="h-16 flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => scrollTo('hero')}>
                            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                                <img src={favicon} alt="Money Manager Logo" className="w-12 h-12 max-w-none object-cover scale-110" />
                            </div>
                            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                                Money<span className="text-amber-500">Manager</span>
                            </span>
                        </div>

                        {/* Desktop Nav Links */}
                        <div className="hidden md:flex items-center gap-2">
                            {navLinks.map(link => (
                                <button
                                    key={link.target}
                                    onClick={() => scrollTo(link.target)}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold
                                        text-slate-500 dark:text-slate-400
                                        hover:text-slate-900 dark:hover:text-white
                                        hover:bg-slate-100 dark:hover:bg-white/5
                                        transition duration-200"
                                >
                                    {link.label}
                                </button>
                            ))}
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            
                            <button
                                onClick={() => navigate('/login')}
                                className="hidden sm:inline-flex px-5 py-2.5 rounded-xl text-sm font-bold
                                    text-slate-700 dark:text-slate-200
                                    hover:text-slate-900 dark:hover:text-white
                                    hover:bg-slate-100 dark:hover:bg-white/10
                                    border border-transparent hover:border-slate-200 dark:hover:border-white/10
                                    transition-all duration-300 hover:shadow-xs active:scale-[0.98]"
                            >
                                Đăng Nhập
                            </button>
                            <button
                                onClick={() => navigate('/signup')}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold
                                    bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 
                                    text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-600/35 hover:-translate-y-0.5
                                    transition-all duration-300 active:scale-[0.98] flex items-center gap-2"
                            >
                                Bắt Đầu <ArrowRight size={16} />
                            </button>
                            
                            {/* Mobile menu toggle */}
                            <button
                                className="md:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400
                                    hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 md:hidden pt-24 px-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                    <div className="relative bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-6 flex flex-col gap-2">
                        {navLinks.map(link => (
                            <button
                                key={link.target}
                                onClick={() => scrollTo(link.target)}
                                className="w-full text-left px-5 py-4 rounded-xl text-base font-semibold
                                    text-slate-700 dark:text-slate-200
                                    hover:bg-slate-50 dark:hover:bg-white/5
                                    transition-colors flex justify-between items-center"
                            >
                                {link.label}
                                <ChevronRight size={18} className="opacity-50" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  Hero Section                                                        */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section id="hero" className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 overflow-hidden scroll-mt-20">
                {/* Background Effects */}
                <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-violet-600/15 rounded-full blur-[150px] mix-blend-multiply dark:mix-blend-screen" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-amber-500/15 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
                    <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
                </div>

                <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                    {/* Left Text */}
                    <div className="lg:w-1/2 text-center lg:text-left relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full
                            bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20
                            text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-widest
                            shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-fade-in-up">
                            <Sparkles size={14} className="animate-pulse" />
                            Nền tảng quản lý tài chính thế hệ mới
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] mb-8 tracking-tight
                            text-slate-900 dark:text-white">
                            Làm chủ tài chính,{' '}
                            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-amber-500">
                                kiến tạo tương lai
                            </span>
                        </h1>
                        <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                            Money Manager giúp bạn theo dõi thu chi, lên ngân sách và đạt mục tiêu tiết kiệm một cách thông minh và hoàn toàn tự động.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5">
                            <button
                                onClick={() => navigate('/signup')}
                                className="w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-base
                                    bg-slate-900 dark:bg-white text-white dark:text-slate-900
                                    shadow-xl shadow-slate-900/10 dark:shadow-white/5
                                    transition-all duration-300 hover:-translate-y-1 hover:shadow-slate-900/20 dark:hover:shadow-white/15 active:scale-[0.98]"
                            >
                                Bắt đầu miễn phí
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-base
                                    bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10
                                    text-slate-700 dark:text-slate-300
                                    hover:bg-slate-50 dark:hover:bg-white/10 hover:border-violet-500/30
                                    transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:shadow-slate-200/20 dark:hover:shadow-black/20 active:scale-[0.98]"
                            >
                                Xem Demo Trực Tiếp
                            </button>
                        </div>
                        
                        <div className="mt-12 flex items-center justify-center lg:justify-start gap-6 text-sm font-semibold text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-500"/> Bảo mật 256-bit</div>
                            <div className="flex items-center gap-2"><Zap size={18} className="text-amber-500"/> Tích hợp AI</div>
                        </div>
                    </div>

                    {/* Right Dashboard Preview */}
                    <div className="lg:w-1/2 relative w-full perspective-1000">
                        <div className="relative z-10 rounded-[2.5rem] border border-white/40 dark:border-white/10 
                            bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl shadow-2xl p-4 lg:p-6
                            transform lg:rotate-y-[-10deg] lg:rotate-x-[5deg] transition-transform duration-700 hover:rotate-0">
                            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-white/60 to-white/10 dark:from-white/5 dark:to-transparent pointer-events-none" />
                            <img
                                alt="Financial Dashboard Preview"
                                className="rounded-[2rem] w-full object-cover shadow-inner"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUxTWDZB85sXTl6SXbfWuvp2EUwLCemU-FZvdBrNbssTraz-_Y22L4ezm8SGurAhMgqEGPD-UEF-E0bryNloTPVNSkA8T-aSq9nS-UeQ9t5vcafsDhRU1n9cXK6gaCZAEE0HEip4NNU372iXDsKNeyiG4HOszQ7eU4uQXzYrVq7_l8jvfjBZ_9-yS6X2sowV7OIzqjN26PJoqVJUl4Qpz5IB-DqKmi19hoAXv_t2vr41thRXHHknsaLredFVFulvU4-wuAyQc9t7Gy"
                            />
                            
                            {/* Floating stat card 1 */}
                            <div className="absolute -top-8 -left-8 lg:-left-12 backdrop-blur-2xl bg-white/95 dark:bg-[#1E293B]/95
                                border border-white dark:border-white/10 rounded-2xl p-5 shadow-2xl animate-bounce-slow">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                        <TrendingUp size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">Thu Nhập Tháng</p>
                                        <p className="text-2xl font-black text-slate-900 dark:text-white">+85.500.000 VND</p>
                                    </div>
                                </div>
                            </div>

                            {/* Floating stat card 2 */}
                            <div className="absolute -bottom-8 -right-4 lg:-right-10 backdrop-blur-2xl bg-white/95 dark:bg-[#1E293B]/95
                                border border-white dark:border-white/10 rounded-2xl p-6 shadow-2xl animate-float">
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-4">Giao dịch nổi bật</p>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-xl">🛒</div>
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-900 dark:text-white">Siêu thị Lotte</p>
                                            <p className="text-xs text-slate-500">Hôm qua</p>
                                        </div>
                                        <span className="font-black text-slate-900 dark:text-white">-1.200.000 VND</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-xl">💼</div>
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-900 dark:text-white">Lương Tháng</p>
                                            <p className="text-xs text-slate-500">25 Thg 5</p>
                                        </div>
                                        <span className="font-black text-emerald-600 dark:text-emerald-400">+45.000.000 VND</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  Features Section                                                    */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section id="features" className="py-24 lg:py-32 scroll-mt-20 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
                    <div className="text-center mb-20">
                        <span className="inline-block px-4 py-2 mb-6 rounded-full bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 text-xs font-bold uppercase tracking-widest">
                            Giải Pháp Toàn Diện
                        </span>
                        <h2 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                            Hệ sinh thái tính năng đột phá
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
                            Mọi công cụ phân tích và tối ưu hóa tài chính bạn cần đều được tích hợp trong một trải nghiệm mượt mà, duy nhất.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { icon: BarChart3, title: 'Theo Dõi Thu Chi', desc: 'Tự động phân loại giao dịch thông minh. Nắm bắt chi tiết dòng tiền ra vào mỗi ngày.', color: 'violet' },
                            { icon: Wallet, title: 'Ngân Sách Thông Minh', desc: 'Kiểm soát chi tiêu vượt định mức. Tự động cảnh báo khi bạn sắp dùng hết ngân sách.', color: 'emerald' },
                            { icon: Target, title: 'Mục Tiêu Tích Lũy', desc: 'Hình ảnh hóa ước mơ mua nhà, mua xe với lộ trình đạt được rõ ràng từng bước một.', color: 'amber' },
                            { icon: BarChart3, title: 'Báo Cáo Trực Quan', desc: 'Đồ thị sinh động, dễ hiểu giúp bạn nhìn nhận xu hướng tiêu dùng theo tuần, tháng, năm.', color: 'blue' },
                            { icon: Sparkles, title: 'Trợ Lý AI Độc Quyền', desc: 'AI phân tích thói quen và đưa ra lời khuyên cá nhân hóa giúp bạn tiết kiệm thông minh hơn.', color: 'fuchsia' },
                            { icon: Shield, title: 'Bảo Mật Cấp Ngân Hàng', desc: 'Dữ liệu được mã hóa chuẩn quốc tế 256-bit, đảm bảo quyền riêng tư tuyệt đối cho bạn.', color: 'slate' },
                        ].map((feature, i) => (
                            <div key={i} className="group relative p-8 rounded-[2rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10
                                hover:shadow-2xl hover:shadow-violet-500/10 hover:-translate-y-2 transition duration-300">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
                                    ${feature.color === 'violet' ? 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400' : ''}
                                    ${feature.color === 'emerald' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : ''}
                                    ${feature.color === 'amber' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : ''}
                                    ${feature.color === 'blue' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : ''}
                                    ${feature.color === 'fuchsia' ? 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-400' : ''}
                                    ${feature.color === 'slate' ? 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300' : ''}
                                `}>
                                    <feature.icon size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  Goals Section                                                       */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section id="goals" className="py-24 lg:py-32 bg-slate-100/50 dark:bg-slate-900/50 scroll-mt-20 border-y border-slate-200 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-end justify-between gap-8 mb-16">
                        <div className="max-w-2xl">
                            <span className="inline-block px-4 py-2 mb-6 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-widest">
                                Đạt Được Mục Tiêu
                            </span>
                            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                                Hiện thực hóa ước mơ của bạn
                            </h2>
                        </div>
                        <button onClick={() => navigate('/dashboard')} className="group flex items-center gap-2 font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300">
                            Khám phá Mục Tiêu <ArrowUpRight size={20} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: '🏠', title: 'Mua nhà', desc: 'Căn hộ 2 phòng ngủ', pct: 68, current: '1.360M', target: '2.000M', color: 'violet' },
                            { icon: '✈️', title: 'Châu Âu', desc: 'Tour 3 nước 14 ngày', pct: 42, current: '63M', target: '150M', color: 'amber' },
                            { icon: '🚗', title: 'Xe hơi', desc: 'Sedan hạng C', pct: 23, current: '184M', target: '800M', color: 'emerald' },
                        ].map((goal, i) => (
                            <div key={i} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 hover:shadow-2xl hover:border-slate-300 dark:hover:border-white/20 transition duration-300">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm
                                        ${goal.color === 'violet' ? 'bg-violet-50 dark:bg-violet-500/10' : ''}
                                        ${goal.color === 'amber' ? 'bg-amber-50 dark:bg-amber-500/10' : ''}
                                        ${goal.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10' : ''}
                                    `}>
                                        {goal.icon}
                                    </div>
                                    <span className={`text-sm font-black px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 
                                        ${goal.color === 'violet' ? 'text-violet-600 dark:text-violet-400' : ''}
                                        ${goal.color === 'amber' ? 'text-amber-600 dark:text-amber-400' : ''}
                                        ${goal.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : ''}
                                    `}>
                                        {goal.pct}%
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{goal.title}</h3>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8">{goal.desc}</p>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm font-bold">
                                        <span className="text-slate-900 dark:text-white">{goal.current}</span>
                                        <span className="text-slate-400 dark:text-slate-500">{goal.target}</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-[width] duration-1000 ease-out
                                            ${goal.color === 'violet' ? 'bg-violet-500' : ''}
                                            ${goal.color === 'amber' ? 'bg-amber-500' : ''}
                                            ${goal.color === 'emerald' ? 'bg-emerald-500' : ''}
                                        `} style={{ width: `${goal.pct}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  Pricing Section                                                     */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section id="pricing" className="py-24 lg:py-32 scroll-mt-20 relative">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                            Bảng giá linh hoạt
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto font-medium">
                            Chọn lộ trình tài chính hoàn hảo dành riêng cho bạn.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
                        
                        {/* Gói Free */}
                        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-[2.5rem] p-8 lg:p-10 shadow-xl transition transform hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                    <Wallet size={24} className="text-slate-600 dark:text-slate-300" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Gói Miễn Phí</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6">Trải nghiệm các tính năng cốt lõi</p>
                            <div className="flex items-baseline gap-2 mb-8 pb-8 border-b border-slate-100 dark:border-slate-700/50">
                                <span className="text-5xl font-black text-slate-900 dark:text-white">0</span>
                                <span className="text-slate-500 font-bold text-xl">VND</span>
                            </div>
                            <ul className="space-y-4 mb-10">
                                {['10 Danh mục & 1 Hũ chi tiêu', 'Tối đa 100 giao dịch/tháng', 'Lịch sử giao dịch 3 tháng', 'Trò chuyện AI (Nova Chat)'].map((f, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-slate-300 font-medium">
                                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check size={12} className="text-slate-400 dark:text-slate-300" strokeWidth={3} />
                                        </div>
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => navigate('/signup')} className="w-full py-4 rounded-2xl font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white transition-all duration-300 active:scale-[0.98]">
                                Dùng Miễn Phí
                            </button>
                        </div>

                        {/* Gói Cơ Bản */}
                        <div className="bg-[#8b5cf6] rounded-[2.5rem] p-8 lg:p-10 shadow-2xl shadow-violet-900/30 transition transform hover:-translate-y-1 scale-105 z-10 relative">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                    <ShieldCheck size={24} className="text-white" />
                                </div>
                                <span className="px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold">Phổ biến</span>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Gói Cơ Bản</h3>
                            <p className="text-white/90 text-sm font-medium mb-6">Theo dõi giao dịch hằng ngày</p>
                            <div className="flex items-baseline gap-2 mb-8 pb-8 border-b border-white/20">
                                <span className="text-5xl font-black text-white">2.000</span>
                                <span className="text-white font-bold text-xl">VND</span>
                            </div>
                            <ul className="space-y-4 mb-10">
                                {['Theo dõi giao dịch hằng ngày', 'Phân tích tài chính cơ bản bằng AI', 'Báo cáo thu chi hàng tháng', 'Nhắc nhở thanh toán định kỳ'].map((f, i) => (
                                    <li key={i} className="flex items-start gap-3 text-white font-medium">
                                        <div className="w-5 h-5 rounded-full border-2 border-white/50 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check size={12} className="text-white" strokeWidth={3} />
                                        </div>
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => navigate('/signup')} className="w-full py-4 rounded-2xl font-bold bg-white text-[#8b5cf6] hover:bg-slate-50 hover:shadow-xl hover:shadow-white/10 transition-all duration-300 active:scale-[0.98]">
                                Bắt Đầu Gói Cơ Bản
                            </button>
                        </div>

                        {/* Gói Premium */}
                        <div className="bg-[#1a202c] rounded-[2.5rem] p-8 lg:p-10 border border-slate-700 hover:border-slate-600 shadow-xl transition transform hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 rounded-xl bg-[#8b5cf6] flex items-center justify-center">
                                    <Sparkles size={24} className="text-white" />
                                </div>
                                <div className="flex gap-2">
                                    <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold">Nâng cao</span>
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Gói Premium</h3>
                            <p className="text-slate-400 text-sm font-medium mb-6">Không giới hạn lịch sử giao dịch</p>
                            <div className="flex items-baseline gap-2 mb-8 pb-8 border-b border-slate-700/50">
                                <span className="text-5xl font-black text-white">299.000</span>
                                <span className="text-white font-bold text-xl">VND</span>
                            </div>
                            <ul className="space-y-4 mb-10">
                                {['Không giới hạn lịch sử giao dịch', 'Phân tích tài chính chuyên sâu bằng AI', 'Import hóa đơn bằng ảnh tự động', 'Xuất báo cáo Excel & PDF', 'Ưu tiên hỗ trợ kỹ thuật'].map((f, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-200 font-medium">
                                        <div className="w-5 h-5 rounded-full border-2 border-emerald-500/50 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check size={12} className="text-emerald-500" strokeWidth={3} />
                                        </div>
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => navigate('/signup')} className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/15 hover:shadow-violet-600/30 border border-violet-500/10 transition-all duration-300 active:scale-[0.98]">
                                Nâng Cấp Premium
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  Signup CTA Section                                                  */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section className="py-24 lg:py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-900 to-[#0F172A] -z-20" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 -z-10" />
                
                <div className="max-w-4xl mx-auto px-4 lg:px-8 text-center relative z-10">
                    <h2 className="text-4xl lg:text-6xl font-black text-white mb-8 tracking-tight">
                        Kiểm soát tiền bạc.<br/>Làm chủ cuộc sống.
                    </h2>
                    <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto font-medium">
                        Tham gia cùng hàng ngàn người dùng đang thay đổi thói quen tài chính mỗi ngày. Bắt đầu hành trình của bạn ngay bây giờ.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button
                            onClick={() => navigate('/signup')}
                            className="w-full sm:w-auto px-12 py-5 rounded-2xl font-black text-lg
                                bg-white text-slate-900 hover:bg-slate-50
                                shadow-2xl shadow-white/10 hover:shadow-white/20 hover:-translate-y-1
                                transition-all duration-300 active:scale-[0.98]"
                        >
                            Đăng Ký Tài Khoản Mới
                        </button>
                    </div>

                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  Footer                                                              */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <footer className="bg-white dark:bg-[#0A0E1A] pt-20 pb-10 border-t border-slate-200 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => scrollTo('hero')}>
                                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                                    <img src={favicon} alt="Money Manager Logo" className="w-12 h-12 max-w-none object-cover scale-110" />
                                </div>
                                <span className="text-xl font-bold text-slate-900 dark:text-white">
                                    Money<span className="text-amber-500">Manager</span>
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm">
                                Nền tảng tài chính thông minh nhất giúp bạn theo dõi chi tiêu, tiết kiệm và đầu tư hiệu quả cho tương lai.
                            </p>
                        </div>
                        <div className="lg:col-span-2">
                            <h5 className="font-bold text-slate-900 dark:text-white mb-6">Sản Phẩm</h5>
                            <ul className="space-y-4">
                                {['Tính năng nổi bật', 'Bảng giá dịch vụ', 'Trải nghiệm AI', 'Báo cáo thông minh'].map((l, i) => (
                                    <li key={i}>
                                        <button className="text-sm text-slate-500 dark:text-slate-400 font-medium hover:text-amber-500 dark:hover:text-amber-400 transition-colors">{l}</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-center items-center pt-8 border-t border-slate-200 dark:border-white/5">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center">
                            &copy; {new Date().getFullYear()} MoneyManager. Thiết kế bởi <span className="font-bold text-slate-900 dark:text-white">BotDev Team</span>.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
