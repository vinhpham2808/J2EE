import React, { useCallback, useContext } from "react";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../../contexts/AuthContext";
import JarAllocationChart from "../../components/Jars/JarAllocationChart";
import JarCard from "../../components/Jars/JarCard";
import JarDetailView from "../../components/Jars/JarDetailView";
import JarFormView from "../../components/Jars/JarFormView";
import JarOverview from "../../components/Jars/JarOverview";
import JarTransferView from "../../components/Jars/JarTransferView";
import { COLORS, useAppColors } from "../../constants/colors";
import useJarList from "../../hooks/useJarList";
import { getSafeAreaBottom, getSafeAreaTop } from "../../utils/safeArea";

function JarActions({ colors, jarCount, onCreate, onTransfer }) {
  return (
    <View style={styles.actionsRow}>
      {jarCount >= 2 && (
        <Pressable style={[styles.secondaryButton, { backgroundColor: colors.ROSE_MIST, borderColor: colors.CARD_BORDER }]} onPress={onTransfer}>
          <Text style={[styles.secondaryButtonText, { color: colors.PRIMARY }]}>⇅ Chuyển tiền</Text>
        </Pressable>
      )}
      <Pressable style={styles.primaryButton} onPress={onCreate}>
        <Text style={styles.primaryButtonText}>+ Tạo hũ mới</Text>
      </Pressable>
    </View>
  );
}

function JarEmptyState({ colors, onCreate }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🏺</Text>
      <Text style={[styles.emptyTitle, { color: colors.TEXT }]}>Chưa có hũ chi tiêu nào</Text>
      <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>Phân bổ thu nhập của bạn thành các hũ nhỏ (ví dụ: ăn uống, đi lại, tiết kiệm) để quản lý ngân sách thông minh hơn.</Text>
      <Pressable style={styles.emptyAction} onPress={onCreate}>
        <Text style={styles.emptyActionText}>+ Tạo hũ đầu tiên</Text>
      </Pressable>
    </View>
  );
}

export default function JarScreen() {
  const route = useRoute();

  if (route.name === "JarDetail") return <JarDetailView />;
  if (route.name === "JarForm") return <JarFormView />;
  if (route.name === "JarTransfer") return <JarTransferView />;

  return <JarListRoute />;
}

function JarListRoute() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const { user } = useContext(AuthContext);
  const jarList = useJarList(user);

  const handleCreateJar = useCallback(() => {
    if (jarList.canCreate) {
      navigation.navigate("JarForm");
      return;
    }

    Alert.alert(
      "Giới hạn gói ví",
      `Gói thành viên hiện tại (${jarList.plan}) chỉ hỗ trợ tối đa ${jarList.maxJars} hũ chi tiêu. Vui lòng nâng cấp gói để tiếp tục!`,
      [
        { text: "Để sau", style: "cancel" },
        { text: "Nâng cấp ngay", onPress: () => navigation.navigate("SettingTab", { screen: "Payment" }) }
      ]
    );
  }, [jarList.canCreate, jarList.maxJars, jarList.plan, navigation]);

  const renderHeader = useCallback(
    () => (
      <View>
        <JarOverview
          jarCount={jarList.jars.length}
          maxJars={jarList.maxJars}
          totalBalance={jarList.totalBalance}
          totalPercentage={jarList.totalPercentage}
        />
        <JarActions
          colors={colors}
          jarCount={jarList.jars.length}
          onCreate={handleCreateJar}
          onTransfer={() => navigation.navigate("JarTransfer")}
        />
        <JarAllocationChart jarCount={jarList.jars.length} slices={jarList.slices} />
        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: colors.TEXT }]}>Danh sách ví phụ</Text>
        </View>
      </View>
    ),
    [colors, handleCreateJar, jarList.jars.length, jarList.maxJars, jarList.slices, jarList.totalBalance, jarList.totalPercentage, navigation]
  );

  const renderJar = useCallback(
    ({ item }) => (
      <JarCard
        item={item}
        totalBalance={jarList.totalBalance}
        onPress={() => navigation.navigate("JarDetail", { id: item.id, name: item.name })}
      />
    ),
    [jarList.totalBalance, navigation]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.BG, paddingTop: getSafeAreaTop(insets) }]}> 
      <FlatList
        data={jarList.jars}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderJar}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: getSafeAreaBottom(insets) }]}
        refreshControl={<RefreshControl refreshing={jarList.refreshing} onRefresh={jarList.onRefresh} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!jarList.loading && <JarEmptyState colors={colors} onCreate={handleCreateJar} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  listHeader: {
    marginTop: 8,
    marginBottom: 10
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  primaryButtonText: {
    color: COLORS.WHITE,
    fontWeight: "800",
    fontSize: 14
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.ROSE_MIST,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  secondaryButtonText: {
    color: COLORS.PRIMARY,
    fontWeight: "800",
    fontSize: 14
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.TEXT,
    marginBottom: 6
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 18
  },
  emptyAction: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 11
  },
  emptyActionText: {
    color: COLORS.WHITE,
    fontWeight: "800",
    fontSize: 14
  }
});
