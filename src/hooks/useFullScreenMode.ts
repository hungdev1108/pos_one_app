// Create a hook to set the full screen mode for android
import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";
import { Platform } from "react-native";

export function useFullScreenMode() {
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("inset-swipe");
    }
  }, []);
}
