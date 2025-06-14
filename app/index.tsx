import { authService } from "@/src/api";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function InitialScreen() {
  // Optimize với useCallback để tránh re-create function
  const checkLoginStatus = useCallback(async () => {
    try {
      // ✅ LOẠI BỎ delay không cần thiết để app load nhanh hơn
      // await new Promise((resolve) => setTimeout(resolve, 1000));

      const isLoggedIn = await authService.isLoggedIn();

      if (isLoggedIn) {
        router.replace("/main");
      } else {
        router.replace("/login");
      }
    } catch (error) {
      console.error("Error checking login status:", error);
      // Fallback về login nếu có lỗi
      router.replace("/login");
    }
  }, []);

  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/images/favicon_new.png")}
          style={styles.logo}
          contentFit="contain"
          transition={200}
          cachePolicy="memory-disk"
        />
      </View>
      
      <ActivityIndicator size="large" color="#198754" style={styles.loader} />
      <Text style={styles.loadingText}>Đang khởi động...</Text>
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
    marginBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  loader: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
});
