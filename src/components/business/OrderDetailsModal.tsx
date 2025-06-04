import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  Modal,
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

interface OrderDetailsModalProps {
  visible: boolean;
  orderItems: OrderItem[];
  onClose: () => void;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
}

export default function OrderDetailsModal({
  visible,
  orderItems,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
}: OrderDetailsModalProps) {
  const insets = useSafeAreaInsets();

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleIncreaseQuantity = (itemId: string, currentQuantity: number) => {
    onUpdateQuantity(itemId, currentQuantity + 1);
  };

  const handleDecreaseQuantity = (itemId: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      onUpdateQuantity(itemId, currentQuantity - 1);
    } else {
      onRemoveItem(itemId);
    }
  };

  const renderOrderItem = ({ item }: { item: OrderItem }) => {
    const itemTotal = item.price * item.quantity;

    return (
      <View style={styles.orderItem}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
        </View>

        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleDecreaseQuantity(item.id, item.quantity)}
          >
            <Ionicons
              name={item.quantity === 1 ? "trash-outline" : "remove"}
              size={16}
              color="#198754"
            />
          </TouchableOpacity>

          <Text style={styles.quantityText}>{item.quantity}</Text>

          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleIncreaseQuantity(item.id, item.quantity)}
          >
            <Ionicons name="add" size={16} color="#198754" />
          </TouchableOpacity>
        </View>

        <View style={styles.itemTotalContainer}>
          <Text style={styles.itemTotal}>{formatPrice(itemTotal)}</Text>
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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            {totalItems} món • {formatPrice(totalAmount)}
          </Text>
        </View>

        {/* Order Items List */}
        <FlatList
          data={orderItems}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          style={styles.itemsList}
          contentContainerStyle={styles.itemsListContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalAmount}>{formatPrice(totalAmount)}</Text>
          </View>

          <TouchableOpacity style={styles.checkoutButton}>
            <Text style={styles.checkoutButtonText}>Thanh toán</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  summaryContainer: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  summaryText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  itemsList: {
    flex: 1,
  },
  itemsListContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
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
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#198754",
  },
  checkoutButton: {
    backgroundColor: "#198754",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});
