import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { memo } from "react";
import {
  Alert,
  Dimensions,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { authService } from "../api/services/auth";

// ✅ TỐI ƯU: Logo Component với memo và expo-image
const Logo = memo(() => {
  return (
    <View>
      <Image
        source={require("../../assets/images/One-Green-no-backg.png")}
        style={styles.logo}
        contentFit="contain"
        transition={200}
        cachePolicy="memory-disk"
      />
    </View>
  );
});

Logo.displayName = 'Logo';

interface MainScreenProps {
  username?: string;
}

const MainScreen: React.FC<MainScreenProps> = ({ username = "Daco" }) => {
  const handleSalesPress = () => {
    router.replace("/(tabs)");
  };

  const handleManagementPress = () => {
    router.push("/manager-webview");
  };

  const handleKOMPress = () => {
    Linking.openURL("https://kom.kas.asia/");
  };

  const handleLogout = async () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?",
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            try {
              await authService.logout();
              router.replace("/login");
            } catch (error: any) {
              console.error("Logout error:", error);
              Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true} // ✅ Performance optimization
      >
        {/* Header với Logo và Logout */}
        <View style={styles.header}>
          <Logo />
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.sparkleIcon}>✨</Text>
          <Text style={styles.goodDayText}>
            Xin chào, <Text style={styles.usernameText}>{username}</Text>
          </Text>
          <Text style={styles.welcomeText}>
            Chúc bạn có trải nghiệm tuyệt vời cùng{" "}
            <Text style={styles.posOneText}>POS ONE</Text>
          </Text>
          <Text style={styles.subWelcomeText}>Hãy chọn ứng dụng của bạn</Text>
        </View>

        {/* Main Actions */}
        <View style={styles.actionsSection}>
          <View style={styles.productGrid}>
            <TouchableOpacity
              style={[styles.productCard, styles.primaryCard]}
              onPress={handleSalesPress}
              activeOpacity={0.8}
            >
              <View style={styles.productIcon}>
                <Image
                  source={require("../../assets/images/favicon_new.png")}
                  style={styles.productIconImage}
                  contentFit="contain"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              </View>
              <Text style={styles.productTitle}>Bán hàng</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.productCard, styles.secondaryCard]}
              onPress={handleManagementPress}
              activeOpacity={0.8}
            >
              <View style={styles.productIcon}>
                <Image
                  source={require("../../assets/images/favicon_new.png")}
                  style={styles.productIconImage}
                  contentFit="contain"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              </View>
              <Text style={styles.productSubTitle}>Quản lý</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.productCard, styles.secondaryCard]}
              onPress={handleKOMPress}
              activeOpacity={0.8}
            >
              <View style={styles.productIcon}>
                <Image
                  source={require("../../assets/images/favicon_new.png")}
                  style={styles.productIconImage}
                  contentFit="contain"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              </View>
              <Text style={styles.productSubTitle}>KOM</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.logoutButtonContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#999" />
            <Text style={styles.logoutButtonText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.companyName}>KAS Technology</Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactText}>Hotline 19002137</Text>
            <View style={styles.socialLinks}>
              <Text style={styles.linkText}>Youtube</Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.linkText}>Facebook</Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.linkText}>Tiktok</Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.linkText}>Website</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isTablet = SCREEN_WIDTH >= 720;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    position: "relative",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
    minHeight: 60,
  },
  logo: {
    width: 200,
    height: 100,
    objectFit: "contain",
  },

  welcomeSection: {
    alignItems: "center",
    // marginBottom: 0,
  },
  sparkleIcon: {
    fontSize: 24,
    marginBottom: 20,
  },
  goodDayText: {
    fontSize: 28,
    color: "#333333",
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "400",
  },
  usernameText: {
    color: "#198754",
    fontWeight: "bold",
  },
  welcomeText: {
    fontSize: 28,
    color: "#333333",
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "600",
  },
  subWelcomeText: {
    fontSize: 16,
    color: "#999999",
    textAlign: "center",
    marginBottom: isTablet ? 20 : 0,
  },
  actionsSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 100,
    paddingHorizontal: 20,
  },
  productGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    gap: 15,
  },
  productCard: {
    flex: 1,
    height: 100,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryCard: {
    backgroundColor: "#5470ff",
  },
  secondaryCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  productIconImage: {
    width: 25,
    height: 25,
    padding: 5,
  },
  productIconText: {
    color: "#1e40af",
    fontSize: 12,
    fontWeight: "bold",
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
    marginTop: 5,
  },
  productSubTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    textAlign: "center",
    marginTop: 5,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    marginTop: 20,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 12,
  },
  contactInfo: {
    alignItems: "center",
  },
  contactText: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
    fontWeight: "500",
  },
  socialLinks: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  linkText: {
    fontSize: 14,
    color: "#5470ff",
    fontWeight: "500",
  },
  separator: {
    fontSize: 14,
    color: "#999999",
    marginHorizontal: 8,
  },
  posOneText: {
    color: "#00cc33",
    fontWeight: "bold",
  },
  logoutButton: {
    position: "absolute",
    top: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
    marginLeft: 6,
  },
  logoutButtonContainer: {
    alignItems: "center",
    paddingVertical: 20,
    marginHorizontal: 10,
    // borderTopWidth: 1,
    // borderTopColor: "#e9ecef",
  },
});

export default MainScreen;
