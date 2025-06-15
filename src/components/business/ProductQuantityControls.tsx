import { buttonVisibilityService } from "@/src/services/buttonVisibilityService";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type QuantityUpdateMode = "absolute" | "change";

interface ProductQuantityControlsProps {
  item: any;
  order?: any;
  onUpdateQuantity?: (itemId: string, value: number) => void;
  onRemoveItem?: (itemId: string) => void;
  isPaid: boolean;
  showAsReadOnly?: boolean;
  mode?: QuantityUpdateMode; // "absolute" cho đơn mới, "change" cho đơn có sẵn
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
  mode = "absolute", // Default là absolute để không break existing code
}) => {
  // Đảm bảo order không undefined để tránh lỗi
  const safeOrder = order || {};
  const productVisibility = buttonVisibilityService.getProductButtonVisibility(
    item,
    safeOrder
  );

  console.log("🔧 ProductQuantityControls - State:", {
    itemId: item.id,
    quantity: item.quantity,
    mode,
    isPaid,
    showAsReadOnly,
    updateQuantity: productVisibility.updateQuantity,
    removeProduct: productVisibility.removeProduct,
    hasUpdateHandler: !!onUpdateQuantity,
    hasRemoveHandler: !!onRemoveItem,
  });

  const handleIncreaseQuantity = () => {
    console.log("🔼 Increase quantity button pressed, mode:", mode);
    if (productVisibility.updateQuantity && onUpdateQuantity) {
      if (mode === "change") {
        // Truyền +1 để tăng số lượng (cho đơn hàng có sẵn)
        onUpdateQuantity(item.id, +1);
      } else {
        // Truyền newQuantity (cho đơn hàng mới)
        onUpdateQuantity(item.id, item.quantity + 1);
      }
    } else {
      console.log(
        "⚠️ Increase blocked - updateQuantity:",
        productVisibility.updateQuantity,
        "hasHandler:",
        !!onUpdateQuantity
      );
    }
  };

  const handleDecreaseQuantity = () => {
    console.log("🔽 Decrease quantity button pressed, mode:", mode);
    if (!productVisibility.updateQuantity) {
      console.log(
        "⚠️ Decrease blocked - updateQuantity permission:",
        productVisibility.updateQuantity
      );
      return;
    }

    if (item.quantity > 1 && onUpdateQuantity) {
      if (mode === "change") {
        // Truyền -1 để giảm số lượng (cho đơn hàng có sẵn)
        console.log("🔽 Sending changeAmount: -1");
        onUpdateQuantity(item.id, -1);
      } else {
        // Truyền newQuantity (cho đơn hàng mới)
        console.log("🔽 Sending newQuantity:", item.quantity - 1);
        onUpdateQuantity(item.id, item.quantity - 1);
      }
    } else if (productVisibility.removeProduct && onRemoveItem) {
      console.log("🗑️ Remove item button pressed");
      onRemoveItem(item.id);
    } else {
      console.log(
        "⚠️ Decrease/Remove blocked - quantity:",
        item.quantity,
        "removeProduct:",
        productVisibility.removeProduct,
        "hasRemoveHandler:",
        !!onRemoveItem
      );
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
        onPress={() => {
          console.log("👆 Decrease TouchableOpacity pressed");
          handleDecreaseQuantity();
        }}
        disabled={!productVisibility.updateQuantity}
      >
        <Ionicons
          name={item.quantity === 1 ? "remove" : "remove"}
          size={16}
          color={productVisibility.updateQuantity ? "#dc3545" : "#ccc"}
        />
      </TouchableOpacity>

      <Text style={styles.quantityText}>{item.quantity}</Text>

      <TouchableOpacity
        style={styles.quantityButton}
        onPress={() => {
          console.log("👆 Increase TouchableOpacity pressed");
          handleIncreaseQuantity();
        }}
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
