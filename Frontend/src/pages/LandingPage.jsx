import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, TrendingUp, Shield, BarChart3, Wallet, Target, Sparkles, Star, ArrowRight, Check, ChevronRight, Menu, X } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { usePageTitle } from '../hooks/usePageTitle.js';

const LandingPage = () => {
    const navigate = useNavigate();
    usePageTitle("Trang chủ");
    const { theme } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const scrollTo = (id) => {
        setMobileMenuOpen(false);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    const navLinks = [
        { label: 'Tính Năng', target: 'features' },
        { label: 'Mục Tiêu', target: 'goals' },
        { label: 'Báo Cáo', target: 'experience' },
        { label: 'Bảng Giá', target: 'pricing' },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A0E1A] text-slate-900 dark:text-slate-100 font-['IBM_Plex_Sans'] antialiased scroll-smooth">

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  Floating Navbar                                                    */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <nav className="fixed top-4 left-4 right-4 z-50 max-w-7xl mx-auto
                backdrop-blur-xl bg-white/80 dark:bg-[#0F172A]/80
                border border-slate-200/60 dark:border-white/10
                rounded-2xl shadow-lg dark:shadow-black/20
                px-4 lg:px-6 h-16 flex items-center justify-between">
                
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                        <TrendingUp size={16} className="text-white" />
                    </div>
                    <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                        Money<span className="text-amber-500">Manager</span>
                    </span>
                </div>

                {/* Desktop Nav Links */}
                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map(link => (
                        <button
                            key={link.target}
                            onClick={() => scrollTo(link.target)}
                            className="px-4 py-2 rounded-xl text-sm font-medium
                                text-slate-500 dark:text-slate-400
                                hover:text-slate-900 dark:hover:text-white
                                hover:bg-slate-100 dark:hover:bg-white/5
                                transition-colors duration-200 cursor-pointer"
                        >
                            {link.label}
                        </button>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    
                    <button
                        onClick={() => navigate('/login')}
                        className="hidden sm:inline-flex px-4 py-2 rounded-xl text-sm font-medium
                            text-slate-600 dark:text-slate-300
                            hover:text-slate-900 dark:hover:text-white
                            hover:bg-slate-100 dark:hover:bg-white/5
                            transition-colors duration-200 cursor-pointer"
                    >
                        Đăng Nhập
                    </button>
                    <button
                        onClick={() => navigate('/signup')}
                        className="px-4 py-2 rounded-xl text-sm font-semibold
                            bg-violet-600 hover:bg-violet-500 text-white
                            transition-all duration-150 active:scale-95 cursor-pointer"
                    >
                        Bắt Đầu
                    </button>
                    
                    {/* Mobile menu toggle */}
                    <button
                        className="md:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400
                            hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                    <div className="absolute top-20 left-4 right-4 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-top-2 duration-200">
                        {navLinks.map(link => (
                            <button
                                key={link.target}
                                onClick={() => scrollTo(link.target)}
                                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium
                                    text-slate-600 dark:text-slate-300
                                    hover:bg-slate-100 dark:hover:bg-white/5
                                    transition-colors cursor-pointer"
                            >
                                {link.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  Hero Section                                                        */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section id="hero" className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden scroll-mt-20">
                {/* Background Effects */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-20 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    {/* Left Text */}
                    <div className="lg:w-1/2 text-center lg:text-left">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full
                            bg-amber-500/10 border border-amber-500/20
                            text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-widest">
                            <Sparkles size={14} />
                            Được 150.000+ nhà đầu tư tin dùng
                        </span>
                        <h1 className="text-4xl lg:text-6xl font-extrabold leading-[1.08] mb-6 tracking-tight
                            text-slate-900 dark:text-white">
                            Đầu tư thông minh,{' '}
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-500 to-amber-400">
                                tự tin làm chủ
                            </span>
                        </h1>
                        <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-xl leading-relaxed">
                            Theo dõi thu nhập, chi tiêu, ngân sách và mục tiêu tiết kiệm trong một nền tảng trực quan và an toàn tuyệt đối.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                            <button
                                onClick={() => navigate('/signup')}
                                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm
                                    bg-violet-600 hover:bg-violet-500 text-white
                                    shadow-lg shadow-violet-600/25
                                    transition-all duration-150 active:scale-95 cursor-pointer"
                            >
                                Bắt đầu miễn phí
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm
                                    border border-slate-200 dark:border-white/20
                                    text-slate-700 dark:text-slate-300
                                    hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400
                                    transition-all duration-200 cursor-pointer"
                            >
                                Xem demo
                            </button>
                        </div>
                    </div>

                    {/* Right Dashboard Preview */}
                    <div className="lg:w-1/2 relative">
                        <div className="relative backdrop-blur-xl bg-white/60 dark:bg-white/5
                            border border-slate-200/60 dark:border-white/10
                            rounded-[2rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/30 p-4 lg:p-6">
                            <img
                                alt="Financial Dashboard Preview"
                                className="rounded-3xl w-full object-cover aspect-4/3 opacity-90"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUxTWDZB85sXTl6SXbfWuvp2EUwLCemU-FZvdBrNbssTraz-_Y22L4ezm8SGurAhMgqEGPD-UEF-E0bryNloTPVNSkA8T-aSq9nS-UeQ9t5vcafsDhRU1n9cXK6gaCZAEE0HEip4NNU372iXDsKNeyiG4HOszQ7eU4uQXzYrVq7_l8jvfjBZ_9-yS6X2sowV7OIzqjN26PJoqVJUl4Qpz5IB-DqKmi19hoAXv_t2vr41thRXHHknsaLredFVFulvU4-wuAyQc9t7Gy"
                            />
                            {/* Floating stat card 1 */}
                            <div className="absolute -top-4 -left-6 lg:-left-10 backdrop-blur-xl bg-white/90 dark:bg-[#1E293B]/90
                                border border-slate-200/60 dark:border-white/10 rounded-2xl p-4 lg:p-5 shadow-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <TrendingUp size={20} className="text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">TK tháng này</p>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">+12,5Mđ</p>
                                    </div>
                                </div>
                            </div>
                            {/* Floating stat card 2 */}
                            <div className="absolute -bottom-4 -right-4 lg:-right-8 backdrop-blur-xl bg-white/90 dark:bg-[#1E293B]/90
                                border border-slate-200/60 dark:border-white/10 rounded-2xl p-4 lg:p-5 shadow-xl">
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider mb-3">GD gần đây</p>
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-3 text-xs">
                                        <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">🛒</div>
                                        <span className="font-medium text-slate-700 dark:text-slate-300 flex-1">Dịch vụ chính</span>
                                        <span className="font-semibold text-red-500">-1,2M</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">💰</div>
                                        <span className="font-medium text-slate-700 dark:text-slate-300 flex-1">Nhận Lương</span>
                                        <span className="font-semibold text-emerald-500">+65M</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  Trust Metrics Bar                                                   */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section className="py-12 border-y border-slate-200 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { value: '2,4T VND', label: 'Tài sản quản lý', color: 'text-violet-600 dark:text-violet-400' },
                            { value: '150K+', label: 'Người dùng', color: 'text-amber-600 dark:text-amber-400' },
                            { value: '4.9/5', label: 'Đánh giá', color: 'text-emerald-600 dark:text-emerald-400' },
                            { value: '99.9%', label: 'Uptime', color: 'text-blue-600 dark:text-blue-400' },
                        ].map((stat, i) => (
                            <div key={i}>
                                <p className={`text-3xl lg:text-4xl font-extrabold ${stat.color} mb-1`}>{stat.value}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  Features Section                                                    */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section id="features" className="py-24 scroll-mt-20">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="inline-block px-3 py-1 mb-4 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-bold uppercase tracking-widest">
                            Tính Năng
                        </span>
                        <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
                            Tính năng đột phá
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                            Mọi công cụ bạn cần để làm chủ tài chính cá nhân đều được tích hợp trong một trải nghiệm duy nhất.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: BarChart3, title: 'Theo dõi thu chi', desc: 'Tự động phân loại các khoản chi tiêu từ hóa đơn và lịch sử giao dịch một cách thông minh.' },
                            { icon: Wallet, title: 'Quản lý ngân sách', desc: 'Thiết lập giới hạn chi tiêu cho từng danh mục và nhận cảnh báo khi bạn sắp vượt ngưỡng.' },
                            { icon: Target, title: 'Mục tiêu tiết kiệm', desc: 'Hình ảnh hóa các kế hoạch mua nhà, xe hay du lịch với lộ trình tích lũy cụ thể hàng tháng.' },
                            { icon: BarChart3, title: 'Báo cáo trực quan', desc: 'Biểu đồ xu hướng tài chính giúp bạn hiểu rõ dòng tiền của mình đang đi về đâu.' },
                            { icon: Sparkles, title: 'Phân tích AI', desc: 'Trí tuệ nhân tạo gợi ý cách tối ưu hóa chi phí dựa trên thói quen sinh hoạt của bạn.' },
                            { icon: Shield, title: 'Bảo mật cấp Vault', desc: 'Dữ liệu được mã hóa đầu cuối với tiêu chuẩn ngân hàng, đảm bảo quyền riêng tư tuyệt đối.' },
                        ].map((feature, i) => (
                            <div key={i} className="group backdrop-blur-md bg-white dark:bg-white/5
                                border border-slate-200 dark:border-white/10
                                rounded-2xl p-8
                                hover:border-amber-500/30 dark:hover:border-amber-500/30
                                hover:bg-slate-50 dark:hover:bg-white/[0.07]
                                transition-all duration-200 cursor-pointer">
                                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6
                                    group-hover:bg-violet-500 group-hover:text-white transition-colors duration-200">
                                    <feature.icon size={22} className="text-violet-600 dark:text-violet-400 group-hover:text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  Goals Section                                                       */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section id="goals" className="py-24 bg-slate-50/50 dark:bg-white/2 scroll-mt-20">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="inline-block px-3 py-1 mb-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-widest">
                            Mục Tiêu
                        </span>
                        <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
                            Hiện thực hóa mọi ước mơ
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                            Thiết lập mục tiêu tiết kiệm, theo dõi tiến độ từng ngày và nhận động lực để chạm đích nhanh hơn.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {[
                            { icon: '🏠', title: 'Mua nhà', desc: 'Căn hộ 2 phòng ngủ tại quận trung tâm', pct: 68, current: '1.360.000.000đ', target: '2.000.000.000đ', color: 'bg-violet-500', barColor: 'bg-violet-500' },
                            { icon: '✈️', title: 'Du lịch Châu Âu', desc: 'Tour 3 nước Pháp - Ý - Thụy Sĩ 14 ngày', pct: 42, current: '63.000.000đ', target: '150.000.000đ', color: 'bg-amber-500', barColor: 'bg-amber-500' },
                            { icon: '🚗', title: 'Xe hơi', desc: 'Sedan hạng C tiết kiệm nhiên liệu', pct: 23, current: '184.000.000đ', target: '800.000.000đ', color: 'bg-emerald-500', barColor: 'bg-emerald-500' },
                        ].map((goal, i) => (
                            <div key={i} className="backdrop-blur-md bg-white dark:bg-white/5
                                border border-slate-200 dark:border-white/10
                                rounded-2xl p-8
                                hover:border-amber-500/30 dark:hover:border-amber-500/30
                                transition-all duration-200 cursor-pointer group">
                                <div className={`w-12 h-12 rounded-xl ${goal.color}/10 flex items-center justify-center text-2xl mb-5`}>
                                    {goal.icon}
                                </div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{goal.title}</h3>
                                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${goal.color}/10 ${goal.color.replace('bg-', 'text-')}`}>
                                        {goal.pct}%
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{goal.desc}</p>
                                <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden mb-3">
                                    <div className={`h-full ${goal.barColor} rounded-full transition-all duration-700`} style={{ width: `${goal.pct}%` }} />
                                </div>
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-slate-700 dark:text-slate-300">{goal.current}</span>
                                    <span className="text-slate-400 dark:text-slate-500">/ {goal.target}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center">
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                            Hãy để chúng tôi đồng hành cùng mọi cột mốc tài chính của bạn
                        </p>
                        <button
                            onClick={() => navigate('/signup')}
                            className="px-10 py-4 rounded-xl font-bold text-sm
                                bg-violet-600 hover:bg-violet-500 text-white
                                shadow-lg shadow-violet-600/25
                                transition-all duration-150 active:scale-95 cursor-pointer"
                        >
                            Bắt đầu mục tiêu đầu tiên
                        </button>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  Dashboard Preview / Experience Section                              */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section id="experience" className="py-24 overflow-hidden scroll-mt-20">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
                        <div className="lg:w-2/5">
                            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white mb-8 tracking-tight">
                                Trải nghiệm quyền năng tài chính thực thụ
                            </h2>
                            <ul className="space-y-5">
                                {[
                                    'Giao diện Dashboard tùy chỉnh theo nhu cầu',
                                    'Đồng bộ hóa đa thiết bị theo thời gian thực',
                                    'Xuất dữ liệu báo cáo chuyên sâu chỉ với 1 click',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                            <Check size={12} className="text-emerald-500" />
                                        </div>
                                        <span className="text-slate-600 dark:text-slate-300 font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => navigate('/signup')}
                                className="mt-10 inline-flex items-center gap-2 font-bold text-sm
                                    text-violet-600 dark:text-violet-400
                                    hover:gap-3 transition-all duration-200 cursor-pointer"
                            >
                                Khám phá chi tiết hệ thống <ChevronRight size={16} />
                            </button>
                        </div>
                        <div className="lg:w-3/5">
                            <div className="backdrop-blur-md bg-white dark:bg-white/5
                                border border-slate-200 dark:border-white/10
                                rounded-[2rem] shadow-xl overflow-hidden">
                                <div className="flex h-[400px]">
                                    {/* Mini Sidebar */}
                                    <div className="w-16 bg-slate-900 dark:bg-slate-800 flex flex-col items-center py-6 gap-6">
                                        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                                            <BarChart3 size={14} className="text-white" />
                                        </div>
                                        <div className="w-6 h-6 rounded bg-white/10" />
                                        <div className="w-6 h-6 rounded bg-white/10" />
                                        <div className="w-6 h-6 rounded bg-white/10" />
                                    </div>
                                    {/* Mini Content */}
                                    <div className="flex-1 p-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="font-bold text-slate-900 dark:text-white">Tổng Quan</h4>
                                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Tổng Số Dư</p>
                                                <p className="text-lg font-bold text-slate-900 dark:text-white">248,5Mđ</p>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Chi Tiêu Tuần</p>
                                                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">4,2Mđ</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-100 dark:border-white/5">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">Dòng Tiền</p>
                                                <div className="flex gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                                    <div className="w-3 h-3 rounded-full bg-violet-500" />
                                                </div>
                                            </div>
                                            <div className="flex items-end gap-2 h-24">
                                                {[60, 40, 90, 50, 100, 75, 85].map((h, i) => (
                                                    <div key={i} className="flex-1 bg-violet-500/20 rounded-t-md" style={{ height: `${h}%` }} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  Pricing Section                                                     */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section id="pricing" className="py-24 bg-slate-50/50 dark:bg-white/2 scroll-mt-20">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="inline-block px-3 py-1 mb-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-widest">
                            Bảng Giá
                        </span>
                        <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
                            Gói dịch vụ linh hoạt
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                            Chọn lộ trình tài chính phù hợp với mục tiêu của bạn.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {/* Free */}
                        <div className="backdrop-blur-md bg-white dark:bg-white/5
                            border border-slate-200 dark:border-white/10
                            rounded-2xl p-8 flex flex-col
                            hover:border-amber-500/30 dark:hover:border-amber-500/30
                            transition-all duration-200">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Miễn Phí</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-black text-slate-900 dark:text-white">0đ</span>
                                <span className="text-slate-400 dark:text-slate-500 text-sm">/tháng</span>
                            </div>
                            <ul className="space-y-3 mb-8 flex-1">
                                {['Theo dõi 2 ví cơ bản', 'Báo cáo hàng tháng', 'Phân tích AI chuyên sâu'].map((f, i) => (
                                    <li key={i} className={`flex items-center gap-2.5 text-sm ${i === 2 ? 'text-slate-300 dark:text-slate-600 line-through' : 'text-slate-600 dark:text-slate-400 font-medium'}`}>
                                        {i === 2 ? <X size={14} className="text-slate-300" /> : <Check size={14} className="text-emerald-500" />}
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <button className="w-full py-3 rounded-xl font-bold text-sm
                                border border-slate-200 dark:border-white/10
                                text-slate-700 dark:text-slate-300
                                hover:border-violet-500/50 hover:text-violet-600 dark:hover:text-violet-400
                                transition-all duration-200 cursor-pointer"
                                onClick={() => navigate('/signup')}>
                                Bắt đầu ngay
                            </button>
                        </div>

                        {/* Pro (Highlighted) */}
                        <div className="relative bg-linear-to-br from-violet-600 to-violet-700
                            rounded-2xl p-8 flex flex-col shadow-xl shadow-violet-600/20 scale-[1.03] z-10
                            border border-violet-400/20">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full
                                bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest">
                                Phổ Biến
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1 mt-2">Pro</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-black text-white">99k</span>
                                <span className="text-white/60 text-sm">/tháng</span>
                            </div>
                            <ul className="space-y-3 mb-8 flex-1">
                                {['Không giới hạn ví', 'Đồng bộ ngân hàng tự động', '10 Mục tiêu tiết kiệm Pro', 'Hỗ trợ 24/7 Priority'].map((f, i) => (
                                    <li key={i} className="flex items-center gap-2.5 text-sm text-white/90 font-medium">
                                        <Check size={14} className="text-amber-400" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <button className="w-full py-3 rounded-xl font-bold text-sm
                                bg-amber-500 hover:bg-amber-400 text-white
                                transition-all duration-150 active:scale-95 cursor-pointer"
                                onClick={() => navigate('/signup')}>
                                Nâng cấp Pro
                            </button>
                        </div>

                        {/* Premium */}
                        <div className="backdrop-blur-md bg-white dark:bg-white/5
                            border border-slate-200 dark:border-white/10
                            rounded-2xl p-8 flex flex-col
                            hover:border-amber-500/30 dark:hover:border-amber-500/30
                            transition-all duration-200">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Premium</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-black text-slate-900 dark:text-white">249k</span>
                                <span className="text-slate-400 dark:text-slate-500 text-sm">/tháng</span>
                            </div>
                            <ul className="space-y-3 mb-8 flex-1">
                                {['Toàn bộ tính năng Pro', 'Cố vấn tài chính AI cá nhân', 'Quản lý đầu tư Portfolio'].map((f, i) => (
                                    <li key={i} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                        <Check size={14} className="text-emerald-500" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <button className="w-full py-3 rounded-xl font-bold text-sm
                                border border-slate-200 dark:border-white/10
                                text-slate-700 dark:text-slate-300
                                hover:border-violet-500/50 hover:text-violet-600 dark:hover:text-violet-400
                                transition-all duration-200 cursor-pointer"
                                onClick={() => navigate('/signup')}>
                                Liên hệ tư vấn
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  Testimonials Section                                                */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section id="testimonials" className="py-24 scroll-mt-20">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
                            Người dùng nói về chúng tôi
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { quote: 'Từ ngày dùng app này, mình đã tiết kiệm được thêm 20% thu nhập hàng tháng nhờ việc kiểm soát chi tiêu chặt chẽ hơn.', name: 'Minh Anh', role: 'Freelancer Designer' },
                            { quote: 'Tính năng AI phân tích tài chính rất hay, nó chỉ ra cho mình những khoản chi phí rác mà trước giờ mình không hề để ý.', name: 'Hoàng Long', role: 'Marketing Manager' },
                            { quote: 'Mình đã thử qua nhiều app quản lý tiền nhưng Money Manager là tinh tế nhất. Không quảng cáo, không rườm rà.', name: 'Thanh Thảo', role: 'Content Creator' },
                        ].map((t, i) => (
                            <div key={i} className="backdrop-blur-md bg-white dark:bg-white/5
                                border border-slate-200 dark:border-white/10
                                rounded-2xl p-8 relative
                                hover:border-amber-500/30 dark:hover:border-amber-500/30
                                transition-all duration-200">
                                <div className="flex gap-1 mb-4">
                                    {[...Array(5)].map((_, j) => (
                                        <Star key={j} size={14} className="text-amber-400 fill-amber-400" />
                                    ))}
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6 italic">
                                    "{t.quote}"
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold text-sm">
                                        {t.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  Signup CTA Section                                                  */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section className="py-24 bg-linear-to-br from-slate-900 to-[#0F172A]">
                <div className="max-w-3xl mx-auto px-4 lg:px-8 text-center">
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 tracking-tight">
                        Sẵn sàng làm chủ tài chính?
                    </h2>
                    <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
                        Tham gia cùng 150.000+ người dùng đang kiểm soát tương lai tài chính của họ. Miễn phí mãi mãi.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => navigate('/signup')}
                            className="w-full sm:w-auto px-10 py-4 rounded-xl font-bold text-sm
                                bg-amber-500 hover:bg-amber-400 text-slate-900
                                shadow-lg shadow-amber-500/25
                                transition-all duration-150 active:scale-95 cursor-pointer"
                        >
                            Bắt đầu miễn phí
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full sm:w-auto px-10 py-4 rounded-xl font-bold text-sm
                                border border-white/20 text-white
                                hover:bg-white/10 transition-all duration-200 cursor-pointer"
                        >
                            Đăng nhập
                        </button>
                    </div>
                    <p className="text-white/30 text-xs mt-6">
                        Không cần thẻ tín dụng • Hủy bất kỳ lúc nào
                    </p>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  Footer                                                              */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <footer className="border-t border-slate-200 dark:border-white/5 bg-[#F8FAFC] dark:bg-[#0A0E1A]">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
                                    <TrendingUp size={14} className="text-white" />
                                </div>
                                <span className="text-lg font-bold text-slate-900 dark:text-white">
                                    Money<span className="text-amber-500">Manager</span>
                                </span>
                            </div>
                            <p className="text-sm text-slate-400 dark:text-slate-500 leading-relaxed">
                                Nền tảng quản lý tài chính thế hệ mới, giúp bạn kiến tạo một tương lai thịnh vượng.
                            </p>
                        </div>
                        <div>
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Liên Kết</h5>
                            <ul className="space-y-2.5">
                                {['Về chúng tôi', 'Tính năng', 'Giá dịch vụ', 'Blog tài chính'].map((l, i) => (
                                    <li key={i}>
                                        <button onClick={() => scrollTo(['hero', 'features', 'pricing', 'hero'][i])}
                                            className="text-sm text-slate-400 dark:text-slate-500 hover:text-amber-500 transition-colors cursor-pointer">
                                            {l}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Bảo Mật</h5>
                            <ul className="space-y-2.5">
                                {['Chính Sách Bảo Mật', 'Điều Khoản Dịch Vụ', 'Bảo Mật', 'Cài Đặt Cookies'].map((l, i) => (
                                    <li key={i}>
                                        <button className="text-sm text-slate-400 dark:text-slate-500 hover:text-amber-500 transition-colors cursor-pointer">{l}</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Đăng Ký</h5>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Nhận mẹo tài chính hàng tuần.</p>
                            <div className="flex">
                                <input className="flex-1 rounded-l-xl px-3 py-2.5 text-xs outline-none
                                    bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 border-r-0
                                    text-slate-900 dark:text-white placeholder-slate-400
                                    focus:border-violet-500" placeholder="Email của bạn" type="email" />
                                <button className="px-4 rounded-r-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors cursor-pointer">
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-200 dark:border-white/5 gap-4">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            &copy; {new Date().getFullYear()} MoneyManager - Được phát triển bởi <span className="text-amber-600 dark:text-amber-400">BotDev</span>. All rights reserved.
                        </p>
                        <div className="flex gap-4">
                            {[TrendingUp, Shield, BarChart3].map((Icon, i) => (
                                <button key={i} className="w-8 h-8 rounded-lg flex items-center justify-center
                                    text-slate-400 dark:text-slate-500 hover:text-amber-500 hover:bg-amber-500/10
                                    transition-colors cursor-pointer">
                                    <Icon size={14} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
};

export default LandingPage;
