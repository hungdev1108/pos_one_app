import Toast from "react-native-toast-message";

export const showAddProductToast = (product: any) => {
  Toast.show({
    type: "success",
    position: "top",
    visibilityTime: 1400,
    autoHide: true,
    topOffset: 48,
    text1: `Đã thêm "${product.title}" vào đơn hàng!`,
    text1Style: {
      fontSize: 14,
      color: "#198754",
      fontWeight: "bold",
    },
    text2: "Bạn có thể kiểm tra trong đơn hàng.",
    text2Style: {
      fontSize: 13,
      color: "#333",
    },
    onPress: () => {
      // Xử lý khi bấm vào Toast, ví dụ điều hướng đến đơn hàng
      // navigation.navigate('Cart');
    },
  });
};

export const showAutoSaveOrderToast = (tableName: string, orderCode?: string) => {
  Toast.show({
    type: "success",
    position: "top",
    visibilityTime: 2000,
    autoHide: true,
    topOffset: 48,
    text1: `✅ Đã tự động lưu đơn hàng ${tableName}`,
    text1Style: {
      fontSize: 14,
      color: "#198754",
      fontWeight: "bold",
    },
    text2: orderCode ? `Mã đơn: ${orderCode}` : "Đơn hàng đã được lưu vào hệ thống",
    text2Style: {
      fontSize: 13,
      color: "#333",
    },
  });
};

export const showAutoSaveFailedToast = (tableName: string) => {
  Toast.show({
    type: "info",
    position: "top",
    visibilityTime: 2000,
    autoHide: true,
    topOffset: 48,
    text1: `💾 Đã lưu nháp cho ${tableName}`,
    text1Style: {
      fontSize: 14,
      color: "#0ea5e9",
      fontWeight: "bold",
    },
    text2: "Sẽ tự động tạo đơn hàng khi có kết nối",
    text2Style: {
      fontSize: 13,
      color: "#333",
    },
  });
};
