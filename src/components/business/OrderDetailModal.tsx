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

interface OrderDetailModalProps {
  visible: boolean;
  selectedOrder?: OrderListItem;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function OrderDetailModal({
  visible,
  selectedOrder,
  onClose,
  onRefresh,
}: OrderDetailModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [orderStatusText, setOrderStatusText] = useState<string>("");

  useEffect(() => {
    if (visible && selectedOrder) {
      loadOrderDetail();
    } else {
      setOrderDetail(null);
    }
  }, [visible, selectedOrder]);

  const loadOrderDetail = async () => {
    if (!selectedOrder) return;

    try {
      setLoading(true);
      const detail = await ordersService.getOrderDetail(selectedOrder.id);

      // Bổ sung các trường thiếu nếu cần
      if (detail) {
        // Các trường cấp cao nhất
        if (detail.LoaiThue === undefined) detail.LoaiThue = "1"; // Mặc định là NVAT
        if (detail.PriceIncludeVAT === undefined)
          detail.PriceIncludeVAT = false; // Mặc định giá chưa bao gồm VAT
        if (detail.DiscountVAT === undefined) detail.DiscountVAT = 0;
        if (detail.DiscountType === undefined) detail.DiscountType = 0;
        if (detail.Discount === undefined) detail.Discount = 0;

        // Các trường của sản phẩm
        if (detail.products && detail.products.length > 0) {
          detail.products.forEach((product) => {
            // Mặc định VAT là 10% nếu không có
            if (product.VAT === undefined) product.VAT = 10;
            // Tính giá bao gồm VAT nếu không có
            if (product.priceIncludeVAT === undefined) {
              product.priceIncludeVAT = product.price * (1 + product.VAT / 100);
            }
            // Tính tổng tiền bao gồm VAT nếu không có
            if (product.totalCostInclideVAT === undefined) {
              product.totalCostInclideVAT =
                product.priceIncludeVAT * product.quantity;
            }
          });
        }

        setOrderDetail(detail);

        // Xác định trạng thái đơn hàng
        let statusText = "";
        if (detail.receiveDate) {
          setOrderStatus("paid");
          statusText = "Đã thanh toán";
        } else if (detail.sendDate) {
          setOrderStatus("sent");
          statusText = "Tạm tính";
        } else if (detail.confirmDate) {
          setOrderStatus("confirmed");
          statusText = "Đã xác nhận";
        } else if (detail.cancelDate) {
          setOrderStatus("cancelled");
          statusText = "Đã hủy";
        } else {
          setOrderStatus("new");
          statusText = "Đơn mới";
        }
        setOrderStatusText(statusText);
      }
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

  // Lấy màu nền cho badge trạng thái
  const getStatusBadgeStyle = () => {
    switch (orderStatus) {
      case "new":
        return styles.statusBadgeNew;
      case "confirmed":
        return styles.statusBadgeConfirmed;
      case "sent":
        return styles.statusBadgeSent;
      case "paid":
        return styles.statusBadgePaid;
      case "cancelled":
        return styles.statusBadgeCanceled;
      default:
        return {};
    }
  };

  const handleOrderAction = async (
    action:
      | "cancel"
      | "confirm"
      | "print_kitchen"
      | "print_bill"
      | "payment"
      | "detail"
  ) => {
    if (!orderDetail) return;

    try {
      switch (action) {
        case "cancel":
          Alert.alert("Hủy đơn hàng", "Bạn có chắc muốn hủy đơn hàng này?", [
            { text: "Không", style: "cancel" },
            {
              text: "Có",
              onPress: async () => {
                try {
                  await ordersService.cancelOrder(orderDetail.id);
                  Alert.alert("Thành công", "Đã hủy đơn hàng");
                  onClose();
                  onRefresh?.();
                } catch (error: any) {
                  Alert.alert(
                    "Lỗi",
                    `Không thể hủy đơn hàng: ${error.message}`
                  );
                }
              },
            },
          ]);
          break;
        case "confirm":
          Alert.alert(
            "Xác nhận đơn hàng",
            "Bạn có chắc muốn xác nhận đơn hàng này?",
            [
              { text: "Không", style: "cancel" },
              {
                text: "Có",
                onPress: async () => {
                  try {
                    await ordersService.confirmOrder(orderDetail.id);
                    Alert.alert("Thành công", "Đã xác nhận đơn hàng");
                    onClose();
                    onRefresh?.();
                  } catch (error: any) {
                    Alert.alert(
                      "Lỗi",
                      `Không thể xác nhận đơn hàng: ${error.message}`
                    );
                  }
                },
              },
            ]
          );
          break;
        case "print_kitchen":
          // Logic in chế biến
          break;
        case "print_bill":
          // Logic in tạm tính
          break;
        case "payment":
          Alert.alert(
            "Thanh toán đơn hàng",
            "Xác nhận đã nhận thanh toán cho đơn hàng này?",
            [
              { text: "Không", style: "cancel" },
              {
                text: "Có",
                onPress: async () => {
                  try {
                    await ordersService.receiveOrder(orderDetail.id);
                    Alert.alert("Thành công", "Đã thanh toán đơn hàng");
                    onClose();
                    onRefresh?.();
                  } catch (error: any) {
                    Alert.alert(
                      "Lỗi",
                      `Không thể thanh toán đơn hàng: ${error.message}`
                    );
                  }
                },
              },
            ]
          );
          break;
        case "detail":
          // Hiển thị chi tiết đơn hàng
          break;
      }
    } catch (error: any) {
      Alert.alert("Lỗi", `Không thể thực hiện hành động: ${error.message}`);
    }
  };

  const renderActionButtons = () => {
    // Nếu không có món ăn nào hoặc đang loading, không hiển thị các button action
    if (
      loading ||
      !orderDetail ||
      !orderDetail.products ||
      orderDetail.products.length === 0
    )
      return null;

    // Đơn hàng đã thanh toán: chỉ hiển thị Chi tiết và In
    if (orderStatus === "paid") {
      return (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.detailButton]}
            onPress={() => handleOrderAction("detail")}
          >
            <Ionicons name="eye" size={16} color="#198754" />
            <Text style={styles.detailButtonText}>Chi tiết</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => handleOrderAction("print_bill")}
          >
            <Ionicons name="print" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>In</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Đơn hàng đã hủy: chỉ hiển thị Chi tiết
    if (orderStatus === "cancelled") {
      return (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.detailButton]}
            onPress={() => handleOrderAction("detail")}
          >
            <Ionicons name="eye" size={16} color="#198754" />
            <Text style={styles.detailButtonText}>Chi tiết</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Đơn mới: hiển thị Hủy đơn, In chế biến, Xác nhận
    if (orderStatus === "new") {
      return (
        <View style={styles.buttonRowMultiple}>
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={() => handleOrderAction("cancel")}
          >
            <Ionicons name="close-circle" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Huỷ đơn</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => handleOrderAction("print_kitchen")}
          >
            <Ionicons name="restaurant" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>In chế biến</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => handleOrderAction("confirm")}
          >
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Xác nhận</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Đơn đã xác nhận hoặc tạm tính: hiển thị Hủy đơn, In chế biến, In tạm tính, Thanh toán
    return (
      <View style={styles.buttonRowMultiple}>
        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={() => handleOrderAction("cancel")}
        >
          <Ionicons name="close-circle" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Huỷ đơn</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => handleOrderAction("print_kitchen")}
        >
          <Ionicons name="restaurant" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>In chế biến</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.infoButton]}
          onPress={() => handleOrderAction("print_bill")}
        >
          <Ionicons name="receipt" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>In tạm tính</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => handleOrderAction("payment")}
        >
          <Ionicons name="card" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Thanh toán</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderOrderItem = ({ item }: { item: OrderDetailProduct }) => {
    const isPaid = orderStatus === "paid" || orderStatus === "cancelled";
    const itemTotal = item.price * item.quantity;

    return (
      <View style={styles.orderItem}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.productName}
          </Text>
          <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
        </View>

        {!isPaid ? (
          <View style={styles.quantityControls}>
            <TouchableOpacity style={styles.quantityButton} disabled={isPaid}>
              <Ionicons
                name={item.quantity === 1 ? "trash-outline" : "remove"}
                size={16}
                color="#198754"
              />
            </TouchableOpacity>

            <Text style={styles.quantityText}>{item.quantity}</Text>

            <TouchableOpacity style={styles.quantityButton} disabled={isPaid}>
              <Ionicons name="add" size={16} color="#198754" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.quantityDisplayOnly}>
            <Text style={styles.quantityText}>SL: {item.quantity}</Text>
          </View>
        )}

        <View style={styles.itemTotalContainer}>
          <Text style={styles.itemTotal}>{formatPrice(itemTotal)}</Text>
        </View>
      </View>
    );
  };

  // Tính tổng tiền
  const calculateTotals = () => {
    if (!orderDetail || !orderDetail.products)
      return { subtotal: 0, taxAmount: 0, totalAmount: 0 };

    const subtotal = orderDetail.products.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const taxRate = 0.1; // 10% VAT
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    return { subtotal, taxAmount, totalAmount };
  };

  const { subtotal, taxAmount, totalAmount } = calculateTotals();

  // Render thông tin chi tiết đơn hàng
  const renderOrderInfo = () => {
    if (!orderDetail) return null;

    return (
      <View style={styles.orderInfoContainer}>
        <View style={styles.orderInfoRow}>
          <Text style={styles.orderInfoLabel}>Mã đơn:</Text>
          <Text style={styles.orderInfoValue}>{orderDetail.code}</Text>
        </View>

        <View style={styles.orderInfoRow}>
          <Text style={styles.orderInfoLabel}>Trạng thái:</Text>
          <View style={[styles.statusBadge, getStatusBadgeStyle()]}>
            <Text style={styles.statusText}>{orderStatusText}</Text>
          </View>
        </View>

        <View style={styles.orderInfoRow}>
          <Text style={styles.orderInfoLabel}>Khách hàng:</Text>
          <Text style={styles.orderInfoValue}>
            {orderDetail.customerName || "Khách lẻ"}{" "}
            {orderDetail.customerPhone ? `(${orderDetail.customerPhone})` : ""}
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
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {selectedOrder
              ? `Chi tiết đơn #${selectedOrder.code}`
              : "Chi tiết đơn hàng"}
          </Text>
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
        ) : (
          <>
            {/* Thông tin chi tiết đơn hàng */}
            {renderOrderInfo()}

            {/* Order Items List */}
            {orderDetail &&
            orderDetail.products &&
            orderDetail.products.length > 0 ? (
              <FlatList
                data={orderDetail.products}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item.id}
                style={styles.itemsList}
                contentContainerStyle={styles.itemsListContent}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="restaurant-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Chưa có món nào được chọn</Text>
                <Text style={styles.emptySubtext}>
                  Vui lòng chọn món từ thực đơn
                </Text>
              </View>
            )}

            {/* Summary Section */}
            {orderDetail &&
              orderDetail.products &&
              orderDetail.products.length > 0 && (
                <View style={styles.summarySection}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tiền hàng:</Text>
                    <Text style={styles.summaryValue}>
                      {formatPrice(subtotal)}
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tiền thuế (10%):</Text>
                    <Text style={styles.summaryValue}>
                      {formatPrice(taxAmount)}
                    </Text>
                  </View>

                  <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Phải thu:</Text>
                    <Text style={styles.totalValue}>
                      {formatPrice(totalAmount)}
                    </Text>
                  </View>
                </View>
              )}

            {/* Footer Actions */}
            <View
              style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}
            >
              {renderActionButtons()}
            </View>
          </>
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
  // Order details styles
  orderInfoContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  orderInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderInfoLabel: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  orderInfoValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "400",
    maxWidth: "60%",
    textAlign: "right",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusBadgeNew: {
    backgroundColor: "#007bff",
  },
  statusBadgeConfirmed: {
    backgroundColor: "#28a745",
  },
  statusBadgeSent: {
    backgroundColor: "#fd7e14",
  },
  statusBadgePaid: {
    backgroundColor: "#20c997",
  },
  statusBadgeCanceled: {
    backgroundColor: "#dc3545",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  // Order Items
  itemsList: {
    flex: 1,
    backgroundColor: "#fff",
  },
  itemsListContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: "#666",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  quantityDisplayOnly: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quantityButton: {
    padding: 8,
    borderRadius: 6,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    minWidth: 30,
    textAlign: "center",
  },
  itemTotalContainer: {
    marginLeft: 12,
    minWidth: 80,
    alignItems: "flex-end",
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#198754",
  },
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    backgroundColor: "#fff",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  // Summary Section
  summarySection: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#666",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#198754",
  },
  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  buttonRowMultiple: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#198754",
  },
  secondaryButton: {
    backgroundColor: "#fd7e14",
  },
  infoButton: {
    backgroundColor: "#0dcaf0",
  },
  dangerButton: {
    backgroundColor: "#dc3545",
  },
  detailButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#198754",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  detailButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#198754",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
});
