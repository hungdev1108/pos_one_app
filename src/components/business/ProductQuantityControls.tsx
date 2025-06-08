import { buttonVisibilityService } from "@/src/services/buttonVisibilityService";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ProductQuantityControlsProps {
  item: any;
  order?: any;
  onUpdateQuantity?: (itemId: string, newQuantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
  isPaid: boolean;
  showAsReadOnly?: boolean;
}

export const ProductQuantityControls: React.FC<
  ProductQuantityControlsProps
> = ({
  item,
  order,
  onUpdateQuantity,
  onRemoveItem,
  isPaid,
  showAsReadOnly = false,
}) => {
  // Đảm bảo order không undefined để tránh lỗi
  const safeOrder = order || {};
  const productVisibility = buttonVisibilityService.getProductButtonVisibility(
    item,
    safeOrder
  );

  const handleIncreaseQuantity = () => {
    if (productVisibility.updateQuantity && onUpdateQuantity) {
      onUpdateQuantity(item.id, item.quantity + 1);
    }
  };

  const handleDecreaseQuantity = () => {
    if (!productVisibility.updateQuantity) return;

    if (item.quantity > 1 && onUpdateQuantity) {
      onUpdateQuantity(item.id, item.quantity - 1);
    } else if (productVisibility.removeProduct && onRemoveItem) {
      onRemoveItem(item.id);
    }
  };

  // Hiển thị read-only quantity
  if (showAsReadOnly || isPaid || !productVisibility.updateQuantity) {
    return (
      <View style={styles.quantityDisplayOnly}>
        <Text style={styles.quantityText}>SL: {item.quantity}</Text>
      </View>
    );
  }

  // Hiển thị interactive controls
  return (
    <View style={styles.quantityControls}>
      <TouchableOpacity
        style={styles.quantityButton}
        onPress={handleDecreaseQuantity}
        disabled={!productVisibility.updateQuantity}
      >
        <Ionicons
          name={item.quantity === 1 ? "trash-outline" : "remove"}
          size={16}
          color={productVisibility.updateQuantity ? "#dc3545" : "#ccc"}
        />
      </TouchableOpacity>

      <Text style={styles.quantityText}>{item.quantity}</Text>

      <TouchableOpacity
        style={styles.quantityButton}
        onPress={handleIncreaseQuantity}
        disabled={!productVisibility.updateQuantity}
      >
        <Ionicons
          name="add"
          size={16}
          color={productVisibility.updateQuantity ? "#198754" : "#ccc"}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    paddingHorizontal: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    margin: 2,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: "center",
  },
  quantityDisplayOnly: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
});

export default ProductQuantityControls;
