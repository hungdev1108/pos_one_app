import {
  OrderDetail,
  OrderDetailProduct,
  OrderListItem,
  ordersService,
} from "@/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface OrderDetailViewModalProps {
  visible: boolean;
  order?: OrderListItem;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function OrderDetailViewModal({
  visible,
  order,
  onClose,
  onRefresh,
}: OrderDetailViewModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);

  useEffect(() => {
    if (visible && order) {
      loadOrderDetail();
    } else {
      setOrderDetail(null);
    }
  }, [visible, order]);

  const loadOrderDetail = async () => {
    if (!order) return;

    try {
      setLoading(true);
      const detail = await ordersService.getOrderDetail(order.id);
      setOrderDetail(detail);
    } catch (error: any) {
      Alert.alert("Lỗi", `Không thể tải chi tiết đơn hàng: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return { date: "", time: "" };

    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("vi-VN"),
      time: date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getOrderStatus = (): string => {
    if (!orderDetail) return "";

    if (orderDetail.receiveDate) return "Đã thanh toán";
    if (orderDetail.sendDate) return "Tạm tính";
    if (orderDetail.confirmDate) return "Đã xác nhận";
    if (orderDetail.cancelDate) return "Đã hủy";
    return "Đơn mới";
  };

  // Lấy màu nền cho badge trạng thái
  const getStatusBadgeStyle = () => {
    const status = getOrderStatus();
    switch (status) {
      case "Đơn mới":
        return styles.statusBadgeNew;
      case "Đã xác nhận":
        return styles.statusBadgeConfirmed;
      case "Tạm tính":
        return styles.statusBadgeSent;
      case "Đã thanh toán":
        return styles.statusBadgePaid;
      case "Đã hủy":
        return styles.statusBadgeCanceled;
      default:
        return {};
    }
  };

  const handleOrderAction = async (
    action:
      | "confirm"
      | "send"
      | "receive"
      | "cancel"
      | "print_kitchen"
      | "print_temp"
      | "print_bill"
  ) => {
    if (!orderDetail) return;

    try {
      let actionText = "";
      let confirmText = "";
      let isApiCall = true;

      switch (action) {
        case "confirm":
          actionText = "xác nhận";
          confirmText = "Bạn có chắc muốn xác nhận đơn hàng này?";
          break;
        case "send":
          actionText = "phục vụ";
          confirmText = "Xác nhận phục vụ đơn hàng này?";
          break;
        case "receive":
          actionText = "thanh toán";
          confirmText = "Xác nhận đã nhận thanh toán cho đơn hàng này?";
          break;
        case "cancel":
          actionText = "hủy";
          confirmText = "Bạn có chắc muốn hủy đơn hàng này?";
          break;
        case "print_kitchen":
          actionText = "in chế biến";
          confirmText = "Bạn có muốn in phiếu chế biến?";
          isApiCall = false;
          break;
        case "print_temp":
          actionText = "in tạm tính";
          confirmText = "Bạn có muốn in hóa đơn tạm tính?";
          isApiCall = false;
          break;
        case "print_bill":
          actionText = "in hóa đơn";
          confirmText = "Bạn có muốn in hóa đơn thanh toán?";
          isApiCall = false;
          break;
      }

      Alert.alert(
        `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} đơn hàng`,
        confirmText,
        [
          { text: "Không", style: "cancel" },
          {
            text: "Có",
            onPress: async () => {
              try {
                if (isApiCall) {
                  switch (action) {
                    case "confirm":
                      await ordersService.confirmOrder(orderDetail.id);
                      break;
                    case "send":
                      await ordersService.sendOrder(orderDetail.id);
                      break;
                    case "receive":
                      await ordersService.receiveOrder(orderDetail.id);
                      break;
                    case "cancel":
                      await ordersService.cancelOrder(orderDetail.id);
                      break;
                  }
                } else {
                  // Xử lý in hóa đơn ở đây
                  switch (action) {
                    case "print_kitchen":
                      // Xử lý in phiếu chế biến
                      break;
                    case "print_temp":
                      // Xử lý in hóa đơn tạm tính
                      break;
                    case "print_bill":
                      // Xử lý in hóa đơn thanh toán
                      break;
                  }
                }

                Alert.alert(
                  "Thành công",
                  `Đã ${actionText} đơn hàng thành công!`
                );

                if (isApiCall) {
                  await loadOrderDetail();
                  onRefresh?.();
                }
              } catch (error: any) {
                Alert.alert(
                  "Lỗi",
                  `Không thể ${actionText} đơn hàng: ${error.message}`
                );
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Lỗi", `Có lỗi xảy ra: ${error.message}`);
    }
  };

  const renderActionButtons = () => {
    if (!orderDetail) return null;

    const buttons = [];
    const status = getOrderStatus();

    if (status === "Đơn mới") {
      buttons.push(
        <TouchableOpacity
          key="confirm"
          style={[styles.actionButton, styles.confirmButton]}
          onPress={() => handleOrderAction("confirm")}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Xác nhận</Text>
        </TouchableOpacity>
      );
    } else if (status === "Đã xác nhận") {
      buttons.push(
        <TouchableOpacity
          key="send"
          style={[styles.actionButton, styles.sendButton]}
          onPress={() => handleOrderAction("send")}
        >
          <Ionicons name="restaurant" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Phục vụ</Text>
        </TouchableOpacity>
      );

      buttons.push(
        <TouchableOpacity
          key="print_kitchen"
          style={[styles.actionButton, styles.printButton]}
          onPress={() => handleOrderAction("print_kitchen")}
        >
          <Ionicons name="print" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>In chế biến</Text>
        </TouchableOpacity>
      );
    } else if (status === "Tạm tính") {
      buttons.push(
        <TouchableOpacity
          key="receive"
          style={[styles.actionButton, styles.receiveButton]}
          onPress={() => handleOrderAction("receive")}
        >
          <Ionicons name="card" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Thanh toán</Text>
        </TouchableOpacity>
      );

      buttons.push(
        <TouchableOpacity
          key="print_temp"
          style={[styles.actionButton, styles.printButton]}
          onPress={() => handleOrderAction("print_temp")}
        >
          <Ionicons name="print" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>In tạm tính</Text>
        </TouchableOpacity>
      );
    } else if (status === "Đã thanh toán") {
      buttons.push(
        <TouchableOpacity
          key="print_bill"
          style={[styles.actionButton, styles.printButton]}
          onPress={() => handleOrderAction("print_bill")}
        >
          <Ionicons name="print" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>In hóa đơn</Text>
        </TouchableOpacity>
      );
    }

    return buttons;
  };

  const renderOrderDetailProduct = ({ item }: { item: OrderDetailProduct }) => {
    return (
      <View style={styles.productItem}>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.productName}
          </Text>
          <Text style={styles.productQuantity}>
            SL: {item.quantity} × {formatPrice(item.price)}
          </Text>
        </View>
        <View style={styles.productTotal}>
          <Text style={styles.productTotalText}>
            {formatPrice(item.totalCost)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#198754" />
            <Text style={styles.loadingText}>
              Đang tải chi tiết đơn hàng...
            </Text>
          </View>
        ) : orderDetail ? (
          <>
            {/* Order Info */}
            <View style={styles.orderInfoContainer}>
              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Mã đơn:</Text>
                <Text style={styles.orderInfoValue}>{orderDetail.code}</Text>
              </View>

              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Trạng thái:</Text>
                <View style={[styles.statusBadge, getStatusBadgeStyle()]}>
                  <Text style={styles.statusText}>{getOrderStatus()}</Text>
                </View>
              </View>

              {orderDetail.tableName && (
                <View style={styles.orderInfoRow}>
                  <Text style={styles.orderInfoLabel}>Bàn:</Text>
                  <Text style={styles.orderInfoValue}>
                    {orderDetail.tableName}{" "}
                    {orderDetail.areaName ? `(${orderDetail.areaName})` : ""}
                  </Text>
                </View>
              )}

              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Khách hàng:</Text>
                <Text style={styles.orderInfoValue}>
                  {orderDetail.customerName || "Khách lẻ"}{" "}
                  {orderDetail.customerPhone
                    ? `(${orderDetail.customerPhone})`
                    : ""}
                </Text>
              </View>

              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Ngày tạo:</Text>
                <Text style={styles.orderInfoValue}>
                  {formatDateTime(orderDetail.createDate).time}{" "}
                  {formatDateTime(orderDetail.createDate).date}
                </Text>
              </View>
            </View>

            {/* Products List */}
            <View style={styles.productsContainer}>
              <View style={styles.productsHeader}>
                <Ionicons name="restaurant-outline" size={20} color="#198754" />
                <Text style={styles.productsTitle}>Danh sách món</Text>
              </View>

              <FlatList
                data={orderDetail.products}
                renderItem={renderOrderDetailProduct}
                keyExtractor={(item) => item.id}
                style={styles.productsList}
                contentContainerStyle={styles.productsListContent}
                showsVerticalScrollIndicator={false}
              />
            </View>

            {/* Summary */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tổng tiền:</Text>
                <Text style={styles.summaryValue}>
                  {formatPrice(orderDetail.totalAmount)}
                </Text>
              </View>

              {orderDetail.discount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Giảm giá:</Text>
                  <Text style={[styles.summaryValue, styles.discountValue]}>
                    - {formatPrice(orderDetail.discount)}
                  </Text>
                </View>
              )}

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabelTotal}>Thanh toán:</Text>
                <Text style={styles.summaryValueTotal}>
                  {formatPrice(orderDetail.totalPayableAmount)}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View
              style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}
            >
              <View style={styles.actionButtons}>{renderActionButtons()}</View>
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Không có thông tin đơn hàng</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  orderInfoContainer: {
    backgroundColor: "#fff",
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderInfoLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  orderInfoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    flex: 2,
    textAlign: "right",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-end",
  },
  statusBadgeNew: {
    backgroundColor: "#cff4fc",
  },
  statusBadgeConfirmed: {
    backgroundColor: "#d1e7dd",
  },
  statusBadgeSent: {
    backgroundColor: "#fff3cd",
  },
  statusBadgePaid: {
    backgroundColor: "#d1e7dd",
  },
  statusBadgeCanceled: {
    backgroundColor: "#f8d7da",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  productsContainer: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  productsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  productsList: {
    maxHeight: 300,
  },
  productsListContent: {
    paddingBottom: 8,
  },
  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  productInfo: {
    flex: 1,
    paddingRight: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 12,
    color: "#666",
  },
  productTotal: {
    justifyContent: "center",
  },
  productTotalText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#198754",
  },
  summaryContainer: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  discountValue: {
    color: "#dc3545",
  },
  summaryLabelTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#198754",
  },
  footer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 140,
  },
  confirmButton: {
    backgroundColor: "#28a745",
  },
  sendButton: {
    backgroundColor: "#fd7e14",
  },
  receiveButton: {
    backgroundColor: "#20c997",
  },
  printButton: {
    backgroundColor: "#6c757d",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 8,
  },
});
