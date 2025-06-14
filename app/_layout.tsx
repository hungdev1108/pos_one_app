import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Asset } from "expo-asset";
import { useFonts } from "expo-font";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import Toast from "react-native-toast-message";

import OrientationProvider from "@/src/components/common/OrientationProvider";
import { useColorScheme } from "@/src/hooks/useColorScheme";

// ✅ TỐI ƯU: Preload critical assets
const preloadAssets = async () => {
  try {
    // Preload critical images - ưu tiên favicon_new.png
    const imageAssets = [
      require("../assets/images/favicon_new.png"), // Logo chính mới
      require("../assets/images/One-Green-no-backg.png"), // Logo phụ
    ];

    // Preload images
    await Asset.loadAsync(imageAssets);
    
    // ✅ TỐI ƯU: Chỉ log trong development
    if (__DEV__) {
      console.log("✅ Critical assets preloaded successfully");
    }
  } catch (error) {
    // ✅ TỐI ƯU: Chỉ warn trong development
    if (__DEV__) {
      console.warn("⚠️ Error preloading assets:", error);
    }
    // Không throw error để không block app
  }
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // ✅ TỐI ƯU: Preload assets khi app khởi động
  useEffect(() => {
    preloadAssets().finally(() => {
      setAssetsLoaded(true);
    });
  }, []);

  // ✅ TỐI ƯU: Hiển thị loading screen với logo favicon_new.png
  if (!loaded || !assetsLoaded) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#f8f9fa' 
      }}>
        <Image
          source={require("../assets/images/favicon_new.png")}
          style={{ width: 100, height: 100, marginBottom: 20 }}
          contentFit="contain"
          transition={200}
        />
        <ActivityIndicator size="large" color="#198754" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <OrientationProvider disabled={__DEV__}>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <StatusBar hidden />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="main" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="help" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          {/* <StatusBar style="auto" /> */}
          <Toast />
        </ThemeProvider>
      </OrientationProvider>
    </GestureHandlerRootView>
  );
}
