import { authService, UserInfo } from "@/src/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
  userInfo: UserInfo | null;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.8;

// Pre-load logo để tránh loading mỗi lần render
const LOGO_SOURCE = require("../../../assets/images/POS-ONE-LOGO.png");

export default function DrawerMenu({
  visible,
  onClose,
  userInfo,
}: DrawerMenuProps) {
  const translateX = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (visible) {
      // Animate in - song song cả slide và fade
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 250, // Giảm thời gian để mượt hơn
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateX, overlayOpacity]);

  const handleLogout = useCallback(() => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          onClose();
          try {
            await authService.logout();
            router.replace("/login");
          } catch (error) {
            console.error("Error during logout:", error);
            router.replace("/login");
          }
        },
      },
    ]);
  }, [onClose]);

  // Handle menu item press - optimize với useCallback
  const handleMenuItemPress = useCallback(
    (path: string) => {
      onClose();
      router.push(path as any);
    },
    [onClose]
  );

  // Handle home navigation - optimize với useCallback
  const handleHomePress = useCallback(() => {
    onClose();
    router.replace("/(tabs)");
  }, [onClose]);

  // Memoize user info để tránh re-render không cần thiết
  const memoizedUserInfo = useMemo(
    () => ({
      companyName: userInfo?.companyName || "Công ty",
      userName: userInfo?.userFullName || userInfo?.userName || "Người dùng",
    }),
    [userInfo?.companyName, userInfo?.userFullName, userInfo?.userName]
  );

  // Memoize header styles để tránh tính toán lại
  const headerStyle = useMemo(
    () => [styles.header, { paddingTop: insets.top + 20 }],
    [insets.top]
  );

  // Memoize footer styles
  const footerStyle = useMemo(
    () => [styles.footer, { paddingBottom: insets.bottom + 20 }],
    [insets.bottom]
  );

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Animated Overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Drawer */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
          <View style={styles.drawerContent}>
            {/* Header */}
            <View style={headerStyle}>
              {/* Logo */}
              <View style={styles.logoContainer}>
                <Image
                  style={styles.logo}
                  source={LOGO_SOURCE}
                  resizeMode="contain"
                  fadeDuration={0} // Loại bỏ fade effect để load nhanh hơn
                />
              </View>

              <Text style={styles.subtitle}>Phần mềm quản lý kinh doanh</Text>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
              removeClippedSubviews={true} // Optimize performance
              keyboardShouldPersistTaps="handled"
            >
              {/* User Info */}
              <View style={styles.userSection}>
                <View style={styles.userInfo}>
                  <Ionicons name="person-circle" size={50} color="#198754" />
                  <View style={styles.userDetails}>
                    <Text style={styles.companyName}>
                      {memoizedUserInfo.companyName}
                    </Text>
                    <Text style={styles.userName}>
                      {memoizedUserInfo.userName}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Menu Items */}
              <View style={styles.menuSection}>
                <TouchableOpacity
                  onPress={handleHomePress}
                  style={styles.menuItem}
                  activeOpacity={0.7}
                >
                  <Ionicons name="home-outline" size={24} color="#666" />
                  <Text style={styles.menuText}>Trang chủ</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress("/settings")}
                  activeOpacity={0.7}
                >
                  <Ionicons name="settings-outline" size={24} color="#666" />
                  <Text style={styles.menuText}>Cài đặt</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress("/help")}
                  activeOpacity={0.7}
                >
                  <Ionicons name="help-circle-outline" size={24} color="#666" />
                  <Text style={styles.menuText}>Trợ giúp</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleLogout}
                  activeOpacity={0.7}
                >
                  <Ionicons name="log-out-outline" size={24} color="#dc3545" />
                  <Text style={[styles.menuText, styles.logoutText]}>
                    Đăng xuất
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={footerStyle}>
              <Text style={styles.footerText}>KAS Technology</Text>
              <Text style={styles.versionText}>Version 1.0.0</Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    height: 60,
    width: 120, // Thêm width cố định để tránh layout shift
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 16,
  },
  drawerContent: {
    flex: 1,
  },
  header: {
    backgroundColor: "#fff",
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 4,
  },
  posText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1,
  },
  oneText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007bff",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontWeight: "600",
  },
  scrollContent: {
    flex: 1,
  },
  userSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userDetails: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  menuSection: {
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  menuText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
    fontWeight: "500",
  },
  logoutText: {
    color: "#dc3545",
  },
  divider: {
    height: 1,
    backgroundColor: "#e9ecef",
    marginVertical: 10,
    marginHorizontal: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  footerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5470ff",
    marginBottom: 4,
  },
  versionText: {
    fontSize: 12,
    color: "#666",
  },
});
