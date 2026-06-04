import { useCallback, useState } from "react";
import { Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { analyzeReceiptFile } from "../services/receiptImportService";
import { getApiErrorMessage } from "../utils/format";

const EXPENSE_RECEIPT_MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function useExpenseReceiptImport({ isPremium, navigation }) {
  const [isScanning, setIsScanning] = useState(false);

  const navigateToPreview = useCallback(
    async (fileAsset) => {
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

        navigation.navigate("HomeTab", { screen: "ReceiptPreview", params: { analyzeResult } });
      } catch (error) {
        Alert.alert(
          "Lỗi phân tích",
          getApiErrorMessage(error, "Không thể phân tích hóa đơn. Vui lòng thử lại.")
        );
      } finally {
        setIsScanning(false);
      }
    },
    [navigation]
  );

  const pickCamera = useCallback(async () => {
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
        allowsEditing: false
      });
    } catch (error) {
      Alert.alert("Lỗi", `Không thể mở camera: ${error.message || ""}`);
      return;
    }

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (asset.uri) {
      await navigateToPreview(asset);
    }
  }, [navigateToPreview]);

  const pickImage = useCallback(async () => {
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
        allowsEditing: false
      });
    } catch (error) {
      Alert.alert("Lỗi", `Không thể mở thư viện ảnh: ${error.message || ""}`);
      return;
    }

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > EXPENSE_RECEIPT_MAX_FILE_SIZE) {
      Alert.alert("Ảnh quá lớn", "Vui lòng chọn ảnh dưới 10 MB.");
      return;
    }

    await navigateToPreview(asset);
  }, [navigateToPreview]);

  const pickPdf = useCallback(async () => {
    let result;
    try {
      result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true
      });
    } catch (error) {
      Alert.alert("Lỗi", `Không thể mở trình chọn file: ${error.message || ""}`);
      return;
    }

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > EXPENSE_RECEIPT_MAX_FILE_SIZE) {
      Alert.alert("File quá lớn", "Vui lòng chọn file PDF dưới 10 MB.");
      return;
    }

    await navigateToPreview({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType || "application/pdf"
    });
  }, [navigateToPreview]);

  const handleScanReceipt = useCallback(async () => {
    if (!isPremium) {
      Alert.alert(
        "Tính năng Premium",
        "Quét hóa đơn bằng ảnh / PDF là tính năng dành riêng cho gói Premium.\n\nHãy nâng cấp tài khoản để sử dụng.",
        [
          { text: "Để sau", style: "cancel" },
          { text: "Nâng cấp", onPress: () => navigation.navigate("SettingTab", { screen: "Payment" }) }
        ]
      );
      return;
    }

    Alert.alert("Nhập từ hóa đơn", "Chọn nguồn tệp hóa đơn:", [
      { text: "📷", onPress: pickCamera },
      { text: "🖼️", onPress: pickImage },
      { text: "📄", onPress: pickPdf },
      { text: "✕", style: "cancel" }
    ]);
  }, [isPremium, navigation, pickCamera, pickImage, pickPdf]);

  return {
    handleScanReceipt,
    isScanning
  };
}
