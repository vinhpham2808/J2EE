import mailReminderIcon from "../../assets/accessories/mail-reminder.png";
import notificationIcon from "../../assets/accessories/notification.png";

export function getMoreMenuGroups(t) {
  return [
    {
      key: "account",
      title: t("more.groups.account"),
      items: [
        { key: "edit-profile", image: require("../../assets/auth/reset-password.png"), title: t("more.items.editProfile"), route: "EditProfile" },
        {
          key: "payment",
          image: require("../../assets/accessories/diamond.png"),
          title: t("more.items.payment"),
          subtitle: t("more.items.paymentSubtitle"),
          actionLabel: t("more.items.buyPlan"),
          variant: "upgrade",
          rowDisabled: true,
          hasChevron: false,
          route: "Payment"
        },
        { key: "payment-history", image: require("../../assets/accessories/monthly-bill.png"), title: t("more.items.paymentHistory"), route: "PaymentHistory" }
      ]
    },
    {
      key: "customization",
      title: t("more.groups.customization"),
      items: [
        // { key: "currency", image: require("../../assets/accessories/exchange.png"), title: t("more.items.currency"), value: "VND", hasChevron: false },
        { key: "language", image: require("../../assets/accessories/linguistics.png"), title: t("more.items.language"), value: "Vietnamese", hasChevron: true }
      ]
    },
    {
      key: "finance",
      title: t("more.groups.finance"),
      items: [
        { key: "jars", image: require("../../assets/accessories/jar-money.png"), title: t("more.items.jars"), route: "HomeTab", params: { screen: "Jars" } },
        { key: "goals", image: require("../../assets/accessories/save-money.png"), title: t("more.items.goals"), route: "HomeTab", params: { screen: "Goal" } },
        { key: "reports", image: require("../../assets/accessories/monthly-bill.png"), title: t("more.items.reports"), route: "HomeTab", params: { screen: "Reports" } }
      ]
    },
    {
      key: "app-info",
      title: t("more.groups.appInfo"),
      items: [
        { key: "help", image: require("../../assets/accessories/help-support.png"), title: t("more.items.help"), hasChevron: true, route: "Help" },
        { key: "privacy", image: require("../../assets/accessories/policy.png"), title: t("more.items.privacy"), hasChevron: true, route: "Privacy" },
        // { key: "about", image: require("../../assets/accessories/about-application.png"), title: t("more.items.about"), value: "1.5", hasChevron: true }
      ]
    },
    {
      key: "notifications",
      title: t("more.groups.notifications"),
      items: [
        { key: "app-notifications", image: notificationIcon, title: t("more.items.appNotifications"), isSwitch: true },
        { key: "email-reminder", image: mailReminderIcon, title: t("more.items.emailReminder"), isSwitch: true }
      ]
    },
    {
      key: "appearance",
      items: [
        { key: "dark-mode", image: require("../../assets/accessories/dark-mode.png"), title: t("more.items.darkMode"), isSwitch: true }
      ]
    }
  ];
}
