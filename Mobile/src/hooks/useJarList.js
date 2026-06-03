import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS } from "../constants/colors";
import { fetchJars } from "../services/jarService";
import { getApiErrorMessage } from "../utils/format";

function getMaxJars(plan) {
  if (plan === "PREMIUM") return Infinity;
  if (plan === "BASIC") return 6;
  return 1;
}

function buildJarSlices(jars) {
  const validJars = jars.filter((jar) => (jar.currentBalance ?? 0) > 0);
  const sumValidBalances = validJars.reduce((sum, jar) => sum + jar.currentBalance, 0);

  if (sumValidBalances === 0) return [];

  let currentAngle = 0;
  return validJars.map((jar) => {
    const percent = (jar.currentBalance / sumValidBalances) * 100;
    const sweep = (jar.currentBalance / sumValidBalances) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sweep;
    currentAngle += sweep;

    return {
      key: String(jar.id),
      name: jar.name,
      color: jar.color || COLORS.PRIMARY,
      percent,
      startAngle,
      endAngle,
      balance: jar.currentBalance
    };
  });
}

export default function useJarList(user) {
  const [jars, setJars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadJars = useCallback(async () => {
    const data = await fetchJars();
    setJars(data);
  }, []);

  const fetchJarList = useCallback(async () => {
    setLoading(true);
    try {
      await loadJars();
    } catch (error) {
      console.error("Lỗi tải hũ:", error);
      Alert.alert("Lỗi", getApiErrorMessage(error, "Không thể tải danh sách hũ chi tiêu."));
    } finally {
      setLoading(false);
    }
  }, [loadJars]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadJars();
    } catch (error) {
      Alert.alert("Lỗi", getApiErrorMessage(error, "Không thể làm mới danh sách."));
    } finally {
      setRefreshing(false);
    }
  }, [loadJars]);

  useFocusEffect(
    useCallback(() => {
      fetchJarList();
    }, [fetchJarList])
  );

  const totalBalance = useMemo(() => jars.reduce((sum, jar) => sum + (jar.currentBalance ?? 0), 0), [jars]);
  const totalPercentage = useMemo(() => jars.reduce((sum, jar) => sum + (jar.targetPercentage ?? 0), 0), [jars]);
  const slices = useMemo(() => buildJarSlices(jars), [jars]);

  const plan = String(user?.subscriptionPlan || "FREE").toUpperCase();
  const maxJars = getMaxJars(plan);
  const canCreate = jars.length < maxJars;

  return {
    canCreate,
    jars,
    loading,
    maxJars,
    onRefresh,
    plan,
    refreshing,
    slices,
    totalBalance,
    totalPercentage
  };
}
