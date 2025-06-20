import {
  OrderDetail,
  OrderListItem,
  Product,
  Table,
  ordersService,
} from "@/src/api";
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
import CustomerInfoModal from "./CustomerInfoModal";
import OrderActionButtons from "./OrderActionButtons";
import PaymentModal from "./PaymentModal";
import ProductQuantityControls from "./ProductQuantityControls";

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  product: Product;
}

interface PaymentData {
  totalAmount: number;
  customerPaid: number;
  change: number;
  paymentMethod: "cash" | "bank";
  bankCode?: string;
  voucher?: string;
}

interface CustomerInfo {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
}

interface UnifiedOrderModalProps {
  visible: boolean;
  orderItems: OrderItem[];
  selectedTable?: Table | null;
  onClose: () => void;
  onUpdateQuantity?: (itemId: string, value: number) => void;
  onRemoveItem?: (itemId: string) => void;
  onCreateOrder?: () => void;
  onPrint?: () => void;
  isExistingOrder?: boolean;
  isPaid?: boolean;
  title?: string;
  selectedOrder?: OrderListItem;
  onRefresh?: () => void;
  onClearOrder?: () => void;
  onOrderCreated?: (orderId: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = -SCREEN_WIDTH * 0.3; // 30% of screen width

// Swipeable Order Item Component
const SwipeableOrderItem: React.FC<{
  item: OrderItem;
  onUpdateQuantity?: (itemId: string, value: number) => void;
  onRemoveItem?: (itemId: string) => void;
  isPaid: boolean;
  order?: any;
  isExistingOrder?: boolean;
}> = ({
  item,
  onUpdateQuantity,
  onRemoveItem,
  isPaid,
  order,
  isExistingOrder = false,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const handleSwipeGesture = (event: PanGestureHandlerGestureEvent) => {
    const { translationX, translationY } = event.nativeEvent;

    // Only allow swipe to the left (negative values) and if not paid
    // Also check if this is more of a horizontal swipe than vertical scroll
    const isHorizontalSwipe = Math.abs(translationX) > Math.abs(translationY);

    if (translationX <= 0 && !isPaid && isHorizontalSwipe) {
      translateX.setValue(translationX);
    }
  };

  const handleSwipeStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    const { translationX, translationY, state } = event.nativeEvent;

    if (state === State.END && !isPaid) {
      // Only process if this was primarily a horizontal gesture
      const isHorizontalSwipe = Math.abs(translationX) > Math.abs(translationY);

      if (isHorizontalSwipe && translationX < SWIPE_THRESHOLD) {
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
      <Animated.View
        style={[
          styles.orderItem,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <View style={styles.itemContent}>
          {/* Swipeable area - chỉ cho phần text */}
          <PanGestureHandler
            onGestureEvent={handleSwipeGesture}
            onHandlerStateChange={handleSwipeStateChange}
            enabled={!isPaid}
            activeOffsetX={[-15, 15]}
            failOffsetY={[-30, 30]}
            shouldCancelWhenOutside={true}
          >
            <View style={styles.itemInfo}>
              <TouchableOpacity onPress={resetSwipe} activeOpacity={0.7}>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
              </TouchableOpacity>
            </View>
          </PanGestureHandler>

          {/* Controls area - no gesture */}
          <ProductQuantityControls
            item={item}
            order={order}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            isPaid={isPaid}
            mode={isExistingOrder ? "change" : "absolute"}
          />

          <View style={styles.itemTotalContainer}>
            <Text style={styles.itemTotal}>{formatPrice(itemTotal)}</Text>
          </View>
        </View>
      </Animated.View>
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
  onClearOrder,
  onOrderCreated,
}: UnifiedOrderModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [orderStatusText, setOrderStatusText] = useState<string>("");
  const [orderDetailItems, setOrderDetailItems] = useState<OrderItem[]>([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  // Customer info modal state
  const [customerInfoModalVisible, setCustomerInfoModalVisible] =
    useState(false);
  const [shouldResetCustomerInfo, setShouldResetCustomerInfo] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
  });

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

  // Reset shouldResetCustomerInfo flag sau khi đã được sử dụng
  useEffect(() => {
    if (shouldResetCustomerInfo) {
      // Delay một chút để CustomerInfoModal có thời gian xử lý reset
      const timer = setTimeout(() => {
        setShouldResetCustomerInfo(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldResetCustomerInfo]);

  const loadOrderDetail = async () => {
    if (!selectedOrder) {
      console.log("⚠️ No selected order to load details");
      return;
    }

    try {
      setLoading(true);
      console.log("🔄 Loading order detail for:", selectedOrder.id);

      const detail = await ordersService.getOrderDetail(selectedOrder.id);
      console.log("✅ Order detail loaded:", detail);
      console.log(
        "📊 Products in reloaded order:",
        detail.products?.map((p) => ({
          id: p.id,
          name: p.productName,
          quantity: p.quantity,
        }))
      );

      setOrderDetail(detail);

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

  // const formatPrice = (price: number): string => {
  //   return new Intl.NumberFormat("vi-VN").format(price);
  // };

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

    // Xác định handlers phù hợp dựa vào loại đơn hàng
    const updateQuantityHandler = selectedOrder
      ? handleUpdateQuantityExistingOrder
      : onUpdateQuantity;

    const removeItemHandler = selectedOrder
      ? handleRemoveItemExistingOrder
      : onRemoveItem;

    console.log("🔍 renderOrderItem - Handler selection:", {
      hasSelectedOrder: !!selectedOrder,
      updateQuantityHandler: selectedOrder
        ? "handleUpdateQuantityExistingOrder"
        : "onUpdateQuantity",
      removeItemHandler: selectedOrder
        ? "handleRemoveItemExistingOrder"
        : "onRemoveItem",
    });

    return (
      <SwipeableOrderItem
        item={item}
        onUpdateQuantity={updateQuantityHandler}
        onRemoveItem={removeItemHandler}
        isPaid={isOrderPaid}
        order={orderDetail || selectedOrder}
        isExistingOrder={!!selectedOrder}
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

  const handleCustomerInfoSave = (newCustomerInfo: CustomerInfo) => {
    setCustomerInfo(newCustomerInfo);
  };

  // Xử lý tăng giảm số lượng cho đơn hàng hiện có
  const handleUpdateQuantityExistingOrder = async (
    itemId: string,
    value: number
  ) => {
    console.log("🎯 handleUpdateQuantityExistingOrder called with:", {
      itemId,
      value,
      orderId: selectedOrder?.id,
      orderCode: selectedOrder?.code,
      tableId: selectedTable?.id,
      tableName: selectedTable?.name,
      tableStatus: selectedTable?.status,
    });

    if (!selectedOrder || !orderDetail) {
      console.log("⚠️ No selected order or order detail for quantity update");
      return;
    }

    try {
      setLoading(true);

      // Kiểm tra điều kiện có thể cập nhật không
      const canAddResult = ordersService.canAddProductToOrder(orderDetail);
      if (!canAddResult.canAdd) {
        Alert.alert(
          "Không thể cập nhật",
          canAddResult.reason || "Đơn hàng không hợp lệ"
        );
        return;
      }

      // Kiểm tra điều kiện cụ thể
      if (orderDetail.receiveDate) {
        Alert.alert(
          "Không thể cập nhật",
          "Đơn hàng đã thanh toán, không thể thay đổi số lượng"
        );
        return;
      }

      if (orderDetail.sendDate && orderDetail.tuDongXuatKhoBanHang === 1) {
        Alert.alert(
          "Không thể cập nhật",
          "Đơn hàng đã tạm tính và tự động xuất kho, không thể thay đổi"
        );
        return;
      }

      console.log(
        `📈 Updating quantity for item ${itemId} with value: ${value} (treated as changeAmount for existing orders)`
      );

      // Với đơn hàng có sẵn, value sẽ là changeAmount (-1, +1)
      const changeAmount = value;
      await ordersService.updateProductQuantityInOrder(
        selectedOrder.id,
        itemId,
        changeAmount
      );
      console.log("✅ Product quantity updated");

      // Reload order detail để cập nhật UI
      await loadOrderDetail();

      // Trigger refresh ở HomeScreen để cập nhật dữ liệu
      onRefresh?.();
    } catch (error: any) {
      console.error("❌ Error updating quantity:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Không thể cập nhật số lượng sản phẩm"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItemExistingOrder = async (itemId: string) => {
    if (!selectedOrder) {
      console.log("⚠️ No selected order for item removal");
      return;
    }

    try {
      setLoading(true);

      // Kiểm tra điều kiện có thể xóa không
      if (orderDetail?.receiveDate) {
        Alert.alert(
          "Không thể xóa",
          "Đơn hàng đã thanh toán, không thể xóa món"
        );
        return;
      }

      if (orderDetail?.sendDate && orderDetail?.tuDongXuatKhoBanHang === 1) {
        Alert.alert(
          "Không thể xóa",
          "Đơn hàng đã tạm tính và tự động xuất kho, không thể xóa món"
        );
        return;
      }

      console.log(`🗑️ Removing item ${itemId} from order`);
      await ordersService.removeOrderProduct(selectedOrder.id, itemId);

      // Reload order detail để cập nhật UI
      await loadOrderDetail();

      // Trigger refresh ở HomeScreen để cập nhật dữ liệu
      onRefresh?.();
    } catch (error: any) {
      console.error("❌ Error removing item:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Không thể xóa sản phẩm khỏi đơn hàng"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (loading) {
      console.log(
        "⚠️ Order creation already in progress, ignoring duplicate call"
      );
      return;
    }

    if (orderItems.length === 0) {
      Alert.alert("Lỗi", "Chưa có món nào được chọn");
      return;
    }

    try {
      setLoading(true);

      // Chuẩn bị dữ liệu sản phẩm
      const products = orderItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        priceIncludeVAT: item.product.priceAfterDiscount || item.product.price,
        note: "",
        vat: 10,
        name: item.product.title,
        productCode: item.product.code,
        unitName: item.product.unitName || "Cái",
      }));

      // Sử dụng thông tin khách hàng đã lưu hoặc giá trị mặc định
      const finalCustomerName =
        customerInfo.customerName || "Người mua không cung cấp thông tin";
      const finalCustomerPhone = customerInfo.customerPhone || "0000000000";

      // Tạo request
      const orderData: any = {
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        products,
        note: "",
        paymentMethod: 0,
        priceIncludeVAT: true,
        discountType: 0,
        discount: 0,
        discountVAT: 0,
        orderCustomerName: finalCustomerName,
        orderCustomerPhone: finalCustomerPhone,
        isDelivery: false,
        debt: {
          debit: 0,
          debitExpire: new Date().toISOString(),
        },
        delivery: {
          deliveryId: 0,
          deliveryName: "",
          deliveryCode: "",
          deliveryFee: 0,
          cod: false,
        },
        flashSales: [],
      };

      // Chỉ thêm tableId nếu có bàn được chọn
      if (selectedTable?.id) {
        orderData.tableId = selectedTable.id;
      }

      console.log("🍽️ Creating order with data:", orderData);

      const response = await ordersService.createOrder(orderData);

      console.log("📋 Create order response:", response);

      if (response.successful && response.data) {
        Alert.alert(
          "Thành công",
          `Đã tạo đơn hàng ${response.data.code}${
            selectedTable ? ` cho ${selectedTable.name}` : ""
          }`,
          [
            {
              text: "OK",
              onPress: () => {
                // Reset customer info để lần tạo tiếp theo không còn dữ liệu cũ
                setShouldResetCustomerInfo(true);
                setCustomerInfo({
                  customerName: "",
                  customerPhone: "",
                  customerAddress: "",
                });

                onClearOrder?.(); // Xóa giỏ hàng tạm
                onClose();
                // Thông báo cho home.tsx để chuyển tab và refresh
                onOrderCreated?.(response.data!.id);
              },
            },
          ]
        );
      } else {
        throw new Error(response.error || "Không thể tạo đơn hàng");
      }
    } catch (error: any) {
      console.error("❌ Error creating order:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (paymentData: PaymentData) => {
    try {
      if (selectedOrder && orderDetail) {
        // Log payment data for debugging
        console.log("💰 Payment data:", paymentData);

        await ordersService.receiveOrder(orderDetail.id);
        Alert.alert(
          "Thành công",
          `Đã thanh toán đơn hàng\nTiền khách trả: ${paymentData.customerPaid.toLocaleString(
            "vi-VN"
          )}\nTiền thối lại: ${Math.abs(paymentData.change).toLocaleString(
            "vi-VN"
          )}`
        );
        setPaymentModalVisible(false);
        onClose();
        onRefresh?.();
      }
    } catch (error: any) {
      Alert.alert("Lỗi", `Không thể thanh toán đơn hàng: ${error.message}`);
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
            // Logic lưu đơn hàng - gọi hàm tạo đơn hàng mới
            await handleCreateOrder();
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
            // Mở PaymentModal thay vì confirm trực tiếp
            setPaymentModalVisible(true);
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
          // Gọi hàm tạo đơn hàng thực sự
          await handleCreateOrder();
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
              (selectedOrder
                ? "Chi tiết đơn hàng"
                : selectedTable
                ? `Chi tiết - ${selectedTable.name}`
                : "Tạo đơn hàng mới")}
          </Text>
          <View style={styles.headerActions}>
            {/* Customer Info Icon - Only show for new orders */}
            {!selectedOrder && (
              <TouchableOpacity
                style={styles.customerInfoButton}
                onPress={() => setCustomerInfoModalVisible(true)}
              >
                <Ionicons name="person-add" size={20} color="#198754" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#198754" />
            <Text style={styles.loadingText}>
              Đang tải chi tiết đơn hàng...
            </Text>
          </View>
        ) : (
          <View style={styles.contentContainer}>
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
                showsVerticalScrollIndicator={true}
                bounces={true}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                removeClippedSubviews={false}
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
          </View>
        )}

        {/* Payment Modal */}
        <PaymentModal
          visible={paymentModalVisible}
          totalAmount={totalAmount}
          onClose={() => setPaymentModalVisible(false)}
          onPayment={handlePayment}
        />

        {/* Customer Info Modal */}
        <CustomerInfoModal
          visible={customerInfoModalVisible}
          initialData={customerInfo}
          onClose={() => setCustomerInfoModalVisible(false)}
          onSave={handleCustomerInfoSave}
          shouldReset={shouldResetCustomerInfo}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  contentContainer: {
    flex: 1,
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
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customerInfoButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#198754",
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
    flexGrow: 1,
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
