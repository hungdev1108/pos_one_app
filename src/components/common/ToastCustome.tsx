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
