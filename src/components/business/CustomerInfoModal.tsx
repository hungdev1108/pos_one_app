import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View
} from "react-native";

interface CustomerInfo {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
}

interface CustomerInfoSectionProps {
  initialData?: CustomerInfo;
  onSave: (customerInfo: CustomerInfo) => void;
  shouldReset?: boolean; // Flag để reset dữ liệu
}

export default function CustomerInfoSection({
  initialData,
  onSave,
  shouldReset = false,
}: CustomerInfoSectionProps) {
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
  };

  // Auto save when data changes
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSave();
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [customerName, customerPhone, customerAddress]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="person" size={20} color="#198754" />
          <Text style={styles.headerTitle}>Thông tin khách hàng</Text>
        </View>

                 {/* Content */}
         <View style={styles.content}>
           {/* Số điện thoại và Tên khách hàng trên cùng 1 hàng */}
           <View style={styles.rowContainer}>
             <View style={styles.halfField}>
               <Text style={styles.label}>SĐT</Text>
               <TextInput
                 style={styles.input}
                 value={customerPhone}
                 onChangeText={setCustomerPhone}
                 placeholder="0000000000"
                 placeholderTextColor="#999"
                 keyboardType="phone-pad"
                 maxLength={15}
               />
             </View>
             <View style={styles.halfField}>
               <Text style={styles.label}>Tên KH</Text>
               <TextInput
                 style={styles.input}
                 value={customerName}
                 onChangeText={setCustomerName}
                 placeholder="Khách lẻ"
                 placeholderTextColor="#999"
                 maxLength={50}
               />
             </View>
           </View>

           {/* Địa chỉ */}
           <View style={styles.fieldContainer}>
             <Text style={styles.label}>Địa chỉ</Text>
             <TextInput
               style={[styles.input, styles.textArea]}
               value={customerAddress}
               onChangeText={setCustomerAddress}
               placeholder="Địa chỉ (tùy chọn)"
               placeholderTextColor="#999"
               multiline
               numberOfLines={2}
               maxLength={100}
             />
           </View>
         </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#f8f9fa",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginLeft: 6,
  },
  content: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  halfField: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    color: "#333",
    backgroundColor: "#fff",
  },
  textArea: {
    height: 35,
    textAlignVertical: "top",
  },
  hint: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
    fontStyle: "italic",
  },
});
