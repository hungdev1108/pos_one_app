import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert, SafeAreaView, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

const POSONE_MANAGEMENT_URL = "https://demo.posone.vn/";

export default function ManagerWebView() {
  const [isLoading, setIsLoading] = useState(true);

  const webViewRef = useRef<WebView>(null);

  const handleBack = () => {
    router.back();
  };

  const onLoadStart = () => {
    setIsLoading(true);
  };

  const onLoadEnd = () => {
    setIsLoading(false);
  };

  const onError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error("WebView error: ", nativeEvent);
    Alert.alert(
      "Lỗi kết nối",
      "Không thể tải trang web. Vui lòng kiểm tra kết nối internet và thử lại.",
      [
        { text: "Thử lại", onPress: () => webViewRef.current?.reload() },
        { text: "Quay lại", onPress: handleBack },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Simplified Header */}

      {/* <View style={styles.header}> */}
      {/* <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity> */}

      {/* <Text style={styles.headerTitle}>Quản lý POS ONE</Text> */}

      {/* Empty view to center the title */}
      {/* <View style={styles.headerButton} /> */}
      {/* </View> */}

      {/* Loading Indicator */}
      {/* {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#198754" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      )} */}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: POSONE_MANAGEMENT_URL }}
        style={styles.webview}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
        onError={onError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsBackForwardNavigationGestures={true}
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  loadingContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -50 }],
    zIndex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  webview: {
    flex: 1,
  },
});
