import {
  CreateOrderRequest,
  OrderProductRequest,
  ordersService,
  Product,
  Table,
} from "@/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

interface CreateOrderModalProps {
  visible: boolean;
  table: Table | null;
  orderItems: OrderItem[];
  onClose: () => void;
  onOrderCreated?: (orderId: string) => void;
  onClearOrder?: () => void;
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  visible,
  table,
  orderItems,
  onClose,
  onOrderCreated,
  onClearOrder,
}) => {
  const insets = useSafeAreaInsets();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(0); // 0=Tiền mặt, 1=Chuyển khoản
  const [priceIncludeVAT, setPriceIncludeVAT] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    // Reset form
    setCustomerName("");
    setCustomerPhone("");
    setNote("");
    setPaymentMethod(0);
    setPriceIncludeVAT(true);
    onClose();
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      const itemPrice = priceIncludeVAT
        ? item.product.priceAfterDiscount || item.product.price
        : item.price;
      return total + itemPrice * item.quantity;
    }, 0);
  };

  const handleCreateOrder = async () => {
    if (!table) {
      Alert.alert("Lỗi", "Chưa chọn bàn");
      return;
    }

    if (orderItems.length === 0) {
      Alert.alert("Lỗi", "Chưa có món nào được chọn");
      return;
    }

    if (!customerName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên khách hàng");
      return;
    }

    try {
      setLoading(true);

      // Chuẩn bị dữ liệu sản phẩm
      const products: OrderProductRequest[] = orderItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price, // Giá gốc trước thuế
        priceIncludeVAT: item.product.priceAfterDiscount || item.product.price, // Giá sau thuế/giảm giá
        note: "", // Có thể thêm ghi chú cho từng món
        vat: 10, // Mặc định 10% VAT, có thể lấy từ category
      }));

      // Tạo request
      const orderData: CreateOrderRequest = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        tableId: table.id,
        products,
        note: note.trim() || undefined,
        paymentMethod,
        priceIncludeVAT,
        discountType: 0, // Không giảm giá
        discount: 0,
        discountVAT: 0,
      };

      console.log("🍽️ Creating order with data:", orderData);

      const response = await ordersService.createOrder(orderData);

      if (response.successful && response.data) {
        Alert.alert(
          "Thành công",
          `Đã tạo đơn hàng ${response.data.code} cho ${table.name}`,
          [
            {
              text: "OK",
              onPress: () => {
                onOrderCreated?.(response.data!.id);
                onClearOrder?.(); // Xóa giỏ hàng tạm
                handleClose();
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const renderOrderItem = ({ item }: { item: OrderItem }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderItemInfo}>
        <Text style={styles.orderItemName}>{item.title}</Text>
        <Text style={styles.orderItemPrice}>
          {formatPrice(
            priceIncludeVAT
              ? item.product.priceAfterDiscount || item.product.price
              : item.price
          )}{" "}
          x {item.quantity}
        </Text>
      </View>
      <Text style={styles.orderItemTotal}>
        {formatPrice(
          (priceIncludeVAT
            ? item.product.priceAfterDiscount || item.product.price
            : item.price) * item.quantity
        )}
      </Text>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Tạo đơn hàng</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Table Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin bàn</Text>
            <View style={styles.tableInfo}>
              <Ionicons name="restaurant" size={20} color="#198754" />
              <Text style={styles.tableName}>{table?.name}</Text>
            </View>
          </View>

          {/* Customer Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
            <TextInput
              style={styles.input}
              placeholder="Tên khách hàng *"
              value={customerName}
              onChangeText={setCustomerName}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại (tùy chọn)"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              keyboardType="phone-pad"
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ghi chú đơn hàng"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            <View style={styles.paymentMethods}>
              <TouchableOpacity
                style={[
                  styles.paymentButton,
                  paymentMethod === 0 && styles.paymentButtonActive,
                ]}
                onPress={() => setPaymentMethod(0)}
              >
                <Ionicons
                  name="cash"
                  size={20}
                  color={paymentMethod === 0 ? "#fff" : "#666"}
                />
                <Text
                  style={[
                    styles.paymentButtonText,
                    paymentMethod === 0 && styles.paymentButtonTextActive,
                  ]}
                >
                  Tiền mặt
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.paymentButton,
                  paymentMethod === 1 && styles.paymentButtonActive,
                ]}
                onPress={() => setPaymentMethod(1)}
              >
                <Ionicons
                  name="card"
                  size={20}
                  color={paymentMethod === 1 ? "#fff" : "#666"}
                />
                <Text
                  style={[
                    styles.paymentButtonText,
                    paymentMethod === 1 && styles.paymentButtonTextActive,
                  ]}
                >
                  Chuyển khoản
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* VAT Option */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.vatOption}
              onPress={() => setPriceIncludeVAT(!priceIncludeVAT)}
            >
              <View style={styles.vatOptionLeft}>
                <Ionicons
                  name={priceIncludeVAT ? "checkbox" : "square-outline"}
                  size={20}
                  color={priceIncludeVAT ? "#198754" : "#666"}
                />
                <Text style={styles.vatOptionText}>Giá đã bao gồm VAT</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Order Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Danh sách món ({orderItems.length})
            </Text>
            <FlatList
              data={orderItems}
              renderItem={renderOrderItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Total */}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
              <Text style={styles.totalAmount}>
                {formatPrice(calculateTotal())}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[
              styles.createButton,
              loading && styles.createButtonDisabled,
            ]}
            onPress={handleCreateOrder}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.createButtonText}>Tạo đơn hàng</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 12,
  },
  tableInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  tableName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#198754",
    marginLeft: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  paymentMethods: {
    flexDirection: "row",
    gap: 12,
  },
  paymentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  paymentButtonActive: {
    backgroundColor: "#198754",
    borderColor: "#198754",
  },
  paymentButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginLeft: 8,
  },
  paymentButtonTextActive: {
    color: "#fff",
  },
  vatOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vatOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  vatOptionText: {
    fontSize: 16,
    color: "#212529",
    marginLeft: 8,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f4",
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#212529",
  },
  orderItemPrice: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  orderItemTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#198754",
  },
  totalSection: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 100,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#198754",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#198754",
    paddingVertical: 16,
    borderRadius: 8,
  },
  createButtonDisabled: {
    backgroundColor: "#adb5bd",
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
});

export default CreateOrderModal;
