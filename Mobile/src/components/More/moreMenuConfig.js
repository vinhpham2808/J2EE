export const MORE_MENU_GROUPS = [
  {
    title: "TÀI KHOẢN",
    items: [
      { key: "edit-profile", icon: "🔒", title: "Đổi mật khẩu", route: "EditProfile" },
      { key: "payment", icon: "💳", title: "Thanh toán & Nâng cấp", route: "Payment" }
    ]
  },
  {
    title: "TÙY CHỈNH",
    items: [
      { key: "currency", icon: "💵", title: "Đơn vị tiền tệ", value: "VND", hasChevron: false },
      { key: "language", icon: "🌐", title: "Ngôn ngữ", value: "Vietnamese", hasChevron: false }
    ]
  },
  {
    title: "QUẢN LÝ TÀI CHÍNH",
    items: [
      { key: "jars", icon: "📦", title: "Hũ chi tiêu phụ", route: "HomeTab", params: { screen: "Jars" } },
      { key: "reports", icon: "📊", title: "Báo cáo thu chi tháng", route: "HomeTab", params: { screen: "Reports" } }
    ]
  },
  {
    title: "THÔNG TIN ỨNG DỤNG",
    items: [
      { key: "help", icon: "❓", title: "Trợ giúp & Hỗ trợ", hasChevron: true },
      { key: "privacy", icon: "🛡️", title: "Chính sách bảo mật", hasChevron: true },
      { key: "version", icon: "ℹ️", title: "Phiên bản", value: "1.0.0", hasChevron: false }
    ]
  }
];
