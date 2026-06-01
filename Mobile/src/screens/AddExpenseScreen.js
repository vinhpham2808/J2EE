import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import http from "../services/http";
import { fetchCategoriesByType } from "../services/categoryService";
import { analyzeReceiptFile } from "../services/receiptImportService";
import { API_ENDPOINTS } from "../constants/api";
import { SUCCESS_ALERT_MESSAGES, SUCCESS_ALERT_TITLE } from "../constants/alertMessages";
import { formatCurrencyInput, getApiErrorMessage, parseCurrencyInput, todayIso } from "../utils/format";
import { PickDateField } from "../utils/pickDate";
import { COLORS } from "../constants/colors";
import ExpenseNoteField from "../components/ExpenseNoteField";
import CategoryGridSelector from "../components/CategoryGridSelector";
import { parseNote, suggestCategory } from "../utils/smartNoteParser";
import { AuthContext } from "../components/AuthContext";
import { getSafeAreaContentStyle } from "../utils/safeAreaSpacing";

export default function AddExpenseScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const initialData = route.params?.initialData;

  const isPremium = String(user?.subscriptionPlan || "FREE").toUpperCase() === "PREMIUM";

  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [splitInfo, setSplitInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // States for Spending Jars
  const [jars, setJars] = useState([]);
  const [jarId, setJarId] = useState("");
  const [jarsLoading, setJarsLoading] = useState(true);

  // Fetch Categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoryLoading(true);
      try {
        const data = await fetchCategoriesByType("expense");
        setCategories(data);
        if (data.length > 0) {
          setCategoryId(String(data[0].id));
        }
      } catch (error) {
        Alert.alert("Lỗi", getApiErrorMessage(error, "Không tải được danh mục"));
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch Jars on mount
  useEffect(() => {
    const fetchJars = async () => {
      setJarsLoading(true);
      try {
        const res = await http.get(API_ENDPOINTS.GET_JARS);
        const data = Array.isArray(res.data) ? res.data : [];
        setJars(data);

        if (route.params?.defaultJarId) {
          setJarId(String(route.params.defaultJarId));
        } else if (data.length > 0) {
          const parentWallet = data.find((j) => j.name === "Ví tổng");
          if (parentWallet) {
            setJarId(String(parentWallet.id));
          } else {
            setJarId(String(data[0].id));
          }
        }
      } catch (error) {
        console.error("Lỗi tải danh sách hũ:", error);
      } finally {
        setJarsLoading(false);
      }
    };

    fetchJars();
  }, [route.params?.defaultJarId]);

  // Cập nhật form nếu có initialData mới từ route params (từ AI Agent)
  useEffect(() => {
    if (initialData) {
      if (initialData.name) setName(initialData.name);
      if (initialData.amount) setAmount(formatCurrencyInput(String(initialData.amount)));
      if (initialData.date) setDate(initialData.date);
      if (initialData.note) setNote(initialData.note);

      if (initialData.categoryHint && categories.length > 0) {
        const hint = initialData.categoryHint.toLowerCase();
        const matched = categories.find(
          (c) =>
            c.name.toLowerCase().includes(hint) ||
            hint.includes(c.name.toLowerCase())
        );
        if (matched) setCategoryId(String(matched.id));
      }
    }
  }, [initialData, categories]);

  /** Xử lý kết quả từ voice input — tự động điền form */
  const handleVoiceResult = (voiceText) => {
    if (!voiceText) return;

    const parsed = parseNote(voiceText);

    if (parsed.amount > 0) {
      setAmount(formatCurrencyInput(String(parsed.amount)));
    }

    if (parsed.note) {
      const shortName =
        parsed.note.length > 40
          ? parsed.note.substring(0, 40) + "..."
          : parsed.note;
      setName(shortName);
    }

    if (parsed.splitInfo?.splits?.length > 0) {
      setSplitInfo(parsed.splitInfo);
    } else {
      setSplitInfo(null);
    }

    const suggested = suggestCategory(parsed.note, categories);
    if (suggested) {
      setCategoryId(String(suggested.id));
    }
  };

  // ─── Receipt Import ──────────────────────────────────────────────────────

  /** Điều hướng sang ReceiptPreviewScreen với kết quả phân tích */
  const navigateToPreview = async (fileAsset) => {
    setIsScanning(true);
    try {
      const analyzeResult = await analyzeReceiptFile(fileAsset);
      if (!analyzeResult?.items?.length) {
        Alert.alert(
          "Không nhận diện được",
          "Gemini không tìm thấy khoản chi nào trong tệp. Hãy thử tệp khác hoặc nhập tay."
        );
        return;
      }
      navigation.navigate("ReceiptPreview", { analyzeResult });
    } catch (error) {
      Alert.alert(
        "Lỗi phân tích",
        getApiErrorMessage(error, "Không thể phân tích hóa đơn. Vui lòng thử lại.")
      );
    } finally {
      setIsScanning(false);
    }
  };

  /** Chụp ảnh bằng camera */
  const handlePickCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Quyền bị từ chối", "Cần cấp quyền camera để chụp hóa đơn.");
      return;
    }
    let result;
    try {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        allowsEditing: false,
      });
    } catch (e) {
      Alert.alert("Lỗi", "Không thể mở camera: " + (e.message || ""));
      return;
    }
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (!asset.uri) return;
    await navigateToPreview(asset);
  };

  /** Chọn ảnh từ thư viện */
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Quyền bị từ chối", "Cần cấp quyền thư viện ảnh để chọn hóa đơn.");
      return;
    }
    let result;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        allowsEditing: false,
      });
    } catch (e) {
      Alert.alert("Lỗi", "Không thể mở thư viện ảnh: " + (e.message || ""));
      return;
    }
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];

    const MAX_SIZE = 10 * 1024 * 1024;
    if (asset.fileSize && asset.fileSize > MAX_SIZE) {
      Alert.alert("Ảnh quá lớn", "Vui lòng chọn ảnh dưới 10 MB.");
      return;
    }
    await navigateToPreview(asset);
  };

  /** Chọn file PDF từ bộ nhớ */
  const handlePickPdf = async () => {
    let result;
    try {
      result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
    } catch (e) {
      Alert.alert("Lỗi", "Không thể mở trình chọn file: " + (e.message || ""));
      return;
    }

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];

    const MAX_SIZE = 10 * 1024 * 1024;
    if (asset.size && asset.size > MAX_SIZE) {
      Alert.alert("File quá lớn", "Vui lòng chọn file PDF dưới 10 MB.");
      return;
    }

    await navigateToPreview({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType || "application/pdf",
    });
  };

  /** Hiển thị action sheet chọn nguồn hóa đơn */
  const handleImportReceipt = () => {
    if (!isPremium) {
      Alert.alert(
        "🔒 Tính năng Premium",
        "Nhập hóa đơn bằng ảnh / PDF là tính năng dành riêng cho gói Premium.",
        [
          { text: "Để sau", style: "cancel" },
          { text: "Nâng cấp", onPress: () => navigation.navigate("Payment") },
        ]
      );
      return;
    }

    Alert.alert("📎 Nhập từ hóa đơn", "Chọn nguồn tệp hóa đơn:", [
      { text: "📷 Chụp ảnh", onPress: handlePickCamera },
      { text: "🖼️ Chọn ảnh từ thư viện", onPress: handlePickImage },
      { text: "📄 Chọn file PDF", onPress: handlePickPdf },
      { text: "Hủy", style: "cancel" },
    ]);
  };

  // ─── Save Expense ────────────────────────────────────────────────────────

  const onSave = async () => {
    const normalizedName = name.trim();
    const numericAmount = parseCurrencyInput(amount);

    if (!normalizedName) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập Tên khoản chi.");
      return;
    }

    if (!amount.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập Số tiền.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert("Sai số tiền", "Vui lòng nhập số tiền hợp lệ > 0.");
      return;
    }

    if (!categoryId) {
      Alert.alert("Thiếu danh mục", "Vui lòng chọn danh mục.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: normalizedName,
        amount: numericAmount,
        categoryId: Number(categoryId),
        date,
        icon: "💸",
        jarId: jarId ? Number(jarId) : null,
      };

      const noteTrimmed = note.trim();
      if (noteTrimmed) {
        payload.note = noteTrimmed;
      }

      if (splitInfo?.splits?.length > 0) {
        payload.splitExpense = splitInfo.splits.map((s) => ({
          person: s.person || null,
          amount: s.share,
        }));
      }

      await http.post(API_ENDPOINTS.ADD_EXPENSE, payload);

      Alert.alert(SUCCESS_ALERT_TITLE, SUCCESS_ALERT_MESSAGES.create.expense, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Lưu thất bại", getApiErrorMessage(error, "Không thể tạo khoản chi"));
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, getSafeAreaContentStyle(insets)]}>
      {/* ── Receipt Import Banner ── */}
      <Pressable
        style={[styles.importBanner, isScanning && styles.importBannerScanning]}
        onPress={handleImportReceipt}
        disabled={isScanning}
      >
        {isScanning ? (
          <View style={styles.importBannerInner}>
            <ActivityIndicator color={COLORS.PRIMARY} size="small" />
            <Text style={styles.importBannerText}>Đang phân tích hóa đơn...</Text>
          </View>
        ) : (
          <View style={styles.importBannerInner}>
            <Text style={styles.importBannerIcon}>📎</Text>
            <View style={styles.importBannerBody}>
              <Text style={styles.importBannerTitle}>Nhập từ hóa đơn</Text>
              <Text style={styles.importBannerSub}>
                Chọn ảnh 📷 hoặc PDF 📄
                {!isPremium ? "  •  🔒 Premium" : ""}
              </Text>
            </View>
            <Text style={styles.importBannerChevron}>›</Text>
          </View>
        )}
      </Pressable>

      {/* ── Divider ── */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>hoặc nhập tay</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* ── Form fields ── */}
      <Text style={styles.label}>Tên khoản chi</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Ví dụ: Mua đồ ăn"
        placeholderTextColor={COLORS.TEXT_MUTED}
      />

      <Text style={styles.label}>Số tiền</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={(value) => setAmount(formatCurrencyInput(value))}
        keyboardType="numeric"
        placeholder="Ví dụ: 120.000"
        placeholderTextColor={COLORS.TEXT_MUTED}
      />

      {/* Ghi chú + Voice Input */}
      <ExpenseNoteField
        value={note}
        onChange={setNote}
        onVoiceResult={handleVoiceResult}
      />

      {/* Split expense banner */}
      {splitInfo && splitInfo.splits.length > 0 && (
        <View style={styles.splitBanner}>
          <Text style={styles.splitTitle}>🔀 Phát hiện chia tiền</Text>
          {splitInfo.splits.map((s, idx) => (
            <Text key={idx} style={styles.splitText}>
              {s.label}
            </Text>
          ))}
          {splitInfo.myShareLabel && (
            <Text style={styles.splitMyShare}>{splitInfo.myShareLabel}</Text>
          )}
        </View>
      )}

      <PickDateField label="Ngày" value={date} onChange={setDate} />

      {/* Hũ chi tiêu */}
      <Text style={styles.label}>Hũ chi tiêu liên kết</Text>
      {jarsLoading ? (
        <Text style={styles.mutedText}>Đang tải danh sách hũ...</Text>
      ) : jars.length === 0 ? (
        <Text style={styles.mutedText}>
          Chưa tạo hũ chi tiêu nào. Hãy thiết lập trong Tiện ích khác.
        </Text>
      ) : (
        <View style={styles.jarsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.jarsContainer}
          >
            {jars.map((j) => {
              const isSelected = String(j.id) === jarId;
              return (
                <Pressable
                  key={j.id}
                  onPress={() => setJarId(isSelected ? "" : String(j.id))}
                  style={[
                    styles.jarItem,
                    isSelected && {
                      borderColor: j.color || COLORS.PRIMARY,
                      backgroundColor: (j.color || COLORS.PRIMARY) + "12",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.jarEmojiBox,
                      { backgroundColor: (j.color || COLORS.PRIMARY) + "18" },
                    ]}
                  >
                    <Text style={styles.jarEmoji}>{j.icon || "🏺"}</Text>
                  </View>
                  <Text
                    style={[
                      styles.jarName,
                      isSelected && {
                        color: j.color || COLORS.PRIMARY,
                        fontWeight: "800",
                      },
                    ]}
                  >
                    {j.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <Text style={styles.label}>Danh mục</Text>
      <CategoryGridSelector
        categories={categories}
        selectedId={categoryId}
        onSelect={setCategoryId}
        loading={categoryLoading}
        emptyText="Chưa có danh mục chi tiêu. Hãy tạo danh mục ở tab Danh mục."
      />

      <Pressable
        style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
        onPress={onSave}
        disabled={submitting}
      >
        <Text style={styles.saveButtonText}>
          {submitting ? "Đang lưu..." : "Lưu chi tiêu"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  content: {
    padding: 16,
  },

  // ── Import Banner ──
  importBanner: {
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.PRIMARY + "40",
    borderStyle: "dashed",
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  importBannerScanning: {
    opacity: 0.7,
  },
  importBannerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  importBannerIcon: {
    fontSize: 22,
  },
  importBannerBody: {
    flex: 1,
  },
  importBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.PRIMARY,
  },
  importBannerSub: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
    marginTop: 1,
  },
  importBannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.TEXT_SECONDARY,
    marginLeft: 8,
  },
  importBannerChevron: {
    fontSize: 22,
    color: COLORS.PRIMARY,
    fontWeight: "700",
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.CARD_BORDER,
  },
  dividerText: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
    fontWeight: "600",
  },

  // ── Form ──
  label: {
    color: COLORS.TEXT,
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 12,
    color: COLORS.TEXT,
  },
  mutedText: {
    fontSize: 13,
    color: COLORS.TEXT_MUTED,
    marginBottom: 12,
  },

  // ── Split Banner ──
  splitBanner: {
    backgroundColor: COLORS.INFO_LIGHT,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d0e3f5",
    padding: 12,
    marginBottom: 12,
  },
  splitTitle: {
    fontWeight: "700",
    color: COLORS.INFO,
    fontSize: 14,
    marginBottom: 6,
  },
  splitText: {
    fontSize: 13,
    color: COLORS.TEXT,
    marginBottom: 2,
  },
  splitMyShare: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.PRIMARY,
    marginTop: 4,
  },

  // ── Jars ──
  jarsSection: {
    marginBottom: 12,
  },
  jarsContainer: {
    paddingVertical: 4,
    flexDirection: "row",
    gap: 8,
  },
  jarItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.CARD_BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  jarEmojiBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  jarEmoji: {
    fontSize: 14,
  },
  jarName: {
    fontSize: 13,
    color: COLORS.TEXT,
    fontWeight: "600",
  },

  // ── Save button ──
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontWeight: "700",
    fontSize: 15,
  },
});
