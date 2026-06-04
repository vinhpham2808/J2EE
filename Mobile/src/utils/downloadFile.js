import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

/**
 * Tải file từ presignedUrl và chia sẻ/mở file
 * @param {string} presignedUrl URL an toàn lấy từ AWS Lambda / Backend
 * @param {string} fileName Tên file lưu trên máy (vd: income_report_052026.xlsx)
 */
export const downloadAndShareFile = async (presignedUrl, fileName) => {
  try {
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    // 1. Tải file về thiết bị
    const downloadRes = await FileSystem.downloadAsync(presignedUrl, fileUri);

    if (downloadRes.status !== 200) {
      throw new Error(`Download failed with status ${downloadRes.status}`);
    }

    // 2. Mở cửa sổ hệ thống để user mở file hoặc lưu vào Files
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(downloadRes.uri, {
        dialogTitle: 'Mở hoặc lưu báo cáo',
        mimeType: fileName.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        UTI: fileName.endsWith('.pdf') ? 'com.adobe.pdf' : 'com.microsoft.excel.xls' // Dành cho iOS
      });
    } else {
      Alert.alert('Thành công', 'Đã tải file thành công, nhưng thiết bị không hỗ trợ chia sẻ/mở trực tiếp.');
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    Alert.alert('Lỗi', 'Không thể tải file báo cáo lúc này.');
  }
};
