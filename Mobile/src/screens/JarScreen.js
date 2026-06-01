import React, { useCallback, useContext, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View, Dimensions } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, G, Text as SvgText, Defs, LinearGradient, Stop } from "react-native-svg";
import http from "../services/http";
import { API_ENDPOINTS } from "../constants/api";
import { COLORS } from "../constants/colors";
import { AuthContext } from "../components/AuthContext";
import { getApiErrorMessage } from "../utils/format";
import { getSafeAreaBottom, getSafeAreaTop } from "../utils/safeAreaSpacing";

const screenWidth = Dimensions.get("window").width;
const formatMoney = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n ?? 0);

// Helper functions for SVG donut slices
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, outerR, innerR, startAngle, endAngle) {
  const sweep = Math.min(endAngle - startAngle, 359.999);
  const end = startAngle + sweep;
  const largeArc = sweep > 180 ? 1 : 0;

  const oStart = polarToCartesian(cx, cy, outerR, startAngle);
  const oEnd = polarToCartesian(cx, cy, outerR, end);
  const iStart = polarToCartesian(cx, cy, innerR, end);
  const iEnd = polarToCartesian(cx, cy, innerR, startAngle);

  return [
    `M ${oStart.x} ${oStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${oEnd.x} ${oEnd.y}`,
    `L ${iStart.x} ${iStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${iEnd.x} ${iEnd.y}`,
    "Z",
  ].join(" ");
}

function JarCard({ item, totalBalance, onPress }) {
  const { name, icon, color, targetPercentage, currentBalance } = item;

  const actualPercent = totalBalance > 0
    ? ((currentBalance / totalBalance) * 100).toFixed(1)
    : "0.0";

  const progressWidth = Math.min(
    Math.abs(currentBalance) / (totalBalance > 0 ? totalBalance : 1) * 100,
    100
  );

  const isNegative = currentBalance < 0;
  const isMet = parseFloat(actualPercent) >= (targetPercentage ?? 0);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {/* Accent color bar */}
      <View style={[styles.cardAccentBar, { backgroundColor: color || COLORS.PRIMARY }]} />

      <View style={styles.cardHeader}>
        <View style={styles.cardInfoCol}>
          <View style={[styles.iconContainer, { backgroundColor: (color || COLORS.PRIMARY) + "18" }]}>
            <Text style={styles.iconText}>{icon || "🏺"}</Text>
          </View>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardName} numberOfLines={1}>{name}</Text>
            <Text style={styles.cardTarget}>Mục tiêu: {targetPercentage ?? 0}%</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: isMet ? COLORS.INCOME_LIGHT : COLORS.WARNING_LIGHT, borderColor: isMet ? "#abefc6" : "#fedf89" }]}>
          <Text style={[styles.statusBadgeText, { color: isMet ? COLORS.INCOME : COLORS.WARNING }]}>
            {isMet ? "📈 Đạt mục tiêu" : "📉 Dưới mục tiêu"}
          </Text>
        </View>
      </View>

      <Text style={[styles.cardBalance, isNegative && { color: COLORS.EXPENSE }]}>
        {formatMoney(currentBalance)}
      </Text>

      {/* Progress tracking */}
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>Tỷ trọng thực tế</Text>
        <Text style={[styles.progressValue, { color: color || COLORS.PRIMARY }]}>
          {actualPercent}% / {targetPercentage ?? 0}%
        </Text>
      </View>
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${progressWidth}%`,
              backgroundColor: isNegative ? COLORS.EXPENSE : (color || COLORS.PRIMARY),
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

export default function JarScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);

  const [jars, setJars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJars = useCallback(async () => {
    setLoading(true);
    try {
      const res = await http.get(API_ENDPOINTS.GET_JARS);
      setJars(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Lỗi tải hũ:", err);
      Alert.alert("Lỗi", getApiErrorMessage(err, "Không thể tải danh sách hũ chi tiêu."));
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await http.get(API_ENDPOINTS.GET_JARS);
      setJars(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      Alert.alert("Lỗi", getApiErrorMessage(err, "Không thể làm mới danh sách."));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchJars();
    }, [fetchJars])
  );

  const totalBalance = useMemo(() => jars.reduce((sum, j) => sum + (j.currentBalance ?? 0), 0), [jars]);
  const totalPercentage = useMemo(() => jars.reduce((sum, j) => sum + (j.targetPercentage ?? 0), 0), [jars]);

  const plan = String(user?.subscriptionPlan || "FREE").toUpperCase();
  const maxJars = plan === "PREMIUM" ? Infinity : plan === "BASIC" ? 6 : 1;
  const canCreate = jars.length < maxJars;

  const handleCreateJar = () => {
    if (canCreate) {
      navigation.navigate("JarForm");
    } else {
      Alert.alert(
        "Giới hạn gói ví",
        `Gói thành viên hiện tại (${plan}) chỉ hỗ trợ tối đa ${maxJars} hũ chi tiêu. Vui lòng nâng cấp gói để tiếp tục!`,
        [
          { text: "Để sau", style: "cancel" },
          { text: "Nâng cấp ngay", onPress: () => navigation.navigate("Payment") }
        ]
      );
    }
  };

  // Pie chart calculation
  const slices = useMemo(() => {
    const validJars = jars.filter(j => (j.currentBalance ?? 0) > 0);
    const sumValidBalances = validJars.reduce((sum, j) => sum + j.currentBalance, 0);

    if (sumValidBalances === 0) return [];

    let currentAngle = 0;
    return validJars.map((j) => {
      const percent = (j.currentBalance / sumValidBalances) * 100;
      const sweep = (j.currentBalance / sumValidBalances) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sweep;
      currentAngle += sweep;

      return {
        key: String(j.id),
        name: j.name,
        color: j.color || COLORS.PRIMARY,
        percent,
        startAngle,
        endAngle,
        balance: j.currentBalance
      };
    });
  }, [jars]);

  // SVG Size Config
  const outerR = 75;
  const innerR = 50;
  const padding = 15;
  const svgSize = (outerR + padding) * 2;
  const cx = svgSize / 2;
  const cy = svgSize / 2;

  return (
    <View style={[styles.container, { paddingTop: getSafeAreaTop(insets) }]}>
      <FlatList
        data={jars}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <JarCard
            item={item}
            totalBalance={totalBalance}
            onPress={() => navigation.navigate("JarDetail", { id: item.id, name: item.name })}
          />
        )}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: getSafeAreaBottom(insets) }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View>
            {/* Header overview cards */}
            <View style={styles.overviewContainer}>
              <View style={styles.overviewBox}>
                <Text style={styles.overviewLabel}>Tổng số dư hũ</Text>
                <Text style={styles.overviewBalance}>{formatMoney(totalBalance)}</Text>
              </View>

              <View style={styles.overviewRow}>
                <View style={[styles.smallOverviewBox, { marginRight: 8 }]}>
                  <Text style={styles.overviewLabel}>Số hũ đang dùng</Text>
                  <Text style={styles.overviewValue}>
                    {jars.length} / {maxJars === Infinity ? "∞" : maxJars}
                  </Text>
                </View>
                <View style={styles.smallOverviewBox}>
                  <Text style={styles.overviewLabel}>Tổng phân bổ %</Text>
                  <Text style={[styles.overviewValue, totalPercentage > 100 && { color: COLORS.EXPENSE }]}>
                    {totalPercentage.toFixed(1)}%
                  </Text>
                </View>
              </View>

              {totalPercentage > 100 && (
                <View style={styles.warningBanner}>
                  <Text style={styles.warningText}>
                    🚨 Tổng tỉ lệ phân bổ đã vượt quá 100%! Vui lòng điều chỉnh lại tỉ lệ các hũ.
                  </Text>
                </View>
              )}
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsRow}>
              {jars.length >= 2 && (
                <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("JarTransfer")}>
                  <Text style={styles.secondaryButtonText}>⇅ Chuyển tiền</Text>
                </Pressable>
              )}
              <Pressable style={styles.primaryButton} onPress={handleCreateJar}>
                <Text style={styles.primaryButtonText}>+ Tạo hũ mới</Text>
              </Pressable>
            </View>

            {/* Allocation Pie Chart */}
            {slices.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Cơ cấu tài sản thực tế</Text>
                <View style={styles.chartWrapper}>
                  <Svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
                    <G>
                      {slices.map((slice) => {
                        const d = describeArc(cx, cy, outerR, innerR, slice.startAngle, slice.endAngle);
                        return (
                          <Path
                            key={slice.key}
                            d={d}
                            fill={slice.color}
                          />
                        );
                      })}
                      <SvgText
                        x={cx}
                        y={cy - 6}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="600"
                        fill="#8b7b80"
                      >
                        Ví hũ
                      </SvgText>
                      <SvgText
                        x={cx}
                        y={cy + 12}
                        textAnchor="middle"
                        fontSize="14"
                        fontWeight="800"
                        fill={COLORS.PRIMARY}
                      >
                        {jars.length} Hũ
                      </SvgText>
                    </G>
                  </Svg>

                  <View style={styles.chartLegend}>
                    {slices.slice(0, 5).map((slice) => (
                      <View key={slice.key} style={styles.legendItem}>
                        <View style={[styles.legendColorBox, { backgroundColor: slice.color }]} />
                        <Text style={styles.legendText} numberOfLines={1}>
                          {slice.name} ({slice.percent.toFixed(1)}%)
                        </Text>
                      </View>
                    ))}
                    {slices.length > 5 && (
                      <Text style={styles.moreLegendText}>và {slices.length - 5} hũ khác...</Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Danh sách ví phụ</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏺</Text>
              <Text style={styles.emptyTitle}>Chưa có hũ chi tiêu nào</Text>
              <Text style={styles.emptyText}>
                Phân bổ thu nhập của bạn thành các hũ nhỏ (ví dụ: ăn uống, đi lại, tiết kiệm) để quản lý ngân sách thông minh hơn.
              </Text>
              <Pressable style={styles.emptyAction} onPress={handleCreateJar}>
                <Text style={styles.emptyActionText}>+ Tạo hũ đầu tiên</Text>
              </Pressable>
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
  overviewContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 14,
    marginBottom: 12,
    shadowColor: COLORS.TEXT,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  overviewBox: {
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.CARD_BORDER,
    marginBottom: 12,
  },
  overviewLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "700",
  },
  overviewBalance: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.PRIMARY,
    marginTop: 4,
  },
  overviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  smallOverviewBox: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    paddingVertical: 10,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginTop: 4,
  },
  warningBanner: {
    backgroundColor: COLORS.EXPENSE_LIGHT,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecdca",
    padding: 8,
    marginTop: 12,
  },
  warningText: {
    color: COLORS.EXPENSE,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: COLORS.WHITE,
    fontWeight: "800",
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.ROSE_MIST,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: COLORS.PRIMARY,
    fontWeight: "800",
    fontSize: 14,
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
  moreLegendText: {
    fontSize: 10,
    color: COLORS.TEXT_MUTED,
    fontStyle: "italic",
    marginTop: 2,
  },
  listHeader: {
    marginTop: 8,
    marginBottom: 10,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    padding: 14,
    marginBottom: 10,
    position: "relative",
    overflow: "hidden",
  },
  cardAccentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardInfoCol: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  iconText: {
    fontSize: 20,
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.TEXT,
  },
  cardTarget: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  cardBalance: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginTop: 10,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
  },
  progressValue: {
    fontSize: 11,
    fontWeight: "700",
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
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 18,
  },
  emptyAction: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  emptyActionText: {
    color: COLORS.WHITE,
    fontWeight: "800",
    fontSize: 14,
  },
});
