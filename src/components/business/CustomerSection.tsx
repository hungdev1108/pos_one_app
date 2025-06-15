import React, { useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
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

interface CustomerSectionProps {
  initialData?: CustomerInfo;
  onSave: (customerInfo: CustomerInfo) => void;
  shouldReset?: boolean;
}

export default function CustomerSection({
  initialData,
  onSave,
  shouldReset = false,
}: CustomerSectionProps) {
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
  }, [initialData, shouldReset]);

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
    Keyboard.dismiss();
  };

  const handleCancel = () => {
    // Reset về giá trị ban đầu
    setCustomerName(initialData?.customerName || "");
    setCustomerPhone(initialData?.customerPhone || "");
    setCustomerAddress(initialData?.customerAddress || "");
    Keyboard.dismiss();
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Thông tin khách hàng</Text>
          </View>

          {/* Content - Always visible */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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
                returnKeyType="next"
                blurOnSubmit={false}
              />
             
            </View>

            {/* Tên khách hàng */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Tên khách hàng</Text>
              <TextInput
                style={styles.input}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Người mua không cung cấp thông tin"
                placeholderTextColor="#999"
                maxLength={100}
                returnKeyType="next"
                blurOnSubmit={false}
              />
              
            </View>

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
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 8,
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexGrow: 1,
  },
  fieldContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#fff",
  },
  textArea: {
    height: 60,
    textAlignVertical: "top",
  },
  hint: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: "#198754",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
