import React, { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View, Dimensions } from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, G, Text as SvgText } from "react-native-svg";
import apiClient from "../../services/apiClient";
import { API_ENDPOINTS } from "../../constants/api";
import { COLORS } from "../../constants/colors";
import { getApiErrorMessage, formatDate } from "../../utils/format";
import {
  describeDonutArc,
  formatJarMoney,
  getJarActualPercent,
  getJarProgressWidth,
  JAR_CATEGORY_COLORS
} from "../../utils/jar";
import { CategoryVectorIcon, getIconColor } from "../../utils/categoryIcons";
import { getSafeAreaBottom, getSafeAreaTop } from "../../utils/safeArea";

const screenWidth = Dimensions.get("window").width;

function ExpenseItem({ item, onDelete }) {
  const amount = Number(item?.amount || 0);
  const note = item?.note || "";
  const iconColor = getIconColor(item?.icon);

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemMain}>
        <View style={[styles.iconBubble, { backgroundColor: iconColor + "18" }]}>
          <CategoryVectorIcon iconValue={item?.icon} size={18} color={iconColor} />
        </View>

        <View style={styles.itemContent}>
          <Text style={styles.itemName}>{item?.name || "Chi tiêu"}</Text>
          <Text style={styles.itemMeta}>{formatDate(item?.date)} • {item?.categoryName || "Khác"}</Text>
          {note ? (
            <View style={styles.noteRow}>
              <Text style={styles.noteIcon}>📝</Text>
              <Text style={styles.noteText} numberOfLines={2}>{note}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.itemRight}>
        <Text style={styles.itemAmount}>- {formatJarMoney(amount)}</Text>
        <Pressable onPress={() => onDelete(item?.id)} style={styles.deleteButton}>
          <Text style={styles.deleteText}>Xóa</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function JarDetailView() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id } = route.params;

  const [jars, setJars] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJarsAndExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const [jarsRes, expensesRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.GET_JARS),
        apiClient.get(API_ENDPOINTS.GET_ALL_EXPENSE + "?all=true")
      ]);
      setJars(Array.isArray(jarsRes.data) ? jarsRes.data : []);
      setExpenses(Array.isArray(expensesRes.data) ? expensesRes.data : []);
    } catch (err) {
      console.error("Lỗi tải thông tin hũ:", err);
      Alert.alert("Lỗi", getApiErrorMessage(err, "Không thể tải chi tiết hũ."));
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [jarsRes, expensesRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.GET_JARS),
        apiClient.get(API_ENDPOINTS.GET_ALL_EXPENSE + "?all=true")
      ]);
      setJars(Array.isArray(jarsRes.data) ? jarsRes.data : []);
      setExpenses(Array.isArray(expensesRes.data) ? expensesRes.data : []);
    } catch (err) {
      Alert.alert("Lỗi", getApiErrorMessage(err, "Không thể tải lại dữ liệu."));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchJarsAndExpenses();
    }, [fetchJarsAndExpenses])
  );

  const selectedJar = useMemo(() => jars.find(j => Number(j.id) === Number(id)) || null, [jars, id]);
  const totalBalance = useMemo(() => jars.reduce((sum, j) => sum + (j.currentBalance ?? 0), 0), [jars]);

  const jarExpenses = useMemo(() => {
    return expenses
      .filter(e => e.jarId !== null && Number(e.jarId) === Number(id))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, id]);

  // Group by category for Pie chart
  const chartData = useMemo(() => {
    const categoryMap = {};
    jarExpenses.forEach(e => {
      categoryMap[e.categoryName] = (categoryMap[e.categoryName] || 0) + Number(e.amount);
    });

    const sortedEntries = Object.entries(categoryMap)
      .map(([name, value], index) => ({
        name,
        value,
        color: JAR_CATEGORY_COLORS[index % JAR_CATEGORY_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);

    const sumTotalSpent = sortedEntries.reduce((sum, item) => sum + item.value, 0);

    if (sumTotalSpent === 0) return [];

    let currentAngle = 0;
    return sortedEntries.map((item) => {
      const percent = (item.value / sumTotalSpent) * 100;
      const sweep = (item.value / sumTotalSpent) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sweep;
      currentAngle += sweep;

      return {
        ...item,
        percent,
        startAngle,
        endAngle
      };
    });
  }, [jarExpenses]);

  const handleDeleteJar = () => {
    Alert.alert(
      "Xác nhận xoá hũ",
      "Bạn có chắc muốn xoá hũ này không? Số dư trong hũ sẽ bị mất.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete(API_ENDPOINTS.DELETE_JAR(id));
              Alert.alert("Thành công", "Đã xoá hũ thành công.");
              navigation.goBack();
            } catch (err) {
              Alert.alert("Lỗi", getApiErrorMessage(err, "Không thể xoá hũ."));
            }
          }
        }
      ]
    );
  };

  const handleDeleteExpense = async (expenseId) => {
    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa khoản chi này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(API_ENDPOINTS.DELETE_EXPENSE(expenseId));
            Alert.alert("Thành công", "Đã xóa khoản chi thành công.");
            fetchJarsAndExpenses();
          } catch (err) {
            Alert.alert("Lỗi", getApiErrorMessage(err, "Không thể xóa khoản chi."));
          }
        }
      }
    ]);
  };

  if (!selectedJar) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
      </View>
    );
  }

  const actualPercent = getJarActualPercent(selectedJar.currentBalance, totalBalance);
  const progressWidth = getJarProgressWidth(selectedJar.currentBalance, totalBalance);

  const isNegative = selectedJar.currentBalance < 0;

  // SVG Size Config forSpent Pie
  const outerR = 65;
  const innerR = 42;
  const padding = 15;
  const svgSize = (outerR + padding) * 2;
  const cx = svgSize / 2;
  const cy = svgSize / 2;

  return (
    <View style={[styles.container, { paddingTop: getSafeAreaTop(insets) }]}>
      <FlatList
        data={jarExpenses}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ExpenseItem item={item} onDelete={handleDeleteExpense} />}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: getSafeAreaBottom(insets) }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconTitleRow}>
                  <View style={[styles.iconContainer, { backgroundColor: (selectedJar.color || COLORS.PRIMARY) + "18" }]}>
                    <Text style={styles.iconText}>{selectedJar.icon || "🏺"}</Text>
                  </View>
                  <View>
                    <Text style={styles.cardName}>{selectedJar.name}</Text>
                    <Text style={styles.cardTarget}>Mục tiêu: {selectedJar.targetPercentage ?? 0}%</Text>
                  </View>
                </View>

                {/* Edit & Delete Jar buttons */}
                <View style={styles.jarActions}>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate("JarForm", { initialData: selectedJar, isEditing: true })}
                  >
                    <Text style={styles.actionBtnText}>Sửa</Text>
                  </Pressable>
                  {selectedJar.name !== "Ví tổng" && (
                    <Pressable style={[styles.actionBtn, styles.deleteJarBtn]} onPress={handleDeleteJar}>
                      <Text style={[styles.actionBtnText, styles.deleteJarText]}>Xóa</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
                <Text style={[styles.cardBalance, isNegative && { color: COLORS.EXPENSE }]}>
                  {formatJarMoney(selectedJar.currentBalance)}
                </Text>
              </View>

              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Tỷ trọng thực tế</Text>
                <Text style={[styles.progressValue, { color: selectedJar.color || COLORS.PRIMARY }]}>
                  {actualPercent}%
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progressWidth}%`,
                      backgroundColor: isNegative ? COLORS.EXPENSE : (selectedJar.color || COLORS.PRIMARY),
                    },
                  ]}
                />
              </View>
            </View>

            {/* Spent Pie Chart breakdown */}
            {chartData.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Cấu trúc chi tiêu</Text>
                <View style={styles.chartWrapper}>
                  <Svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
                    <G>
                      {chartData.map((slice, idx) => {
                        const d = describeDonutArc(cx, cy, outerR, innerR, slice.startAngle, slice.endAngle);
                        return (
                          <Path
                            key={idx}
                            d={d}
                            fill={slice.color}
                          />
                        );
                      })}
                      <SvgText
                        x={cx}
                        y={cy - 6}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="600"
                        fill="#8b7b80"
                      >
                        Đã chi
                      </SvgText>
                      <SvgText
                        x={cx}
                        y={cy + 10}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="800"
                        fill={COLORS.EXPENSE}
                      >
                        Ví hũ
                      </SvgText>
                    </G>
                  </Svg>

                  <View style={styles.chartLegend}>
                    {chartData.slice(0, 4).map((slice, idx) => (
                      <View key={idx} style={styles.legendItem}>
                        <View style={[styles.legendColorBox, { backgroundColor: slice.color }]} />
                        <Text style={styles.legendText} numberOfLines={1}>
                          {slice.name} ({slice.percent.toFixed(1)}%)
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Section transactions list */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Text style={styles.listTitle}>Lịch sử chi tiêu</Text>
                <Text style={styles.listSubtitle}>Tổng cộng {jarExpenses.length} giao dịch</Text>
              </View>
              <Pressable
                style={styles.addExpenseShortcut}
                onPress={() => navigation.navigate("AddExpense", { defaultJarId: selectedJar.id })}
              >
                <Text style={styles.addExpenseShortcutText}>+ Thêm chi tiêu</Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🧾</Text>
              <Text style={styles.emptyTitle}>Hũ chưa có chi tiêu</Text>
              <Text style={styles.emptyText}>
                Các khoản chi gắn với hũ này sẽ được thống kê và liệt kê chi tiết ở đây.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.BG,
  },
  loadingText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.CARD_BORDER,
    paddingBottom: 12,
    marginBottom: 12,
  },
  iconTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  iconText: {
    fontSize: 22,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT,
  },
  cardTarget: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  jarActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    backgroundColor: COLORS.BG,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
  },
  deleteJarBtn: {
    backgroundColor: COLORS.EXPENSE_LIGHT,
    borderColor: "#fecdca",
  },
  deleteJarText: {
    color: COLORS.EXPENSE,
  },
  balanceRow: {
    marginBottom: 10,
  },
  balanceLabel: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
  },
  cardBalance: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginTop: 4,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
  },
  progressValue: {
    fontSize: 11,
    fontWeight: "800",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.CARD_BORDER,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 6,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  chartCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 14,
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginBottom: 10,
  },
  chartWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chartLegend: {
    flex: 1,
    marginLeft: 16,
    gap: 6,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColorBox: {
    width: 10,
    height: 10,
    borderRadius: 3,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "600",
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT,
  },
  listSubtitle: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  addExpenseShortcut: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addExpenseShortcutText: {
    color: COLORS.WHITE,
    fontWeight: "800",
    fontSize: 12,
  },
  itemCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  itemMain: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontWeight: "700",
    color: COLORS.TEXT,
    fontSize: 14,
  },
  itemMeta: {
    marginTop: 4,
    color: COLORS.TEXT_SECONDARY,
    fontSize: 11,
  },
  itemRight: {
    alignItems: "flex-end",
  },
  itemAmount: {
    color: COLORS.EXPENSE,
    fontWeight: "800",
    fontSize: 14,
  },
  deleteButton: {
    marginTop: 8,
    backgroundColor: COLORS.EXPENSE_LIGHT,
    borderColor: "#fecdca",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  deleteText: {
    color: COLORS.EXPENSE,
    fontWeight: "700",
    fontSize: 11,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
    gap: 4,
  },
  noteIcon: {
    fontSize: 11,
    marginTop: 1,
  },
  noteText: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    flex: 1,
    lineHeight: 15,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
    textAlign: "center",
  },
});
