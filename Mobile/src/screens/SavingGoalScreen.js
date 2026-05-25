import React, { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Modal, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import http from "../services/http";
import { API_ENDPOINTS } from "../constants/api";
import { SUCCESS_ALERT_MESSAGES, SUCCESS_ALERT_TITLE } from "../constants/alertMessages";
import { formatCurrencyInput, formatDate, formatMoney, getApiErrorMessage, parseCurrencyInput, todayIso } from "../utils/format";
import { PickDateField } from "../utils/pickDate";
import { COLORS } from "../constants/colors";
import ShowMoreButton, { useVisibleItems } from "../components/ShowMoreButton";
import ScreenHeader from "../components/ScreenHeader";

function getGoalVisual(goal) {
  const progressPercent = Number(goal?.progressPercent || 0);
  const status = String(goal?.status || "ACTIVE").toUpperCase();
  const isBehindSchedule = Boolean(goal?.isBehindSchedule);

  if (status === "COMPLETED") {
    return { color: COLORS.INCOME, bg: COLORS.INCOME_LIGHT, border: "#abefc6", label: "Hoàn thành" };
  }

  if (status === "CANCELLED") {
    return { color: COLORS.TEXT_SECONDARY, bg: COLORS.BG, border: COLORS.CARD_BORDER, label: "Đã hủy" };
  }

  if (isBehindSchedule) {
    return { color: COLORS.EXPENSE, bg: COLORS.EXPENSE_LIGHT, border: "#fecdca", label: "Chậm tiến độ" };
  }

  if (progressPercent >= 75) {
    return { color: COLORS.INCOME, bg: COLORS.INCOME_LIGHT, border: "#abefc6", label: "Đang thực hiện" };
  }

  if (progressPercent >= 40) {
    return { color: COLORS.WARNING, bg: COLORS.WARNING_LIGHT, border: "#fedf89", label: "Đang thực hiện" };
  }

  return { color: COLORS.INFO, bg: COLORS.INFO_LIGHT, border: "#b2ddff", label: "Đang thực hiện" };
}

function GoalCard({ item, onContribute, onDelete }) {
  const target = Number(item?.targetAmount || 0);
  const current = Number(item?.currentAmount || 0);
  const remaining = Math.max(0, Number(item?.remainingAmount ?? target - current));
  const progress = Math.max(0, Math.min(100, Number(item?.progressPercent || 0)));

  const monthlyTarget = Number(item?.monthlyTarget || 0);
  const monthlyContributed = Number(item?.monthlyContributed || 0);
  const monthlyProgress = Math.max(0, Math.min(100, Number(item?.monthlyProgressPercent || 0)));

  const visual = getGoalVisual(item);
  const isActive = String(item?.status || "ACTIVE").toUpperCase() === "ACTIVE";

  return (
    <View style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <View style={styles.goalHeaderLeft}>
          <Text style={styles.goalName} numberOfLines={1}>{item?.name || "Mục tiêu"}</Text>
          <Text style={styles.goalPeriod}>{formatDate(item?.startDate)} {'>'} {formatDate(item?.targetDate)}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: visual.bg, borderColor: visual.border }]}>
          <Text style={[styles.statusBadgeText, { color: visual.color }]}>{visual.label}</Text>
        </View>
      </View>

      <View style={styles.progressTopRow}>
        <Text style={styles.progressLabel}>Tiến độ tổng</Text>
        <Text style={[styles.progressValue, { color: visual.color }]}>{progress.toFixed(1)}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: visual.color }]} />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Mục tiêu</Text>
          <Text style={styles.statValue}>{formatMoney(target)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Đã có</Text>
          <Text style={[styles.statValue, styles.statValueGood]}>{formatMoney(current)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Còn thiếu</Text>
          <Text style={[styles.statValue, styles.statValueWarn]}>{formatMoney(remaining)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Cần/tháng</Text>
          <Text style={[styles.statValue, styles.statValueInfo]}>{formatMoney(monthlyTarget)}</Text>
        </View>
      </View>

      {isActive ? (
        <View style={styles.monthlyCard}>
          <View style={styles.progressTopRow}>
            <Text style={styles.monthlyLabel}>Tiến độ tháng này</Text>
            <Text style={styles.monthlyValue}>
              {formatMoney(monthlyContributed)} / {formatMoney(monthlyTarget)} ({monthlyProgress.toFixed(0)}%)
            </Text>
          </View>
          <View style={styles.monthlyTrack}>
            <View style={[styles.monthlyFill, { width: `${monthlyProgress}%` }]} />
          </View>
        </View>
      ) : null}

      {isActive ? (
        <View style={styles.goalActions}>
          <Pressable style={styles.contributeButton} onPress={() => onContribute(item)}>
            <Text style={styles.contributeText}>Đóng góp</Text>
          </Pressable>
          <Pressable style={styles.deleteButton} onPress={() => onDelete(item?.id)}>
            <Text style={styles.deleteText}>Xóa</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function CompactGoalTab({ item, onPress }) {
  const progress = Math.max(0, Math.min(100, Number(item?.progressPercent || 0)));
  const visual = getGoalVisual(item);

  return (
    <Pressable style={styles.goalTab} onPress={() => onPress(item)}>
      <View style={[styles.goalAccent, { backgroundColor: visual.color }]} />
      <View style={styles.goalTabMain}>
        <View style={styles.goalTabHeader}>
          <Text style={styles.goalName} numberOfLines={1}>{item?.name || "Mục tiêu"}</Text>
          <Text style={[styles.goalProgressPercent, { color: visual.color }]}>{progress.toFixed(0)}%</Text>
        </View>
        <Text style={styles.goalPeriod} numberOfLines={1}>{formatDate(item?.startDate)} {'>'} {formatDate(item?.targetDate)}</Text>
        <View style={styles.progressTrackCompact}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: visual.color }]} />
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: visual.bg }]}>
        <Text style={[styles.statusBadgeText, { color: visual.color }]}>{visual.label}</Text>
      </View>
    </Pressable>
  );
}

function GoalDetailModal({ goal, visible, onClose, onContribute, onDelete }) {
  if (!goal) return null;

  const target = Number(goal?.targetAmount || 0);
  const current = Number(goal?.currentAmount || 0);
  const remaining = Math.max(0, Number(goal?.remainingAmount ?? target - current));
  const progress = Math.max(0, Math.min(100, Number(goal?.progressPercent || 0)));
  const monthlyTarget = Number(goal?.monthlyTarget || 0);
  const monthlyContributed = Number(goal?.monthlyContributed || 0);
  const monthlyProgress = Math.max(0, Math.min(100, Number(goal?.monthlyProgressPercent || 0)));
  const visual = getGoalVisual(goal);
  const isActive = String(goal?.status || "ACTIVE").toUpperCase() === "ACTIVE";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={styles.goalHeaderLeft}>
              <Text style={styles.detailTitle} numberOfLines={2}>{goal?.name || "Mục tiêu"}</Text>
              <Text style={styles.goalPeriod}>{formatDate(goal?.startDate)} {'>'} {formatDate(goal?.targetDate)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: visual.bg }]}>
              <Text style={[styles.statusBadgeText, { color: visual.color }]}>{visual.label}</Text>
            </View>
          </View>

          <View style={styles.progressTopRow}>
            <Text style={styles.progressLabel}>Tiến độ tổng</Text>
            <Text style={[styles.progressValue, { color: visual.color }]}>{progress.toFixed(1)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: visual.color }]} />
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Mục tiêu</Text>
              <Text style={styles.statValue}>{formatMoney(target)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Đã có</Text>
              <Text style={[styles.statValue, styles.statValueGood]}>{formatMoney(current)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Còn thiếu</Text>
              <Text style={[styles.statValue, styles.statValueWarn]}>{formatMoney(remaining)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Cần/tháng</Text>
              <Text style={[styles.statValue, styles.statValueInfo]}>{formatMoney(monthlyTarget)}</Text>
            </View>
          </View>

          {isActive ? (
            <View style={styles.monthlyCard}>
              <View style={styles.progressTopRow}>
                <Text style={styles.monthlyLabel}>Tiến độ tháng này</Text>
                <Text style={styles.monthlyValue}>
                  {formatMoney(monthlyContributed)} / {formatMoney(monthlyTarget)} ({monthlyProgress.toFixed(0)}%)
                </Text>
              </View>
              <View style={styles.monthlyTrack}>
                <View style={[styles.monthlyFill, { width: `${monthlyProgress}%` }]} />
              </View>
            </View>
          ) : null}

          <View style={styles.detailActions}>
            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Đóng</Text>
            </Pressable>
            {isActive ? (
              <>
                <Pressable style={styles.deleteTextButton} onPress={() => onDelete(goal?.id)}>
                  <Text style={styles.deleteText}>Xóa</Text>
                </Pressable>
                <Pressable style={styles.primaryButton} onPress={() => onContribute(goal)}>
                  <Text style={styles.primaryButtonText}>Đóng góp</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SavingGoalScreen() {
  const [goals, setGoals] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [targetDate, setTargetDate] = useState(todayIso());

  const [detailGoal, setDetailGoal] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [returnGoalAfterContribution, setReturnGoalAfterContribution] = useState(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionNote, setContributionNote] = useState("");
  const [contributionDate, setContributionDate] = useState(todayIso());

  const overview = useMemo(() => {
    const totalTarget = goals.reduce((sum, goal) => sum + Number(goal?.targetAmount || 0), 0);
    const totalCurrent = goals.reduce((sum, goal) => sum + Number(goal?.currentAmount || 0), 0);
    const overallProgress = totalTarget > 0 ? Math.min(100, (totalCurrent / totalTarget) * 100) : 0;

    const activeCount = goals.filter((goal) => String(goal?.status || "ACTIVE").toUpperCase() === "ACTIVE").length;

    return {
      totalTarget,
      totalCurrent,
      overallProgress,
      activeCount
    };
  }, [goals]);

  const {
    visibleItems: visibleGoals,
    canToggle: canExpandGoals,
    expanded: showAllGoals,
    toggle: toggleGoals
  } = useVisibleItems(goals, { initialCount: 3, mode: "toggle" });

  const fetchGoals = useCallback(async () => {
    const response = await http.get(API_ENDPOINTS.GET_SAVING_GOALS);
    setGoals(Array.isArray(response.data) ? response.data : []);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchGoals();
    } catch (error) {
      Alert.alert("Lỗi", getApiErrorMessage(error, "Không tải được mục tiêu tiết kiệm"));
    } finally {
      setRefreshing(false);
    }
  }, [fetchGoals]);

  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, [onRefresh])
  );

  const onCreate = async () => {
    const amount = parseCurrencyInput(targetAmount);

    if (!name.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập Tên mục tiêu.");
      return;
    }

    if (!targetAmount.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập Số tiền mục tiêu.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert("Sai dữ liệu", "Vui lòng nhập số tiền mục tiêu hợp lệ.");
      return;
    }

    if (new Date(targetDate).getTime() < new Date(startDate).getTime()) {
      Alert.alert("Sai ngày", "Ngày đích cần lớn hơn hoặc bằng ngày bắt đầu.");
      return;
    }

    setLoading(true);
    try {
      await http.post(API_ENDPOINTS.ADD_SAVING_GOAL, {
        name: name.trim(),
        targetAmount: amount,
        startDate,
        targetDate
      });

      setName("");
      setTargetAmount("");
      setStartDate(todayIso());
      setTargetDate(todayIso());
      await fetchGoals();
      Alert.alert(SUCCESS_ALERT_TITLE, SUCCESS_ALERT_MESSAGES.create.savingGoal);
    } catch (error) {
      Alert.alert("Thất bại", getApiErrorMessage(error, "Không thể tạo mục tiêu"));
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    if (!id) return;

    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa mục tiêu này không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await http.delete(API_ENDPOINTS.DELETE_SAVING_GOAL(id));
            setDetailGoal(null);
            await fetchGoals();
            Alert.alert(SUCCESS_ALERT_TITLE, SUCCESS_ALERT_MESSAGES.delete.savingGoal);
          } catch (error) {
            Alert.alert("Xóa thất bại", getApiErrorMessage(error, "Không thể xóa mục tiêu"));
          }
        }
      }
    ]);
  };

  const openContributionModal = (goal) => {
    setDetailGoal(null);
    setReturnGoalAfterContribution(goal);
    setSelectedGoal(goal);
    setContributionAmount("");
    setContributionNote("");
    setContributionDate(todayIso());
  };

  const closeContributionModal = () => {
    if (returnGoalAfterContribution) {
      setDetailGoal(returnGoalAfterContribution);
    }
    setReturnGoalAfterContribution(null);
    setSelectedGoal(null);
  };

  const onContribute = async () => {
    if (!selectedGoal?.id) return;

    const amount = parseCurrencyInput(contributionAmount);
    if (!contributionAmount.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập Số tiền.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert("Sai dữ liệu", "Vui lòng nhập số tiền đóng góp hợp lệ.");
      return;
    }

    try {
      await http.post(API_ENDPOINTS.ADD_SAVING_GOAL_CONTRIBUTION(selectedGoal.id), {
        amount,
        contributionDate,
        note: contributionNote.trim()
      });

      setReturnGoalAfterContribution(null);
      closeContributionModal();
      await fetchGoals();
      Alert.alert(SUCCESS_ALERT_TITLE, SUCCESS_ALERT_MESSAGES.contribute.savingGoal);
    } catch (error) {
      Alert.alert("Thất bại", getApiErrorMessage(error, "Không thể đóng góp cho mục tiêu"));
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Mục tiêu tiết kiệm" theme="light" />

      <View style={styles.overviewCard}>
        {/* Top badge */}
        <View style={styles.overviewBadgeRow}>
          <View style={styles.overviewBadge}>
            <Text style={styles.overviewBadgeIcon}>🎯</Text>
            <Text style={styles.overviewTag}>Kế hoạch tích lũy</Text>
          </View>
          <View style={styles.overviewCountBadge}>
            <Text style={styles.overviewCountText}>{overview.activeCount} mục tiêu</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.overviewTitle}>Mục tiêu tiết kiệm</Text>

        {/* Money stats — two column */}
        <View style={styles.overviewMoneyRow}>
          <View style={styles.overviewMoneyCol}>
            <Text style={styles.overviewMoneyLabel}>💰 Đã tích lũy</Text>
            <Text style={styles.overviewMoneyValue}>
              {overview.totalCurrent > 0 ? formatMoney(overview.totalCurrent) : "0 ₫"}
            </Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewMoneyCol}>
            <Text style={styles.overviewMoneyLabel}>🎯 Mục tiêu</Text>
            <Text style={styles.overviewMoneyValueSub}>
              {overview.totalTarget > 0 ? formatMoney(overview.totalTarget) : "0 ₫"}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.overviewProgressRow}>
          <Text style={styles.overviewProgressPercent}>{overview.overallProgress.toFixed(0)}%</Text>
          <Text style={styles.overviewProgressLabel}>hoàn thành</Text>
        </View>
        <View style={styles.overviewTrack}>
          <View style={[styles.overviewFill, { width: `${Math.max(2, overview.overallProgress)}%` }]} />
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Tạo mục tiêu mới</Text>
        <Text style={styles.formSubtitle}>Nhập mục tiêu và thời gian để theo dõi tiến độ tự động.</Text>

        <Text style={styles.label}>Tên mục tiêu</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: Quỹ du lịch"
          placeholderTextColor="#98a2b3"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Số tiền mục tiêu</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: 30.000.000"
          placeholderTextColor="#98a2b3"
          keyboardType="numeric"
          value={targetAmount}
          onChangeText={(value) => setTargetAmount(formatCurrencyInput(value))}
        />

        <View style={styles.dateRow}>
          <View style={[styles.dateCol, styles.dateColLeft]}>
            <PickDateField label="Ngày bắt đầu" value={startDate} onChange={setStartDate} maximumDate={targetDate} />
          </View>
          <View style={styles.dateCol}>
            <PickDateField label="Ngày đích" value={targetDate} onChange={setTargetDate} minimumDate={startDate} />
          </View>
        </View>

        <Pressable style={[styles.saveButton, loading && styles.saveButtonDisabled]} onPress={onCreate} disabled={loading}>
          <Text style={styles.saveButtonText}>{loading ? "Đang lưu..." : "Tạo mục tiêu"}</Text>
        </Pressable>
      </View>

      <FlatList
        data={visibleGoals}
        keyExtractor={(item) => String(item?.id)}
        renderItem={({ item }) => <CompactGoalTab item={item} onPress={setDetailGoal} />}
        contentContainerStyle={[styles.listContent, !goals.length && styles.listContentEmpty]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          goals.length ? (
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Danh sách mục tiêu</Text>
              <ShowMoreButton visible={canExpandGoals} expanded={showAllGoals} onPress={toggleGoals} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>Chưa có mục tiêu tiết kiệm</Text>
            <Text style={styles.emptyText}>Hãy tạo mục tiêu đầu tiên để bắt đầu kế hoạch tích lũy của bạn.</Text>
          </View>
        }
      />

      <GoalDetailModal
        goal={detailGoal}
        visible={Boolean(detailGoal)}
        onClose={() => setDetailGoal(null)}
        onContribute={openContributionModal}
        onDelete={onDelete}
      />

      <Modal visible={Boolean(selectedGoal)} transparent animationType="fade" onRequestClose={closeContributionModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Đóng góp mục tiêu</Text>
            <Text style={styles.modalSubtitle}>{selectedGoal?.name}</Text>

            <Text style={styles.label}>Số tiền</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: 1.000.000"
              placeholderTextColor="#98a2b3"
              keyboardType="numeric"
              value={contributionAmount}
              onChangeText={(value) => setContributionAmount(formatCurrencyInput(value))}
            />

            <PickDateField label="Ngày đóng góp" value={contributionDate} onChange={setContributionDate} />

            <Text style={styles.label}>Ghi chú</Text>
            <TextInput
              style={styles.input}
              placeholder="Tùy chọn"
              placeholderTextColor="#98a2b3"
              value={contributionNote}
              onChangeText={setContributionNote}
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={closeContributionModal}>
                <Text style={styles.secondaryButtonText}>Hủy</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={onContribute}>
                <Text style={styles.primaryButtonText}>Xác nhận</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG, padding: 16, paddingTop: 24 },
  overviewCard: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  // Badge row
  overviewBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  overviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 5,
  },
  overviewBadgeIcon: { fontSize: 13 },
  overviewTag: {
    color: COLORS.WHITE,
    fontWeight: "700",
    fontSize: 12,
  },
  overviewCountBadge: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  overviewCountText: {
    color: COLORS.PEACH,
    fontWeight: "800",
    fontSize: 12,
  },
  // Title
  overviewTitle: {
    color: COLORS.WHITE,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  // Money row
  overviewMoneyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  overviewMoneyCol: {
    flex: 1,
  },
  overviewDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginHorizontal: 12,
  },
  overviewMoneyLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  overviewMoneyValue: {
    color: COLORS.WHITE,
    fontSize: 17,
    fontWeight: "800",
  },
  overviewMoneyValueSub: {
    color: COLORS.PEACH,
    fontSize: 15,
    fontWeight: "700",
  },
  // Progress
  overviewProgressRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
    gap: 4,
  },
  overviewProgressPercent: {
    color: COLORS.WHITE,
    fontSize: 28,
    fontWeight: "800",
  },
  overviewProgressLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
  },
  overviewTrack: {
    height: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  overviewFill: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: COLORS.PEACH,
  },
  formCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 12,
    marginBottom: 12
  },
  formTitle: { fontWeight: "800", color: COLORS.TEXT, marginBottom: 4, fontSize: 18 },
  formSubtitle: { color: COLORS.TEXT_SECONDARY, marginBottom: 10, fontSize: 12 },
  label: { color: COLORS.TEXT, marginBottom: 6, fontWeight: "700" },
  input: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 10,
    color: COLORS.TEXT
  },
  dateRow: { flexDirection: "row" },
  dateCol: { flex: 1 },
  dateColLeft: { marginRight: 8 },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: COLORS.WHITE, fontWeight: "800" },
  listContent: { paddingBottom: 30 },
  listContentEmpty: { flexGrow: 1, justifyContent: "center" },
  listHeader: {
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  listTitle: { color: COLORS.TEXT, fontWeight: "800", fontSize: 16 },
  goalTab: {
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 10,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 74
  },
  goalAccent: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 4,
    marginRight: 10
  },
  goalTabMain: {
    flex: 1,
    paddingRight: 8
  },
  goalTabHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2
  },
  goalProgressPercent: {
    fontWeight: "900",
    fontSize: 13,
    marginLeft: 8
  },
  progressTrackCompact: {
    marginTop: 7,
    height: 5,
    borderRadius: 5,
    backgroundColor: COLORS.CARD_BORDER,
    overflow: "hidden"
  },
  goalCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 12,
    marginBottom: 10
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  goalHeaderLeft: { flex: 1, paddingRight: 10 },
  goalName: { color: COLORS.TEXT, fontWeight: "800", fontSize: 16, marginBottom: 2 },
  goalPeriod: { color: COLORS.TEXT_SECONDARY, fontSize: 12 },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  statusBadgeText: { fontWeight: "700", fontSize: 12 },
  progressTopRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  progressLabel: { color: COLORS.TEXT_SECONDARY, fontSize: 12 },
  progressValue: { fontWeight: "800" },
  progressTrack: {
    marginTop: 6,
    height: 8,
    borderRadius: 8,
    backgroundColor: COLORS.CARD_BORDER,
    overflow: "hidden"
  },
  progressFill: { height: "100%" },
  statsGrid: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  statBox: {
    width: "48%",
    backgroundColor: COLORS.BG,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8
  },
  statLabel: { color: COLORS.TEXT_SECONDARY, fontSize: 11, marginBottom: 2 },
  statValue: { color: COLORS.TEXT, fontWeight: "700", fontSize: 12 },
  statValueGood: { color: COLORS.INCOME },
  statValueWarn: { color: COLORS.EXPENSE },
  statValueInfo: { color: COLORS.INFO },
  monthlyCard: {
    backgroundColor: COLORS.BG,
    borderRadius: 10,
    padding: 10,
    marginTop: 2
  },
  monthlyLabel: { color: COLORS.TEXT_SECONDARY, fontSize: 12 },
  monthlyValue: { color: COLORS.TEXT, fontSize: 11, fontWeight: "700" },
  monthlyTrack: {
    marginTop: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: COLORS.CARD_BORDER,
    overflow: "hidden"
  },
  monthlyFill: { height: "100%", backgroundColor: COLORS.PRIMARY },
  goalActions: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  contributeButton: {
    backgroundColor: COLORS.ROSE_MIST,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999
  },
  contributeText: { color: COLORS.PRIMARY, fontWeight: "800" },
  deleteButton: {
    backgroundColor: COLORS.EXPENSE_LIGHT,
    borderWidth: 1,
    borderColor: "#fecdca",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  deleteTextButton: {
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  deleteText: { color: COLORS.EXPENSE, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingHorizontal: 24 },
  emptyIcon: { fontSize: 34, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: COLORS.TEXT, marginBottom: 6 },
  emptyText: { textAlign: "center", color: COLORS.TEXT_SECONDARY, lineHeight: 19 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.35)",
    justifyContent: "center",
    padding: 16
  },
  modalCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    padding: 16
  },
  detailCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    padding: 16,
    maxHeight: "82%"
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8
  },
  detailTitle: {
    color: COLORS.TEXT,
    fontWeight: "900",
    fontSize: 18,
    marginBottom: 3
  },
  modalTitle: {
    color: COLORS.TEXT,
    fontWeight: "800",
    fontSize: 18
  },
  modalSubtitle: {
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 10,
    marginTop: 2
  },
  modalActions: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "flex-end"
  },
  detailActions: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 8
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 10
  },
  secondaryButtonText: {
    color: "#334155",
    fontWeight: "700"
  },
  primaryButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700"
  }
});
