import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, Text, Animated, ImageBackground } from "react-native";
import { COLORS } from "../../constants/colors";
import loadingscreenImg from "../../assets/loadingscreen.png";

export default function LoadingScreen({ onComplete }) {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    // Thêm listener để cập nhật số phần trăm hiển thị dạng text
    const listenerId = animatedProgress.addListener(({ value }) => {
      setPercent(Math.floor(value));
    });

    // Chạy hiệu ứng thanh tiến trình mượt mà kéo dài 2.2 giây
    Animated.timing(animatedProgress, {
      toValue: 100,
      duration: 2000,
      useNativeDriver: false, // width không được hỗ trợ bởi native driver
    }).start(({ finished }) => {
      if (finished && typeof onComplete === "function") {
        onComplete();
      }
    });

    return () => {
      animatedProgress.removeListener(listenerId);
    };
  }, [onComplete]);

  // Nội suy (interpolate) độ rộng thanh tiến trình
  const progressBarWidth = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <ImageBackground
      source={loadingscreenImg}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {/* Khung chứa thanh tiến trình đặt ở phía dưới màn hình */}
        <View style={styles.progressContainer}>
          <Text style={styles.percentText}>{percent}%</Text>
          <View style={styles.progressBarTrack}>
            <Animated.View style={[styles.progressBarFill, { width: progressBarWidth }]} />
          </View>
          <Text style={styles.statusText}>Đang tải tài nguyên...</Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent", // Hoàn toàn trong suốt để ảnh nền sáng nguyên bản không bị tối
    justifyContent: "flex-end", // Đẩy thanh tiến trình xuống phía dưới của ảnh
    alignItems: "center",
    paddingBottom: 45, // Lùi thanh tiến trình xuống gần sát đáy hơn để tránh đè chữ của hình
  },
  progressContainer: {
    width: "80%",
    maxWidth: 320,
    alignItems: "center",
    gap: 8,
  },
  percentText: {
    color: COLORS.PRIMARY, // Màu Rose Gold thương hiệu rực rỡ
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.4)", // Đổ bóng chữ để hiển thị rõ trên nền sáng
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 3,
  },
  progressBarTrack: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(0, 0, 0, 0.35)", // Nền thanh tiến trình tối nhẹ để nổi bật trên nền ảnh sáng
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(232, 89, 122, 0.3)",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 4,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusText: {
    color: COLORS.DARK_TEXT, // Chữ sáng hiển thị rõ ràng trên nền ảnh
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 3,
  },
});
