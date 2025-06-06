import { Product, Table } from "@/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
  Animated,
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
  product: Product;
}

interface OrderBottomSheetProps {
  visible: boolean;
  orderItems: OrderItem[];
  selectedTable?: Table | null;
  totalAmount: number;
  onPress?: () => void;
  isExistingOrder?: boolean;
}

const COLLAPSED_HEIGHT = 80;

export default function OrderBottomSheet({
  visible,
  orderItems,
  selectedTable,
  totalAmount,
  onPress,
  isExistingOrder = false,
}: OrderBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(100)).current;

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

  const handleContentPress = () => {
    onPress?.(); // This will open the UnifiedOrderModal
  };

  if (!visible || (!selectedTable && orderItems.length === 0)) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          height: COLLAPSED_HEIGHT + insets.bottom + 16,
        },
      ]}
    >
      {/* Main Content - Clickable to open modal */}
      <TouchableOpacity style={styles.content} onPress={handleContentPress}>
        <View style={styles.leftContent}>
          <View style={styles.tableInfo}>
            <Ionicons name="restaurant" size={16} color="#fff" />
            <Text style={styles.tableName}>
              {selectedTable ? `${selectedTable.name}` : "Đơn hàng"}
            </Text>
            {orderItems.length > 0 && <Text style={styles.separator}>•</Text>}
          </View>

          {orderItems.length > 0 && (
            <View style={styles.orderInfo}>
              <Text style={styles.orderTitle}>{totalItems} món</Text>
            </View>
          )}
        </View>

        <View style={styles.rightContent}>
          {orderItems.length > 0 && (
            <Text style={styles.totalAmount}>{formatPrice(totalAmount)}</Text>
          )}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    minHeight: 48,
  },
  leftContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  tableInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  tableName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 6,
  },
  separator: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    marginHorizontal: 8,
  },
  orderInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
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
