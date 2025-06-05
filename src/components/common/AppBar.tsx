import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface AppBarProps {
  onMenuPress: () => void;
  onReloadPress: () => void;
}

export default function AppBar({ onMenuPress, onReloadPress }: AppBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar style="light" backgroundColor="#198754" />
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + 8, // Dynamic padding cho tai thỏ/Dynamic Island
          },
        ]}
      >
        {/* Menu Button */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onMenuPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Ionicons name="logo-stackoverflow" size={24} color="#fff" />
          <Text style={styles.posText}>POS</Text>
          <Text style={styles.oneText}> ONE</Text>
        </View>

        {/* Logo */}
        {/* <View style={styles.logoContainer}>
          <Image
            style={styles.logo}
            source={require("../../../assets/images/POS-ONE-LOGO.png")}
          />
        </View> */}

        {/* Reload Button */}
        <TouchableOpacity
          style={styles.reloadButton}
          onPress={onReloadPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 160,
    height: 50,
    objectFit: "contain",
    backgroundColor: "#fff",
    borderRadius: 28,
    // paddingHorizontal: 10,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#198754",
    paddingHorizontal: 10,
    paddingBottom: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
    // Đảm bảo AppBar luôn hiển thị trên cùng
    position: "relative",
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    // Tăng touch area cho dễ bấm
    minWidth: 40,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  posText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1,
  },
  oneText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1,
  },
  reloadButton: {
    padding: 8,
    borderRadius: 8,
    // Tăng touch area cho dễ bấm
    minWidth: 40,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});
