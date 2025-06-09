import { authService } from "@/src/api";
import { ThemedText } from "@/src/components/ui/ThemedText";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function InitialScreen() {
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      // Add a small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const isLoggedIn = await authService.isLoggedIn();

      if (isLoggedIn) {
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
    } catch (error) {
      console.error("Error checking login status:", error);
      router.replace("/login");
    }
  };

  return (
    <View style={styles.container}>
      {/* <View style={styles.logoContainer}>
        <ThemedText style={styles.posText}>POS</ThemedText>
        <ThemedText style={styles.oneText}> ONE</ThemedText>
      </View> */}
      <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
      <ThemedText style={styles.loadingText}>Đang khởi động...</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  posText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#4CAF50",
    letterSpacing: 2,
  },
  oneText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#2196F3",
    letterSpacing: 2,
  },
  loader: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
});
