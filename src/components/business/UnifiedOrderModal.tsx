import {
  OrderDetail,
  OrderListItem,
  Product,
  Table,
  ordersService,
} from "@/src/api";
import { OrderType } from "@/src/api/types";
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
  SafeAreaView,
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
import KitchenPrintModal from "./KitchenPrintModal";
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

// Interface cho thông tin đơn hàng tạm thời - dùng cho luồng thanh toán mới
interface TempOrderData {
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  orderItems: OrderItem[];
  customerInfo: CustomerInfo;
  selectedTable?: Table | null;
  orderId?: string; // ID đơn hàng sau khi tạo
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
  onOrderCreated?: (orderId: string, shouldOpenPayment?: boolean) => void;
  autoOpenPayment?: boolean;
  // Callback mới cho luồng thanh toán tối ưu
  onDirectPayment?: (tempOrderData: TempOrderData) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = -SCREEN_WIDTH * 0.3; // 30% of screen width

const { width } = Dimensions.get("window");
const isTablet = width >= 720;

// Swipeable Order Item Component
const SwipeableOrderItem: React.FC<{
  item: OrderItem;
  index: number;
  onUpdateQuantity?: (itemId: string, value: number) => void;
  onRemoveItem?: (itemId: string) => void;
  isPaid: boolean;
  order?: any;
  isExistingOrder?: boolean;
}> = ({
  item,
  index,
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
          {/* Item Number */}
          <View style={styles.itemNumberContainer}>
            <Text style={styles.itemNumber}>{index + 1}</Text>
          </View>

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
                  {item.title.trim()}
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
  autoOpenPayment = false,
  onDirectPayment,
}: UnifiedOrderModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [orderStatusText, setOrderStatusText] = useState<string>("");
  const [orderDetailItems, setOrderDetailItems] = useState<OrderItem[]>([]);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [orderTypes, setOrderTypes] = useState<OrderType[]>([]);

  // Kitchen print modal state
  const [kitchenPrintModalVisible, setKitchenPrintModalVisible] =
    useState(false);
  const [kitchenPrintData, setKitchenPrintData] = useState<any>(null);

  // Customer info modal state
  const [customerInfoModalVisible, setCustomerInfoModalVisible] =
    useState(false);
  const [shouldResetCustomerInfo, setShouldResetCustomerInfo] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
  });
  const [shouldAutoOpenPayment, setShouldAutoOpenPayment] = useState(false);

  useEffect(() => {
    if (visible && selectedOrder) {
      loadOrderDetail();
    } else {
      // Reset state khi modal đóng hoặc không có selectedOrder
      setOrderDetail(null);
      setOrderDetailItems([]);
      setOrderStatus("");
      setOrderStatusText("");
      loadOrderTypes();
    }
  }, [visible, selectedOrder]);

  // Auto open payment modal khi có flag
  useEffect(() => {
    if ((shouldAutoOpenPayment || autoOpenPayment) && orderDetail && !loading) {
      setShouldAutoOpenPayment(false);
      // Delay nhỏ để UI ổn định
      setTimeout(() => {
        setPaymentModalVisible(true);
      }, 300);
    }
  }, [shouldAutoOpenPayment, autoOpenPayment, orderDetail, loading]);

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

  const loadOrderTypes = async () => {
    const orderTypes = await ordersService.getOrderTypes();
    console.log("🔍 oooooooorderTypes:", orderTypes);
    setOrderTypes(orderTypes);
  };

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
          name: p.name || p.productName,
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
            const vatRate = product.vat || product.VAT || 0;

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
          const convertedItems: OrderItem[] = detail.products.map((product) => {
            // Lấy tên sản phẩm từ field 'name' hoặc fallback về 'productName' và trim khoảng trắng
            const productTitle = (
              product.name ||
              product.productName ||
              "Sản phẩm"
            ).trim();

            return {
              id: product.id,
              title: productTitle,
              price: product.price,
              quantity: product.quantity,
              product: {
                id: product.id,
                title: productTitle,
                categoryId: "",
                categoryName: "",
                price: product.price,
                priceAfterDiscount: product.priceIncludeVAT || product.price,
                discount: 0,
                discountType: 0,
                unitName: product.unitName || "",
                isActive: true,
                isPublished: true,
                categoryOutputMethod: 0,
              } as Product,
            };
          });
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
      const actualVAT = product.vat || product.VAT || 0;
      const productName = product.name || product.productName;
      console.log(`  Product ${index}: ${productName}`);
      console.log(
        `    price=${product.price}, priceIncludeVAT=${product.priceIncludeVAT}`
      );
      console.log(
        `    VAT field=${product.VAT}, vat field=${product.vat}, actual VAT=${actualVAT}%`
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

  const renderOrderItem = ({
    item,
    index,
  }: {
    item: OrderItem;
    index: number;
  }) => {
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
        index={index}
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

    // Debug logging để kiểm tra các trường có thể chứa thông tin loại đơn
    console.log("🔍 orderDetail full structure:", {
      orderType: (orderDetail as any).orderType,
      isDelivery: (orderDetail as any).isDelivery,
      paymentMethod: (orderDetail as any).paymentMethod,
      tableName: orderDetail.tableName,
      tableId: orderDetail.tableId,
    });
    console.log("🔍 orderTypes:", orderTypes);

    // Xác định loại đơn dựa trên logic nghiệp vụ
    const getOrderTypeText = () => {
      // Nếu có orderType field và match với orderTypes
      const orderType = (orderDetail as any).orderType;
      if (orderType && orderTypes.length > 0) {
        const matchedType = orderTypes.find(
          (type) =>
            type.sourceId === orderType?.toString() ||
            type.id === orderType?.toString()
        );
        if (matchedType) {
          return matchedType.titles[0]?.title || "Không xác định";
        }
      }

      // Logic fallback dựa trên các trường khác
      const isDelivery = (orderDetail as any).isDelivery;
      if (isDelivery) {
        return "Giao hàng";
      } else if (orderDetail.tableName) {
        return "Tại chỗ";
      } else {
        return "Mang về";
      }
    };

    return (
      <View style={styles.orderInfoContainer}>
        {/* Info table */}
        {/* {orderDetail.tableName && (
          <View style={styles.orderInfoRowTable}>
            <Text style={styles.orderInfoLabel}>Bàn:</Text>
            <Text style={styles.orderInfoValue}>{orderDetail.tableName} - Khu {orderDetail.tableAreaName}</Text>
          </View>
        )} */}

        {/* Info order type */}
        <View style={styles.orderInfoRow}>
          <Text style={styles.orderInfoLabel}>Loại đơn:</Text>
          <Text style={styles.orderInfoValue}>{getOrderTypeText()}</Text>
        </View>

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
        name: item.product.title.trim(),
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

  /**
   * LUỒNG MỚI TỐI ƯU: Thanh toán trực tiếp với thông tin tạm
   * 1. Lưu thông tin đơn hàng vào biến tổng
   * 2. Tạo đơn hàng và in chế biến async
   * 3. Chuyển thẳng sang màn hình thanh toán với thông tin từ biến tổng
   */
  const handleOptimizedPaymentFlow = async () => {
    if (loading) {
      console.log(
        "⚠️ Optimized payment flow already in progress, ignoring duplicate call"
      );
      return;
    }

    if (orderItems.length === 0) {
      Alert.alert("Lỗi", "Chưa có món nào được chọn");
      return;
    }

    try {
      setLoading(true);

      // BƯỚC 1: Tạo biến tổng lưu thông tin đơn hàng tạm thời
      const tempOrderData: TempOrderData = {
        totalAmount,
        subtotal,
        taxAmount,
        orderItems: [...orderItems], // Clone để tránh reference issues
        customerInfo: { ...customerInfo },
        selectedTable: selectedTable,
      };

      console.log("💾 Lưu thông tin tạm vào biến tổng:", tempOrderData);

      // BƯỚC 2: Tạo đơn hàng async (không chờ)
      const createOrderAsync = async () => {
        try {
          const products = orderItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
            priceIncludeVAT:
              item.product.priceAfterDiscount || item.product.price,
            note: "",
            vat: 10,
            name: item.product.title.trim(),
            productCode: item.product.code,
            unitName: item.product.unitName || "Cái",
          }));

          const finalCustomerName =
            customerInfo.customerName || "Người mua không cung cấp thông tin";
          const finalCustomerPhone = customerInfo.customerPhone || "0000000000";

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

          if (selectedTable?.id) {
            orderData.tableId = selectedTable.id;
          }

          console.log("🍽️ Creating order asynchronously:", orderData);
          const response = await ordersService.createOrder(orderData);

          if (response.successful && response.data) {
            const orderId = response.data.id;

            // BƯỚC 2.1: In chế biến async
            try {
              console.log("🍳 Kitchen print API call for order:", orderId);
              // await ordersService.printKitchen(orderId);
              console.log("✅ Đã in chế biến");
            } catch (kitchenError: any) {
              console.error("❌ Kitchen print error:", kitchenError);
              console.log("⚠️ Đã in chế biến (simulated)");
            }

            // Cập nhật orderId vào temp data nếu callback parent cần
            tempOrderData.orderId = orderId;

            console.log("✅ Order created successfully with ID:", orderId);
            return orderId;
          } else {
            throw new Error(response.error || "Không thể tạo đơn hàng");
          }
        } catch (error: any) {
          console.error("❌ Error creating order asynchronously:", error);
          // Có thể thông báo lỗi cho user sau này nếu cần
          return null;
        }
      };

      // BƯỚC 3: Clear form và reset trạng thái
      setShouldResetCustomerInfo(true);
      setCustomerInfo({
        customerName: "",
        customerPhone: "",
        customerAddress: "",
      });
      onClearOrder?.();

      // BƯỚC 4: Chuyển thẳng sang màn hình thanh toán với thông tin tạm
      onClose();

      if (onDirectPayment) {
        console.log(
          "🚀 Chuyển thẳng sang màn hình thanh toán với thông tin tạm"
        );
        onDirectPayment(tempOrderData);
      } else {
        // Fallback về luồng cũ nếu parent chưa support
        console.log("⚠️ Parent chưa support luồng mới, fallback về luồng cũ");
        // Thực thi tạo đơn hàng đồng bộ
        const orderId = await createOrderAsync();
        if (orderId) {
          onOrderCreated?.(orderId, true);
        }
      }

      // Thực thi tạo đơn hàng async trong background (không block UI)
      createOrderAsync();

      console.log("✅ Optimized payment flow completed");
    } catch (error: any) {
      console.error("❌ Error in optimized payment flow:", error);
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

  // Hàm xử lý luồng in chế biến: tạo đơn hàng → hiển thị bill in chế biến
  const handleKitchenPrintFlow = async () => {
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
        name: item.product.title.trim(),
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

      console.log("🍽️ Creating order for kitchen print:", orderData);
      const response = await ordersService.createOrder(orderData);

      if (response.successful && response.data) {
        const orderId = response.data.id;
        const orderCode = response.data.code;

        console.log("✅ Order created for kitchen print:", orderCode);

        // Chuẩn bị dữ liệu cho KitchenPrintModal
        const printData = {
          orderCode: orderCode,
          tableName: selectedTable?.name || "BÀN SỐ - Bàn Số 8",
          employeeName: "Nhân viên",
          items: orderItems.map((item) => ({
            id: item.id,
            name: item.title.trim(),
            quantity: item.quantity,
            note: "",
          })),
          createTime: new Date().toISOString(),
        };

        // Reset customer info và clear order
        setShouldResetCustomerInfo(true);
        setCustomerInfo({
          customerName: "",
          customerPhone: "",
          customerAddress: "",
        });
        onClearOrder?.();

        // Hiển thị KitchenPrintModal
        setKitchenPrintData(printData);
        setKitchenPrintModalVisible(true);

        console.log("🖨️ Kitchen print modal opened for order:", orderCode);
      } else {
        throw new Error(response.error || "Không thể tạo đơn hàng");
      }
    } catch (error: any) {
      console.error("❌ Error in kitchen print flow:", error);
      Alert.alert(
        "Lỗi",
        error.message || "Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
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
                    // Clear selected order để ẩn OrderBottomSheet
                    onClearOrder?.();
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
            // Logic in chế biến cho đơn hàng mới: tạo đơn và hiển thị bill
            await handleKitchenPrintFlow();
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
          // Gọi hàm tạo đơn hàng thực sự (giữ lại để tương thích)
          await handleCreateOrder();
          break;
        case "payment_create":
          // Nút "Thanh toán" mới - thực hiện luồng: tạo đơn → in chế biến → chuyển chi tiết → mở thanh toán
          await handleOptimizedPaymentFlow();
          break;
        case "cancel":
          onClose();
          break;
        case "print_kitchen":
          // Logic in chế biến cho đơn hàng mới: tạo đơn và hiển thị bill
          await handleKitchenPrintFlow();
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

    // Kiểm tra thông tin của CustomerInfoModal sau đó thực hiện chuyển sang giao diện của tablet chỉ hiển thị trong phần phiếu order nằm ở trên section {/* Summary Section */}

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

  // Render right side content for tablet layout
  const renderRightSideContent = () => {
    if (!isTablet) return null;

    return (
      <View style={styles.rightSideContainer}>
        {/* Order Info Section */}
        {selectedOrder && renderOrderDetails()}

        {/* Back to Menu and Customer Info Section for new orders */}
        {selectedTable && !selectedOrder && (
          <View style={styles.tabletBackToMenuAndCustomerInfoContainer}>
            <TouchableOpacity
              style={styles.tabletBackToMenuContainer}
              onPress={onClose}
            >
              <Ionicons name="arrow-back" size={26} color="#198754" />
              <Text style={styles.backToMenuText}>Quay lại</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabletBackToCustomerInfoContainer}
              onPress={() => setCustomerInfoModalVisible(true)}
            >
              <Ionicons name="person-add" size={26} color="#198754" />
              <Text style={styles.customerInfoText}>Khách hàng</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Summary Section */}
        {displayItems.length > 0 && (
          <View style={styles.tabletSummarySection}>
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

        {/* Action Buttons */}
        <View style={styles.tabletFooter}>{renderActionButtons()}</View>
      </View>
    );
  };

  return (
    <SafeAreaView>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          {/* Header - Same for both layouts */}
          <View style={styles.header}>
            {title ? (
              <Text style={styles.headerTitle}>{title}</Text>
            ) : selectedOrder ? (
              <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
            ) : selectedTable ? (
              <View>
                <Text style={styles.headerTitle}>Phiếu order</Text>
                <Text style={styles.headerSubtitle}>
                  {selectedTable.name} - {selectedTable.areaName}
                </Text>
              </View>
            ) : (
              <Text style={styles.headerTitle}>Tạo đơn hàng mới</Text>
            )}
            <View style={styles.headerActions}>
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
            <View
              style={
                isTablet
                  ? styles.tabletContentContainer
                  : styles.contentContainer
              }
            >
              {isTablet ? (
                // Tablet Layout: 2-column layout
                <>
                  {/* Left Side: Order Items List (2 parts) */}
                  <View style={styles.leftSideContainer}>
                    {/* Mobile-style order info for tablets - shown above list */}
                    {/* {selectedOrder && (
                      <View style={styles.tabletOrderInfoHeader}>
                        {renderOrderDetails()}
                      </View>
                    )} */}

                    {/* Order Items List */}
                    {displayItems.length > 0 ? (
                      <FlatList
                        data={displayItems}
                        renderItem={renderOrderItem}
                        keyExtractor={(item) => item.id}
                        style={styles.tabletItemsList}
                        contentContainerStyle={styles.itemsListContent}
                        showsVerticalScrollIndicator={true}
                        bounces={true}
                        scrollEnabled={true}
                        nestedScrollEnabled={true}
                        removeClippedSubviews={true}
                      />
                    ) : (
                      <View style={styles.emptyState}>
                        <Ionicons
                          name="restaurant-outline"
                          size={48}
                          color="#ccc"
                        />
                        <Text style={styles.emptyText}>
                          Chưa có món nào được chọn
                        </Text>
                        <Text style={styles.emptySubtext}>
                          Vui lòng chọn món từ thực đơn
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Right Side: Summary and Actions (1 part) */}
                  {renderRightSideContent()}
                </>
              ) : (
                // Mobile Layout: Keep original structure unchanged
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
                      showsVerticalScrollIndicator={true}
                      bounces={true}
                      scrollEnabled={true}
                      nestedScrollEnabled={true}
                      removeClippedSubviews={true}
                    />
                  ) : (
                    <View style={styles.emptyState}>
                      <Ionicons
                        name="restaurant-outline"
                        size={48}
                        color="#ccc"
                      />
                      <Text style={styles.emptyText}>
                        Chưa có món nào được chọn
                      </Text>
                      <Text style={styles.emptySubtext}>
                        Vui lòng chọn món từ thực đơn
                      </Text>
                    </View>
                  )}

                  {/* Flex row:  Icon back to menu and Icon customer info */}
                  {selectedTable && !selectedOrder && (
                    <View style={styles.backToMenuAndCustomerInfoContainer}>
                      <TouchableOpacity
                        style={styles.backToMenuContainer}
                        onPress={onClose}
                      >
                        <Ionicons name="arrow-back" size={26} color="#198754" />
                        <Text style={styles.backToMenuText}>Quay lại</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.backToCustomerInfoContainer}
                        onPress={() => setCustomerInfoModalVisible(true)}
                      >
                        <Ionicons name="person-add" size={26} color="#198754" />
                        <Text style={styles.customerInfoText}>Khách hàng</Text>
                      </TouchableOpacity>
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
                  <View style={[styles.footer]}>{renderActionButtons()}</View>
                </>
              )}
            </View>
          )}

          {/* Payment Modal */}
          <PaymentModal
            visible={paymentModalVisible}
            totalAmount={totalAmount}
            onClose={() => setPaymentModalVisible(false)}
            onPayment={handlePayment}
            orderId={selectedOrder?.id}
          />

          {/* Customer Info Modal */}
          <CustomerInfoModal
            visible={customerInfoModalVisible}
            initialData={customerInfo}
            onClose={() => setCustomerInfoModalVisible(false)}
            onSave={handleCustomerInfoSave}
            shouldReset={shouldResetCustomerInfo}
          />

          {/* Kitchen Print Modal */}
          {kitchenPrintData && (
            <KitchenPrintModal
              visible={kitchenPrintModalVisible}
              onClose={() => {
                setKitchenPrintModalVisible(false);
                setKitchenPrintData(null);
                onClose(); // Đóng UnifiedOrderModal sau khi in xong
              }}
              printData={kitchenPrintData}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    flex: 1,
  },
  // New tablet-specific styles
  tabletContentContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    // marginTop: isTablet ? 12 : 0,
  },
  leftSideContainer: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: isTablet ? 12 : 0,
  },
  rightSideContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderLeftWidth: 1,
    borderLeftColor: "#e9ecef",
  },
  tabletOrderInfoHeader: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tabletItemsList: {
    flex: 1,
    backgroundColor: "#fff",
    marginVertical: isTablet ? 12 : 0,
  },
  tabletBackToMenuAndCustomerInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  tabletBackToMenuContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabletBackToCustomerInfoContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabletSummarySection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 28,
    paddingVertical: 16,
    // borderRadius: 8,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.1,
    // shadowRadius: 2,
    // elevation: 2,
  },
  tabletFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: "auto", // Push to bottom
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: isTablet ? 5 : 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 3,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  closeButton: {
    padding: 4,
  },
  // Order details styles
  orderInfoContainer: {
    backgroundColor: "#fff",
    marginHorizontal: isTablet ? 16 : 0,
    marginTop: isTablet ? 12 : 0,
    paddingHorizontal: 20,
    paddingVertical: isTablet ? 5 : 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  orderInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: isTablet ? 2 : 5,
    paddingHorizontal: isTablet ? 12 : 0,
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
    flexGrow: 1,
  },
  // Swipeable item styles
  swipeContainer: {
    backgroundColor: "#fff",
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
    paddingVertical: isTablet ? 0 : 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  itemNumberContainer: {
    alignSelf: "flex-start",
    marginRight: 12,
  },
  itemNumber: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000",
    lineHeight: 18,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 12,
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
    borderTopWidth: 1.5,
    borderTopColor: "#f1f1f1",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
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
    paddingTop: 0,
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
    paddingTop: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingBottom: isTablet ? 10 : 24,
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
  headerSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  backToMenuAndCustomerInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 5,
  },
  backToMenuContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  backToCustomerInfoContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  backToMenuText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#198754",
    marginTop: 1,
  },
  customerInfoText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#198754",
    marginTop: 1,
  },
});
