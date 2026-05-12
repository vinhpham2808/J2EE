import logo from "./logo/devbot.png";
import {BadgeDollarSign, ChartBar, Coins, FunnelPlus, LayoutDashboard, List, PiggyBank, Target, Wallet, Activity} from "lucide-react";

export const assets = {
    logo,
}

export const SIDE_BAR_DATA = [
    {
        id: "01",
        label: "Tổng quan",
        icon: LayoutDashboard,
        path: "/dashboard",
    },
    {
        id: "02",
        label: "Danh mục",
        icon: List,
        path: "/category",
    },
    {
        id: "03",
        label: "Thu nhập",
        icon: Wallet,
        path: "/income",
    },
    {
        id: "04",
        label: "Chi tiêu",
        icon: Coins,
        path: "/expense",
    },
    {
        id: "05",
        label: "Bộ lọc",
        icon: FunnelPlus,
        path: "/filter",
    },
    {
        id: "06",
        label: "Ngân sách",
        icon: Target,
        path: "/budget",
    },
    {
        id: "07",
        label: "Mục tiêu tiết kiệm",
        icon: PiggyBank,
        path: "/saving-goals",
    },
    {
        id: "08",
        label: "Báo cáo",
        icon: ChartBar,
        path: "/reports",
    },
    {
        id: "09",
        label: "Dự báo",
        icon: Activity,
        path: "/forecast",
    },
    {
        id: "10",
        label: "Thanh toán",
        icon: BadgeDollarSign,
        path: "/payment",
    },
];
