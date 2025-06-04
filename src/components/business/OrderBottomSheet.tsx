import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
}

interface OrderBottomSheetProps {
  visible: boolean;
  orderItems: OrderItem[];
  totalAmount: number;
  onPress: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function OrderBottomSheet({
  visible,
  orderItems,
  totalAmount,
  onPress,
}: OrderBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = React.useRef(new Animated.Value(100)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: 100,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }).start();
    }
  }, [visible]);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  if (!visible || orderItems.length === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      <TouchableOpacity style={styles.content} onPress={onPress}>
        <View style={styles.leftContent}>
          <Text style={styles.orderTitle}>Đơn hàng</Text>
          <Text style={styles.orderDetails}>{totalItems} món</Text>
        </View>

        <View style={styles.rightContent}>
          <Text style={styles.totalAmount}>{formatPrice(totalAmount)}</Text>
          <Ionicons name="chevron-up" size={20} color="#fff" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#198754",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 48,
  },
  leftContent: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  orderDetails: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
});
