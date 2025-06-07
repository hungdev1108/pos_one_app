import {
  OrderDetail,
  OrderListItem,
  Product,
  Table,
  ordersService,
} from "@/api";
import { OrderMode } from "@/src/services/buttonVisibilityService";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
  State,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  calculateOrderSummary,
  formatPrice as formatPriceUtil,
} from "../../utils/orderCalculations";
import OrderActionButtons from "./OrderActionButtons";
import ProductQuantityControls from "./ProductQuantityControls";

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  product: Product;
}

interface UnifiedOrderModalProps {
  visible: boolean;
  orderItems: OrderItem[];
  selectedTable?: Table | null;
  onClose: () => void;
  onUpdateQuantity?: (itemId: string, newQuantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
  onCreateOrder?: () => void;
  onPrint?: () => void;
  isExistingOrder?: boolean;
  isPaid?: boolean;
  title?: string;
  selectedOrder?: OrderListItem;
  onRefresh?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = -SCREEN_WIDTH * 0.3; // 30% of screen width

// Swipeable Order Item Component
const SwipeableOrderItem: React.FC<{
  item: OrderItem;
  onUpdateQuantity?: (itemId: string, newQuantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
  isPaid: boolean;
  order?: any;
}> = ({ item, onUpdateQuantity, onRemoveItem, isPaid, order }) => {
  const translateX = useRef(new Animated.Value(0)).current;

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleSwipeGesture = (event: PanGestureHandlerGestureEvent) => {
    const { translationX } = event.nativeEvent;

    // Only allow swipe to the left (negative values) and if not paid
    if (translationX <= 0 && !isPaid) {
      translateX.setValue(translationX);
    }
  };

  const handleSwipeStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    const { translationX, state } = event.nativeEvent;

    if (state === State.END && !isPaid) {
      if (translationX < SWIPE_THRESHOLD) {
        // Animate to show delete button
        Animated.spring(translateX, {
          toValue: -80,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
      } else {
        // Animate back to original position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  };

  const handleDelete = () => {
    if (!isPaid && onRemoveItem) {
      // Animate out then remove
      Animated.timing(translateX, {
        toValue: -SCREEN_WIDTH,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        onRemoveItem(item.id);
      });
    }
  };

  const resetSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  };

  const itemTotal = item.price * item.quantity;

  return (
    <View style={styles.swipeContainer}>
      {/* Delete Button Background - Only show if not paid */}
      {!isPaid && (
        <View style={styles.deleteBackground}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash" size={20} color="#fff" />
            <Text style={styles.deleteButtonText}>Xóa</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Item Content */}
      <PanGestureHandler
        onGestureEvent={handleSwipeGesture}
        onHandlerStateChange={handleSwipeStateChange}
        enabled={!isPaid} // Disable swipe for paid orders
      >
        <Animated.View
          style={[
            styles.orderItem,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <TouchableOpacity style={styles.itemContent} onPress={resetSwipe}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
            </View>

            <ProductQuantityControls
              item={item}
              order={order}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveItem={onRemoveItem}
              isPaid={isPaid}
            />

            <View style={styles.itemTotalContainer}>
              <Text style={styles.itemTotal}>{formatPrice(itemTotal)}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

export default function UnifiedOrderModal({
  visible,
  orderItems,
  selectedTable,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onCreateOrder,
  onPrint,
  isExistingOrder = false,
  isPaid = false,
  title,
  selectedOrder,
  onRefresh,
}: UnifiedOrderModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [orderStatusText, setOrderStatusText] = useState<string>("");
  const [orderDetailItems, setOrderDetailItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    if (visible && selectedOrder) {
      loadOrderDetail();
    } else {
      // Reset state khi modal đóng hoặc không có selectedOrder
      setOrderDetail(null);
      setOrderDetailItems([]);
      setOrderStatus("");
      setOrderStatusText("");
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
            // KHÔNG force set VAT, chỉ tính toán các field thiếu
            // Lấy VAT rate từ API (ưu tiên field 'vat' viết thường)
            const vatRate = (product as any).vat || product.VAT || 0;

            // Tính giá bao gồm VAT nếu không có
            if (product.priceIncludeVAT === undefined) {
              product.priceIncludeVAT = product.price * (1 + vatRate / 100);
            }
            // Tính tổng tiền bao gồm VAT nếu không có
            if (product.totalCostInclideVAT === undefined) {
              product.totalCostInclideVAT =
                product.priceIncludeVAT * product.quantity;
            }
          });
        }

        setOrderDetail(detail);

        // Convert OrderDetail.products thành OrderItem[] để hiển thị
        if (detail.products && detail.products.length > 0) {
          const convertedItems: OrderItem[] = detail.products.map(
            (product) => ({
              id: product.id,
              title: product.productName,
              price: product.price,
              quantity: product.quantity,
              product: {
                id: product.id,
                title: product.productName,
                categoryId: "",
                categoryName: "",
                price: product.price,
                priceAfterDiscount: product.priceIncludeVAT || product.price,
                discount: 0,
                discountType: 0,
                unitName: "",
                isActive: true,
                isPublished: true,
                categoryOutputMethod: 0,
              } as Product,
            })
          );
          setOrderDetailItems(convertedItems);
        } else {
          setOrderDetailItems([]);
        }

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

  // Determine which items to use for display and calculations
  const displayItems = selectedOrder ? orderDetailItems : orderItems;

  // Calculate totals - use orderCalculations for accurate calculation
  let subtotal = 0;
  let taxAmount = 0;
  let totalAmount = 0;

  if (selectedOrder && orderDetail && orderDetail.products) {
    // Debug: Log orderDetail structure
    console.log("🔍 OrderDetail:", {
      LoaiThue: orderDetail.LoaiThue,
      PriceIncludeVAT: orderDetail.PriceIncludeVAT,
      Discount: orderDetail.Discount,
      DiscountType: orderDetail.DiscountType,
      DiscountVAT: orderDetail.DiscountVAT,
      productsCount: orderDetail.products.length,
    });

    // Debug: Log tất cả sản phẩm và VAT của chúng
    console.log("📦 All Products VAT Info:");
    orderDetail.products.forEach((product, index) => {
      const actualVAT = (product as any).vat || product.VAT || 0;
      console.log(`  Product ${index}: ${product.productName}`);
      console.log(
        `    price=${product.price}, priceIncludeVAT=${product.priceIncludeVAT}`
      );
      console.log(
        `    VAT field=${product.VAT}, vat field=${
          (product as any).vat
        }, actual VAT=${actualVAT}%`
      );
      console.log(
        `    totalCost=${product.totalCost}, totalCostInclideVAT=${product.totalCostInclideVAT}`
      );

      // Tính VAT amount để verify
      const vatAmount = product.totalCostInclideVAT - product.totalCost;
      console.log(
        `    VAT Amount: ${vatAmount} (should be ${
          (product.totalCost * actualVAT) / 100
        })`
      );
    });

    // Force sử dụng calculateOrderSummary để test fix VAT
    const orderSummary = calculateOrderSummary(
      orderDetail,
      orderDetail.products
    );
    subtotal = orderSummary.tienHang;
    taxAmount = orderSummary.tienThue;
    totalAmount = orderSummary.phaiThu;

    console.log("📊 Using Calculated Summary (Fixed VAT):", {
      tienHang: subtotal,
      tienThue: taxAmount,
      phaiThu: totalAmount,
    });
  } else {
    // Calculate from displayItems for new orders (simplified)
    subtotal = displayItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const taxRate = 0.1; // 10% VAT
    taxAmount = subtotal * taxRate;
    totalAmount = subtotal + taxAmount;
  }

  const renderOrderItem = ({ item }: { item: OrderItem }) => {
    // Determine if order is paid based on status
    const isOrderPaid = selectedOrder ? orderStatus === "paid" : isPaid;

    return (
      <SwipeableOrderItem
        item={item}
        onUpdateQuantity={onUpdateQuantity}
        onRemoveItem={onRemoveItem}
        isPaid={isOrderPaid}
        order={orderDetail || selectedOrder}
      />
    );
  };

  // Render thông tin chi tiết đơn hàng
  const renderOrderDetails = () => {
    if (!selectedOrder || !orderDetail) return null;

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

  const handleOrderAction = async (action: string) => {
    if (selectedOrder && orderDetail) {
      try {
        switch (action) {
          case "cancel":
          case "cancel_order":
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
          case "save":
            // Logic lưu đơn hàng - delegate to onCreateOrder if available
            if (onCreateOrder) {
              onCreateOrder();
            }
            break;
          case "print_kitchen":
            // Logic in chế biến
            console.log("In chế biến cho đơn hàng:", orderDetail.id);
            break;
          case "print_bill":
          case "print_temporary":
            // Logic in tạm tính
            console.log("In tạm tính cho đơn hàng:", orderDetail.id);
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
          case "delete_order":
            Alert.alert("Xóa đơn hàng", "Bạn có chắc muốn xóa đơn hàng này?", [
              { text: "Không", style: "cancel" },
              {
                text: "Có",
                style: "destructive",
                onPress: async () => {
                  try {
                    // Call delete API if available
                    Alert.alert("Thành công", "Đã xóa đơn hàng");
                    onClose();
                    onRefresh?.();
                  } catch (error: any) {
                    Alert.alert(
                      "Lỗi",
                      `Không thể xóa đơn hàng: ${error.message}`
                    );
                  }
                },
              },
            ]);
            break;
          case "send_order":
            try {
              await ordersService.sendOrder(orderDetail.id);
              Alert.alert("Thành công", "Đã gửi đơn hàng");
              onRefresh?.();
            } catch (error: any) {
              Alert.alert("Lỗi", `Không thể gửi đơn hàng: ${error.message}`);
            }
            break;
          case "confirm_order":
            try {
              console.log("🔄 Confirm order:", orderDetail.id);
              await ordersService.confirmOrder(orderDetail.id);
              Alert.alert("Thành công", "Đã xác nhận đơn hàng");
              onRefresh?.();
            } catch (error: any) {
              Alert.alert(
                "Lỗi",
                `Không thể xác nhận đơn hàng: ${error.message}`
              );
            }
            break;
          case "detail":
            // Hiển thị chi tiết đơn hàng
            console.log("Hiển thị chi tiết đơn hàng:", orderDetail.id);
            break;
        }
      } catch (error: any) {
        Alert.alert("Lỗi", `Không thể thực hiện hành động: ${error.message}`);
      }
    } else if (!selectedOrder) {
      // Handle actions for create mode (chưa lưu đơn hàng)
      switch (action) {
        case "save":
          if (onCreateOrder) {
            onCreateOrder();
          }
          break;
        case "cancel":
          onClose();
          break;
        case "print_kitchen":
          console.log("In chế biến cho đơn hàng mới");
          break;
        default:
          console.log("Action không được hỗ trợ cho đơn hàng mới:", action);
          break;
      }
    }
  };

  const renderActionButtons = () => {
    // Nếu không có món ăn nào thì không hiển thị các button action
    if (loading || displayItems.length === 0) return null;

    // Xác định mode dựa vào trạng thái
    const mode: OrderMode = selectedOrder ? "update" : "create";

    // Đơn hàng đã thanh toán: chỉ hiển thị Chi tiết và In
    const isOrderPaid = selectedOrder ? orderStatus === "paid" : isPaid;
    if (isOrderPaid) {
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
            onPress={onPrint}
          >
            <Ionicons name="print" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>In</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Sử dụng OrderActionButtons component mới
    return (
      <OrderActionButtons
        order={orderDetail || selectedOrder}
        mode={mode}
        products={displayItems}
        onAction={handleOrderAction}
      />
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
            {title ||
              (selectedTable
                ? `Chi tiết - ${selectedTable.name}`
                : "Chi tiết đơn hàng")}
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
            {/* Thông tin chi tiết đơn hàng (chỉ hiển thị khi xem từ tab đơn hàng) */}
            {selectedOrder && renderOrderDetails()}

            {/* Order Items List */}
            {displayItems.length > 0 ? (
              <FlatList
                data={displayItems}
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
            {displayItems.length > 0 && (
              <View style={styles.summarySection}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tiền hàng:</Text>
                  <Text style={styles.summaryValue}>
                    {formatPriceUtil(subtotal)}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tiền thuế:</Text>
                  <Text style={styles.summaryValue}>
                    {formatPriceUtil(taxAmount)}
                  </Text>
                </View>

                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Phải thu:</Text>
                  <Text style={styles.totalValue}>
                    {formatPriceUtil(totalAmount)}
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
  // Lists styles
  itemsList: {
    flex: 1,
    backgroundColor: "#fff",
  },
  itemsListContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  // Swipeable item styles
  swipeContainer: {
    backgroundColor: "#fff",
    marginBottom: 1,
  },
  deleteBackground: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: "#dc3545",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  orderItem: {
    backgroundColor: "#fff",
  },
  itemContent: {
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
