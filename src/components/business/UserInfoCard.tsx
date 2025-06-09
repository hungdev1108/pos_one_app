import { UserInfo } from "@/src/api";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface UserInfoCardProps {
  userInfo: UserInfo | null;
  loading: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function UserInfoCard({ userInfo, loading }: UserInfoCardProps) {
  const insets = useSafeAreaInsets();

  // Dynamic margin cho các màn hình khác nhau - giảm khoảng cách 2 bên
  const horizontalMargin = SCREEN_WIDTH > 400 ? 12 : 8;

  return (
    <View
      style={[
        styles.card,
        {
          marginHorizontal: Math.max(
            horizontalMargin,
            insets.left + 8,
            insets.right + 8
          ),
        },
      ]}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#198754" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Company Info */}
          <View style={styles.infoItem}>
            <Ionicons
              name="storefront"
              size={16}
              color="#198754"
              style={styles.icon}
            />
            <Text style={styles.companyText} numberOfLines={1}>
              {userInfo?.companyName || "Chưa có thông tin"}
            </Text>
          </View>

          {/* Vertical Divider */}
          <View style={styles.verticalDivider} />

          {/* User Info */}
          <View style={styles.infoItem}>
            <Ionicons
              name="person"
              size={16}
              color="#007bff"
              style={styles.icon}
            />
            <Text style={styles.userText} numberOfLines={1}>
              {userInfo?.userFullName ||
                userInfo?.userName ||
                "Chưa có thông tin"}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderBottomRightRadius: 6,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    minHeight: 48, // Giảm chiều cao tối thiểu
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 4,
  },
  icon: {
    marginRight: 8,
  },
  companyText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    flex: 1,
  },
  userText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 12,
  },
});
