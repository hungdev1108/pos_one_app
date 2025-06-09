import { OrderDetail, ordersService, Product, Table } from "@/src/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
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
  mode?: "create" | "view" | "edit"; // Chế độ hiển thị
  orderCode?: string; // Mã đơn hàng khi xem chi tiết
  selectedOrder?: any; // Đơn hàng được chọn từ tab Orders
  refreshTrigger?: number; // Trigger để reload orderDetail
}

const COLLAPSED_HEIGHT = 80;

export default function OrderBottomSheet({
  visible,
  orderItems,
  selectedTable,
  totalAmount,
  onPress,
  isExistingOrder = false,
  mode = "create",
  orderCode,
  selectedOrder,
  refreshTrigger,
}: OrderBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(100)).current;

  // State để lưu chi tiết đơn hàng
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);

  // Load chi tiết đơn hàng khi có selectedOrder
  useEffect(() => {
    if (selectedOrder && selectedOrder.id) {
      loadOrderDetail(selectedOrder.id);
    } else {
      setOrderDetail(null);
    }
  }, [selectedOrder]);

  // Reload orderDetail khi refreshTrigger thay đổi
  useEffect(() => {
    if (
      selectedOrder &&
      selectedOrder.id &&
      refreshTrigger &&
      refreshTrigger > 0
    ) {
      console.log("🔄 Refreshing order detail due to trigger:", refreshTrigger);
      loadOrderDetail(selectedOrder.id);
    }
  }, [refreshTrigger]);

  const loadOrderDetail = async (orderId: string) => {
    try {
      setLoadingOrderDetail(true);
      const detail = await ordersService.getOrderDetail(orderId);
      if (detail) {
        setOrderDetail(detail);
      }
    } catch (error) {
      console.error("Error loading order detail:", error);
    } finally {
      setLoadingOrderDetail(false);
    }
  };

  // Tính tổng số lượng món từ order detail
  const orderDetailTotalQuantity =
    orderDetail?.products?.reduce(
      (sum, product) => sum + product.quantity,
      0
    ) || 0;

  // Tính tổng tiền từ products nếu không có totalPayableAmount
  const orderDetailTotalAmount =
    orderDetail?.totalPayableAmount ||
    orderDetail?.products?.reduce(
      (sum, product) =>
        sum + (product.totalCostInclideVAT || product.totalCost || 0),
      0
    ) ||
    0;

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
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  // Tính tổng số lượng món cho bàn có đơn hàng
  const tableOrderTotalQuantity =
    selectedTable?.order?.products?.reduce(
      (sum: number, product: any) => sum + product.quantity,
      0
    ) || 0;

  const handleContentPress = () => {
    onPress?.(); // This will open the UnifiedOrderModal
  };

  // Hiển thị bottom sheet khi:
  // 1. Có món trong giỏ hàng (mode create)
  // 2. Đang xem đơn hàng có sẵn (mode view/edit)
  // 3. Có bàn được chọn (bao gồm cả bàn trống)
  // 4. Có đơn hàng được chọn từ tab Orders
  const shouldShow =
    visible &&
    (orderItems.length > 0 ||
      mode === "view" ||
      mode === "edit" ||
      selectedTable || // Hiển thị khi có bàn được chọn (bao gồm cả bàn trống)
      selectedOrder);

  if (!shouldShow) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          height: COLLAPSED_HEIGHT + insets.bottom - 20,
        },
      ]}
    >
      {/* Main Content - Clickable to open modal */}
      <TouchableOpacity style={styles.content} onPress={handleContentPress}>
        <View style={styles.leftContent}>
          <View style={styles.tableInfo}>
            <Ionicons name="restaurant" size={14} color="#fff" />
            <Text style={styles.tableName}>
              {selectedOrder
                ? `Đơn #${selectedOrder.code}`
                : selectedTable
                ? `${selectedTable.name}`
                : "Đơn hàng"}
            </Text>
            {(orderItems.length > 0 ||
              (selectedTable?.status === 1 && selectedTable?.order) ||
              selectedOrder) && <Text style={styles.separator}>•</Text>}
          </View>

          {(orderItems.length > 0 ||
            (selectedTable?.status === 1 && selectedTable?.order) ||
            selectedOrder) && (
            <View style={styles.orderInfo}>
              <Text style={styles.orderTitle}>
                {selectedOrder
                  ? orderDetail
                    ? `${orderDetailTotalQuantity} món`
                    : `${selectedOrder.countProducts || 0} loại món`
                  : orderItems.length > 0
                  ? `${totalItems} món`
                  : `${tableOrderTotalQuantity} món`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.rightContent}>
          {(orderItems.length > 0 ||
            (selectedTable?.status === 1 && selectedTable?.order) ||
            selectedOrder) && (
            <Text style={styles.totalAmount}>
              {selectedOrder
                ? orderDetail
                  ? formatPrice(orderDetailTotalAmount)
                  : formatPrice(selectedOrder.totalPrice || 0)
                : orderItems.length > 0
                ? formatPrice(totalAmount)
                : formatPrice(
                    selectedTable?.order?.products?.reduce(
                      (sum, p) => sum + (p.totalCost || 0),
                      0
                    ) || 0
                  )}
            </Text>
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
    minHeight: 60,
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
    marginHorizontal: 3,
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
    gap: 6,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
});
