import {
  ButtonVisibility,
  buttonVisibilityService,
  OrderMode,
  orderValidationService,
} from "@/src/services/buttonVisibilityService";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface OrderActionButtonsProps {
  order?: any;
  mode: OrderMode;
  products?: any[];
  onAction: (action: string) => void;
}

export const OrderActionButtons: React.FC<OrderActionButtonsProps> = ({
  order,
  mode,
  products,
  onAction,
}) => {
  const buttonVisibility = buttonVisibilityService.getOrderButtonVisibility(
    order,
    mode,
    products
  );
  const orderStatus = buttonVisibilityService.getOrderStatus(order);

  const handleActionPress = (action: string) => {
    const validation = orderValidationService.canExecuteAction(order, action);
    if (!validation.can) {
      // Có thể hiển thị Alert hoặc Toast ở đây
      console.warn(validation.reason);
      return;
    }
    onAction(action);
  };

  const renderButton = (
    key: keyof ButtonVisibility,
    actionKey: string,
    title: string,
    iconName: string,
    style: any = styles.primaryButton,
    textStyle: any = styles.actionButtonText
  ) => {
    if (!buttonVisibility[key]) return null;

    return (
      <TouchableOpacity
        key={actionKey}
        style={[styles.actionButton, style]}
        onPress={() => handleActionPress(actionKey)}
      >
        <Ionicons
          name={iconName as any}
          size={16}
          color={textStyle.color || "#fff"}
        />
        <Text style={textStyle}>{title}</Text>
      </TouchableOpacity>
    );
  };

  const renderCreateModeButtons = () => {
    const buttons = [];

    // Buttons cho Create Mode - theo thứ tự mới: Hủy, In chế biến, Thanh toán
    buttons.push(
      renderButton(
        "cancel",
        "cancel",
        "Hủy",
        "close-circle",
        styles.dangerButton
      )
    );

    buttons.push(
      renderButton(
        "printKitchen",
        "print_kitchen",
        "In chế biến",
        "restaurant",
        styles.secondaryButton
      )
    );

    // Đổi nút "Lưu" thành "Thanh toán"
    buttons.push(
      renderButton(
        "save",
        "payment_create",
        "Thanh toán",
        "card",
        styles.primaryButton
      )
    );

    return buttons.filter(Boolean);
  };

  const renderUpdateModeButtons = () => {
    const buttons = [];

    // Common buttons for all update states
    buttons.push(
      renderButton(
        "cancel",
        "cancel_order",
        "Hủy đơn",
        "close-circle",
        styles.dangerButton
      )
    );

    // F&B System buttons
    buttons.push(
      renderButton(
        "printKitchen",
        "print_kitchen",
        "In chế biến",
        "restaurant",
        styles.secondaryButton
      )
    );

    buttons.push(
      renderButton(
        "printTemporary",
        "print_temporary",
        "In tạm tính",
        "receipt",
        styles.infoButton
      )
    );

    buttons.push(
      renderButton(
        "payment",
        "payment",
        "Thanh toán",
        "card",
        styles.primaryButton
      )
    );

    // Retail System buttons (có thể ẩn tùy vào loại hình kinh doanh)
    buttons.push(
      renderButton(
        "delete",
        "delete_order",
        "Xóa đơn",
        "trash",
        styles.dangerButton
      )
    );

    buttons.push(
      renderButton(
        "send",
        "send_order",
        "Gửi hàng",
        "send",
        styles.warningButton
      )
    );

    buttons.push(
      renderButton(
        "confirm",
        "confirm_order",
        "Xác nhận",
        "checkmark-circle",
        styles.successButton
      )
    );

    return buttons.filter(Boolean);
  };

  // Không hiển thị buttons nếu không có visibility nào
  const hasAnyButton = Object.values(buttonVisibility).some(Boolean);
  if (!hasAnyButton) return null;

  const buttons =
    mode === "create" ? renderCreateModeButtons() : renderUpdateModeButtons();

  if (buttons.length === 0) return null;

  return (
    <View style={styles.container}>
      
      {mode === "create" && buttons.length <= 3 ? (
        <View style={styles.buttonRow}>{buttons}</View>
      ) : (
        <View style={styles.buttonRowMultiple}>{buttons}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  buttonRowMultiple: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    minWidth: 100,
    gap: 6,
  },
  // Button styles
  primaryButton: {
    backgroundColor: "#198754",
  },
  secondaryButton: {
    backgroundColor: "#5470ff",
  },
  dangerButton: {
    backgroundColor: "#dc3545",
  },
  warningButton: {
    backgroundColor: "#fd7e14",
  },
  successButton: {
    backgroundColor: "#198754",
  },
  infoButton: {
    backgroundColor: "#007bff",
  },
  detailButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#198754",
  },
  // Text styles
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#198754",
  },
});

export default OrderActionButtons;
