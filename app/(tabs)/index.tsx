import React, { Suspense, lazy } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

// ✅ TỐI ƯU: Lazy load HomeScreen để giảm initial bundle size
const HomeScreen = lazy(() => import("@/src/screens/pos/home"));

// Loading fallback component được tối ưu
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#198754" />
  </View>
);

export default function TabIndexScreen() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <HomeScreen />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});
