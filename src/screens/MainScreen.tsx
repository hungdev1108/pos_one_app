import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Logo Component
const Logo = () => {
  return (
    <View>
      <Image
        source={require("../../assets/images/Logo-one-purple_new.png")}
        style={styles.logo}
      />
    </View>
  );
};

interface MainScreenProps {
  username?: string;
}

const MainScreen: React.FC<MainScreenProps> = ({ username = "Daco" }) => {
  const handleSalesPress = () => {
    router.replace("/(tabs)");
  };

  const handleManagementPress = () => {
    Alert.alert("Thông báo", "Tính năng đang được cập nhật...");
  };

  const handleKOMPress = () => {
    Alert.alert("Thông báo", "Tính năng đang được cập nhật...");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header với Logo */}
        <View style={styles.header}>
          <Logo />
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.sparkleIcon}>✨</Text>
          <Text style={styles.goodDayText}>
            Good Day, <Text style={styles.usernameText}>{username}</Text>
          </Text>
          <Text style={styles.welcomeText}>Welcome to PosOne mobile</Text>
          <Text style={styles.subWelcomeText}>Please select your product</Text>
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
                <Text style={styles.productIconText}>POS</Text>
              </View>
              <Text style={styles.productTitle}>Bán hàng</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.productCard, styles.secondaryCard]}
              onPress={handleManagementPress}
              activeOpacity={0.8}
            >
              <View style={styles.productIcon}>
                <Text style={styles.productIconText}>POS</Text>
              </View>
              <Text style={styles.productSubTitle}>Quản lý</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.productCard, styles.secondaryCard]}
              onPress={handleKOMPress}
              activeOpacity={0.8}
            >
              <View style={styles.productIcon}>
                <Text style={styles.productIconText}>POS</Text>
              </View>
              <Text style={styles.productSubTitle}>KOM</Text>
            </TouchableOpacity>
          </View>
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

const { width, height } = Dimensions.get("window");

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
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
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
});

export default MainScreen;
