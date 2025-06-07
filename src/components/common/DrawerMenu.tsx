import { authService, UserInfo } from "@/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
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

export default function DrawerMenu({
  visible,
  onClose,
  userInfo,
}: DrawerMenuProps) {
  const translateX = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (visible) {
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: -DRAWER_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleLogout = () => {
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
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Overlay */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Drawer */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
          <TouchableOpacity activeOpacity={1} style={styles.drawerContent}>
            {/* Header */}
            <View
              style={[
                styles.header,
                {
                  paddingTop: insets.top + 20, // Dynamic padding cho tai thỏ
                },
              ]}
            >
              {/* <View style={styles.logoContainer}>
                <Text style={styles.posText}>POS</Text>
                <Text style={styles.oneText}> ONE</Text>
              </View> */}

              {/* Logo */}
              <View style={styles.logoContainer}>
                <Image
                  style={styles.logo}
                  source={require("../../../assets/images/LOGO_POS_2.png")}
                />
              </View>

              <Text style={styles.subtitle}>Phần mềm quản lý kinh doanh</Text>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* User Info */}
              <View style={styles.userSection}>
                <View style={styles.userInfo}>
                  <Ionicons name="person-circle" size={50} color="#198754" />
                  <View style={styles.userDetails}>
                    <Text style={styles.companyName}>
                      {userInfo?.companyName || "Công ty"}
                    </Text>
                    <Text style={styles.userName}>
                      {userInfo?.userFullName ||
                        userInfo?.userName ||
                        "Người dùng"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Menu Items */}
              <View style={styles.menuSection}>
                <TouchableOpacity style={styles.menuItem}>
                  <Ionicons name="home-outline" size={24} color="#666" />
                  <Text style={styles.menuText}>Trang chủ</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                  <Ionicons name="settings-outline" size={24} color="#666" />
                  <Text style={styles.menuText}>Cài đặt</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                  <Ionicons name="help-circle-outline" size={24} color="#666" />
                  <Text style={styles.menuText}>Trợ giúp</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={24} color="#dc3545" />
                  <Text style={[styles.menuText, styles.logoutText]}>
                    Đăng xuất
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Footer */}
            <View
              style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}
            >
              <Text style={styles.footerText}>KAS Technology</Text>
              <Text style={styles.versionText}>Version 1.0.0</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    // flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    // width: 100,
    height: 70,
    objectFit: "contain",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: "100%",
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
    backgroundColor: "#198754",
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  // logoContainer: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   marginBottom: 8,
  // },
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
    color: "#fff",
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
