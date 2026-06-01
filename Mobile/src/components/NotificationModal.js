import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from "react-native";
import { API_ENDPOINTS } from "../constants/api";
import { COLORS } from "../constants/colors";
import http from "../services/http";
import { scale, clampScale, useDynamicViewport } from "../utils/dimensions";

function formatRelativeTime(value) {
  if (!value) return "";

  const date = new Date(value);
  const time = date.getTime();
  if (!Number.isFinite(time)) return "";

  const diffMs = Date.now() - time;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return "Hôm qua";

  return `${diffDays} ngày trước`;
}

function getTypeMeta(type) {
  switch (type) {
    case "EXPENSE":
    case "BUDGET_EXCEEDED":
    case "SPENDING_ALERT":
      return { icon: "!", color: COLORS.EXPENSE, bg: COLORS.EXPENSE_LIGHT };
    case "INCOME":
    case "GOAL_PROGRESS":
      return { icon: "+", color: COLORS.INCOME, bg: COLORS.INCOME_LIGHT };
    case "BUDGET_ALERT":
    case "BUDGET_WARNING":
      return { icon: "!", color: COLORS.WARNING, bg: COLORS.WARNING_LIGHT };
    case "PAYMENT":
    case "SAVING_STREAK":
      return { icon: "✓", color: COLORS.PRIMARY, bg: COLORS.ROSE_MIST };
    case "MONTHLY_REPORT":
    case "ADMIN":
    case "SYSTEM":
    default:
      return { icon: "i", color: COLORS.INFO, bg: COLORS.INFO_LIGHT };
  }
}

function NotificationItem({ item, onPress }) {
  const meta = getTypeMeta(item?.type);
  const unread = !item?.isRead;

  return (
    <Pressable
      style={[styles.item, unread && styles.itemUnread]}
      onPress={() => onPress(item)}
    >
      <View style={[styles.itemIcon, { backgroundColor: meta.bg }]}>
        <Text style={[styles.itemIconText, { color: meta.color }]}>{meta.icon}</Text>
      </View>

      <View style={styles.itemBody}>
        <View style={styles.itemTitleRow}>
          <Text style={[styles.itemTitle, unread && styles.itemTitleUnread]} numberOfLines={2}>
            {item?.title || "Thông báo"}
          </Text>
          {unread ? <View style={styles.unreadDot} /> : null}
        </View>
        <Text style={styles.itemMessage} numberOfLines={3}>
          {item?.message || ""}
        </Text>
        <Text style={styles.itemTime}>{formatRelativeTime(item?.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

export default function NotificationModal({
  visible,
  onClose,
  onUnreadCountChange
}) {
  const { insets } = useDynamicViewport();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification?.isRead).length,
    [notifications]
  );

  const updateUnreadCount = useCallback((items) => {
    const count = items.filter((notification) => !notification?.isRead).length;
    onUnreadCountChange?.(count);
  }, [onUnreadCountChange]);

  const fetchNotifications = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const response = await http.get(API_ENDPOINTS.GET_NOTIFICATIONS);
      const items = Array.isArray(response.data) ? response.data : [];
      setNotifications(items);
      updateUnreadCount(items);
    } catch {
      setError("Không thể tải thông báo. Vui lòng thử lại.");
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [updateUnreadCount]);

  useEffect(() => {
    if (visible) {
      fetchNotifications();
    }
  }, [fetchNotifications, visible]);

  const markAsRead = useCallback(async (notification) => {
    if (!notification?.id || notification.isRead) return;

    const nextNotifications = notifications.map((item) =>
      item.id === notification.id ? { ...item, isRead: true } : item
    );
    setNotifications(nextNotifications);
    updateUnreadCount(nextNotifications);

    try {
      await http.put(API_ENDPOINTS.MARK_NOTIFICATION_READ(notification.id));
    } catch {
      setNotifications(notifications);
      updateUnreadCount(notifications);
      setError("Không thể cập nhật trạng thái thông báo.");
    }
  }, [notifications, updateUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    if (!unreadCount) return;

    const previousNotifications = notifications;
    const nextNotifications = notifications.map((item) => ({ ...item, isRead: true }));
    setNotifications(nextNotifications);
    updateUnreadCount(nextNotifications);

    try {
      await http.put(API_ENDPOINTS.MARK_ALL_NOTIFICATIONS_READ);
    } catch {
      setNotifications(previousNotifications);
      updateUnreadCount(previousNotifications);
      setError("Không thể đánh dấu tất cả là đã đọc.");
    }
  }, [notifications, unreadCount, updateUnreadCount]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={[styles.overlay, { paddingTop: Math.max(insets.top, scale(20)), paddingBottom: Math.max(insets.bottom, scale(20)) }]}
        accessibilityViewIsModal={true}
        importantForAccessibility="yes"
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Đóng thông báo"
          importantForAccessibility="no"
        />

        <View style={styles.sheet} pointerEvents="auto">
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Thông báo</Text>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Đóng"
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <View style={styles.toolbar}>
            <Text style={styles.countText}>
              {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Bạn đã đọc hết thông báo"}
            </Text>
            {unreadCount > 0 ? (
              <Pressable onPress={markAllAsRead}>
                <Text style={styles.markAllText}>Đọc tất cả</Text>
              </Pressable>
            ) : null}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={COLORS.PRIMARY} />
              <Text style={styles.loadingText}>Đang tải thông báo...</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item, index) => String(item?.id ?? index)}
              renderItem={({ item }) => (
                <NotificationItem item={item} onPress={markAsRead} />
              )}
              contentContainerStyle={[
                styles.listContent,
                notifications.length === 0 && styles.emptyListContent
              ]}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => fetchNotifications({ silent: true })}
                  tintColor={COLORS.PRIMARY}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Text style={styles.emptyIconText}>🔔</Text>
                  </View>
                  <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
                  <Text style={styles.emptyMessage}>
                    Khi có cập nhật mới từ hệ thống, thông báo sẽ xuất hiện tại đây.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(9, 6, 10, 0.62)",
    justifyContent: "center",
    paddingHorizontal: scale(16)
  },
  sheet: {
    maxHeight: "82%",
    borderRadius: scale(24),
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    overflow: "hidden"
  },
  header: {
    paddingHorizontal: scale(20),
    paddingTop: scale(20),
    paddingBottom: scale(14),
    backgroundColor: COLORS.INFO_LIGHT,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  eyebrow: {
    color: COLORS.INFO,
    fontSize: clampScale(12, 10, 14),
    fontWeight: "900",
    textTransform: "uppercase"
  },
  title: {
    marginTop: scale(2),
    color: COLORS.TEXT,
    fontSize: clampScale(22, 18, 26),
    fontWeight: "900"
  },
  closeButton: {
    width: scale(34),
    aspectRatio: 1,
    borderRadius: scale(17),
    backgroundColor: COLORS.CARD,
    alignItems: "center",
    justifyContent: "center"
  },
  closeText: {
    color: COLORS.TEXT,
    fontSize: clampScale(24, 20, 28),
    lineHeight: scale(26),
    fontWeight: "700"
  },
  toolbar: {
    paddingHorizontal: scale(20),
    paddingVertical: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.CARD_BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(12)
  },
  countText: {
    flex: 1,
    color: COLORS.TEXT_SECONDARY,
    fontSize: clampScale(13, 11, 15),
    fontWeight: "600"
  },
  markAllText: {
    color: COLORS.PRIMARY,
    fontSize: clampScale(13, 11, 15),
    fontWeight: "800"
  },
  errorText: {
    marginHorizontal: scale(20),
    marginTop: scale(12),
    padding: scale(10),
    borderRadius: scale(12),
    color: COLORS.EXPENSE,
    backgroundColor: COLORS.EXPENSE_LIGHT,
    fontSize: clampScale(13, 11, 15),
    textAlign: "center",
    fontWeight: "700"
  },
  loadingWrap: {
    paddingVertical: scale(48),
    alignItems: "center",
    justifyContent: "center"
  },
  loadingText: {
    marginTop: scale(10),
    color: COLORS.TEXT_SECONDARY,
    fontSize: clampScale(13, 11, 15),
    fontWeight: "600"
  },
  listContent: {
    paddingVertical: scale(6)
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center"
  },
  item: {
    flexDirection: "row",
    paddingHorizontal: scale(18),
    paddingVertical: scale(14),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BG
  },
  itemUnread: {
    backgroundColor: "rgba(232, 89, 122, 0.06)"
  },
  itemIcon: {
    width: scale(42),
    aspectRatio: 1,
    borderRadius: scale(16),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(12)
  },
  itemIconText: {
    fontSize: clampScale(18, 16, 22),
    fontWeight: "900"
  },
  itemBody: {
    flex: 1
  },
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: scale(8)
  },
  itemTitle: {
    flex: 1,
    color: COLORS.TEXT,
    fontSize: clampScale(14, 12, 16),
    fontWeight: "700",
    lineHeight: scale(19)
  },
  itemTitleUnread: {
    fontWeight: "900"
  },
  unreadDot: {
    width: scale(8),
    aspectRatio: 1,
    borderRadius: scale(4),
    backgroundColor: COLORS.PRIMARY,
    marginTop: scale(5)
  },
  itemMessage: {
    marginTop: scale(5),
    color: COLORS.TEXT_SECONDARY,
    fontSize: clampScale(13, 11, 15),
    lineHeight: scale(18)
  },
  itemTime: {
    marginTop: scale(7),
    color: COLORS.TEXT_MUTED,
    fontSize: clampScale(11, 9, 13),
    fontWeight: "700"
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: scale(28),
    paddingVertical: scale(48)
  },
  emptyIcon: {
    width: scale(56),
    aspectRatio: 1,
    borderRadius: scale(28),
    backgroundColor: COLORS.ROSE_MIST,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scale(14)
  },
  emptyIconText: {
    fontSize: clampScale(24, 20, 28)
  },
  emptyTitle: {
    color: COLORS.TEXT,
    fontSize: clampScale(16, 14, 18),
    fontWeight: "900",
    marginBottom: scale(6)
  },
  emptyMessage: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: clampScale(13, 11, 15),
    lineHeight: scale(19),
    textAlign: "center"
  }
});
