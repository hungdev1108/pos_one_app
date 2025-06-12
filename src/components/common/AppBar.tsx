import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface AppBarProps {
  onMenuPress: () => void;
  onReloadPress: () => void;
}

export default function AppBar({ onMenuPress, onReloadPress }: AppBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar style="light" />
      {/* Status bar background for Android edge-to-edge */}
      {Platform.OS === "android" && (
        <View style={[styles.statusBarBackground, { height: insets.top }]} />
      )}
      <View
        style={[
          styles.container,
          {
            paddingTop: Platform.OS === "android" ? 8 : insets.top + 8, // Conditional padding
          },
        ]}
      >
        {/* Menu Button */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onMenuPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu" size={24} color="#5470ff" />
        </TouchableOpacity>

        {/* Title */}
        {/* <View style={styles.titleContainer}>
          <Ionicons name="logo-stackoverflow" size={24} color="#fff" />
          <Text style={styles.posText}>POS</Text>
          <Text style={styles.oneText}> ONE</Text>
        </View> */}

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            style={styles.logo}
            source={require("../../../assets/images/Logo-one-purple_new.png")}
          />
        </View>

        {/* Reload Button */}
        <TouchableOpacity
          style={styles.reloadButton}
          onPress={onReloadPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  statusBarBackground: {
    backgroundColor: "#198754",
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 140,
    height: 40,
    objectFit: "contain",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingBottom: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
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
