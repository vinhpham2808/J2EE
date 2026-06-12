import mailReminderIcon from "../../assets/accessories/mail-reminder.png";
import notificationIcon from "../../assets/accessories/notification.png";

export const MORE_MENU_GROUPS = [
  {
    key: "account",
    title: "TÀI KHOẢN",
    items: [
      { key: "edit-profile", image: require("../../assets/auth/reset-password.png"), title: "Đổi mật khẩu", route: "EditProfile" },
      {
        key: "payment",
        image: require("../../assets/accessories/diamond.png"),
        title: "Nâng cấp",
        subtitle: "Mua premium để mở khoá tính năng",
        actionLabel: "Mua gói",
        variant: "upgrade",
        rowDisabled: true,
        hasChevron: false,
        route: "Payment"
      },
      { key: "payment-history", image: require("../../assets/accessories/monthly-bill.png"), title: "Lịch sử thanh toán", route: "PaymentHistory" }
    ]
  },
  {
    key: "customization",
    title: "TÙY CHỈNH",
    items: [
      { key: "currency", image: require("../../assets/accessories/exchange.png"), title: "Đơn vị tiền tệ", value: "VND", hasChevron: false },
      { key: "language", image: require("../../assets/accessories/linguistics.png"), title: "Ngôn ngữ", value: "Vietnamese", hasChevron: true }
    ]
  },
  {
    key: "finance",
    title: "QUẢN LÝ TÀI CHÍNH",
    items: [
      { key: "jars", image: require("../../assets/accessories/jar-money.png"), title: "Hũ chi tiêu phụ", route: "HomeTab", params: { screen: "Jars" } },
      { key: "goals", image: require("../../assets/accessories/save-money.png"), title: "Mục tiêu tiết kiệm", route: "HomeTab", params: { screen: "Goal" } },
      { key: "reports", image: require("../../assets/accessories/monthly-bill.png"), title: "Báo cáo thu chi tháng", route: "HomeTab", params: { screen: "Reports" } }
    ]
  },
  {
    key: "app-info",
    title: "THÔNG TIN ỨNG DỤNG",
    items: [
      { key: "help", image: require("../../assets/accessories/help-support.png"), title: "Trợ giúp & Hỗ trợ", hasChevron: true },
      { key: "privacy", image: require("../../assets/accessories/policy.png"), title: "Chính sách bảo mật", hasChevron: true },
      { key: "about", image: require("../../assets/accessories/about-application.png"), title: "Về ứng dụng", value: "1.5", hasChevron: true }
    ]
  },
  {
    key: "notifications",
    title: "THÔNG BÁO",
    items: [
      { key: "app-notifications", image: notificationIcon, title: "Thông báo ứng dụng", isSwitch: true },
      { key: "email-reminder", image: mailReminderIcon, title: "Nhắc nhở qua Email", isSwitch: true }
    ]
  },
  {
    key: "appearance",
    items: [
      { key: "dark-mode", image: require("../../assets/accessories/dark-mode.png"), title: "Giao diện tối", isSwitch: true }
    ]
  }
];
