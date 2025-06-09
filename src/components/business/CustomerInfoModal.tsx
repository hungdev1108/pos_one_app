import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface CustomerInfo {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
}

interface CustomerInfoModalProps {
  visible: boolean;
  initialData?: CustomerInfo;
  onClose: () => void;
  onSave: (customerInfo: CustomerInfo) => void;
  shouldReset?: boolean; // Flag để reset dữ liệu
}

export default function CustomerInfoModal({
  visible,
  initialData,
  onClose,
  onSave,
  shouldReset = false,
}: CustomerInfoModalProps) {
  const [customerName, setCustomerName] = useState(
    initialData?.customerName || ""
  );
  const [customerPhone, setCustomerPhone] = useState(
    initialData?.customerPhone || ""
  );
  const [customerAddress, setCustomerAddress] = useState(
    initialData?.customerAddress || ""
  );

  React.useEffect(() => {
    if (visible) {
      if (shouldReset) {
        // Reset về giá trị mặc định
        setCustomerName("");
        setCustomerPhone("");
        setCustomerAddress("");
      } else {
        setCustomerName(initialData?.customerName || "");
        setCustomerPhone(initialData?.customerPhone || "");
        setCustomerAddress(initialData?.customerAddress || "");
      }
    }
  }, [visible, initialData, shouldReset]);

  const handleSave = () => {
    // Sử dụng giá trị mặc định nếu không nhập
    const finalCustomerName =
      customerName.trim() || "Người mua không cung cấp thông tin";
    const finalCustomerPhone = customerPhone.trim() || "0000000000";

    const customerInfo: CustomerInfo = {
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      customerAddress: customerAddress.trim(),
    };

    onSave(customerInfo);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.container}>
              {/* Header */}
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>Thông tin khách hàng</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleClose}
                  >
                    <Ionicons name="close" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>

              {/* Content */}
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.content}>
                  {/* Số điện thoại */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Số điện thoại</Text>
                    <TextInput
                      style={styles.input}
                      value={customerPhone}
                      onChangeText={setCustomerPhone}
                      placeholder="0000000000"
                      placeholderTextColor="#999"
                      keyboardType="phone-pad"
                      maxLength={15}
                    />
                    <Text style={styles.hint}>
                      Để trống sẽ mặc định là 0000000000
                    </Text>
                  </View>

                  {/* Tên khách hàng */}
                  {/* Spacer có thể chạm để đóng keyboard */}
                  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.spacer} />
                  </TouchableWithoutFeedback>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Tên khách hàng</Text>
                    <TextInput
                      style={styles.input}
                      value={customerName}
                      onChangeText={setCustomerName}
                      placeholder="Người mua không cung cấp thông tin"
                      placeholderTextColor="#999"
                      maxLength={100}
                    />
                    <Text style={styles.hint}>
                      Để trống sẽ mặc định là &quot;Người mua không cung cấp
                      thông tin&quot;
                    </Text>
                  </View>

                  {/* Spacer có thể chạm để đóng keyboard */}
                  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.spacer} />
                  </TouchableWithoutFeedback>

                  {/* Địa chỉ */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Địa chỉ</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={customerAddress}
                      onChangeText={setCustomerAddress}
                      placeholder="Nhập địa chỉ (tùy chọn)"
                      placeholderTextColor="#999"
                      multiline
                      numberOfLines={3}
                      maxLength={200}
                    />
                  </View>

                  {/* Spacer cuối để có vùng chạm lớn hơn */}
                  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={[styles.spacer, { height: 20 }]} />
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>

              {/* Footer */}
              <View style={styles.footerContainer}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <View style={styles.footerSpacer} />
                </TouchableWithoutFeedback>
                <View style={styles.footer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      Keyboard.dismiss();
                      handleClose();
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => {
                      Keyboard.dismiss();
                      handleSave();
                    }}
                  >
                    <Text style={styles.saveButtonText}>Lưu</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
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
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  hint: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#198754",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  spacer: {
    height: 8,
    width: "100%",
  },
  footerContainer: {
    backgroundColor: "#fff",
  },
  footerSpacer: {
    height: 10,
    width: "100%",
  },
});
