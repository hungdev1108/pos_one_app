import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useRef, useState } from "react";
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
    View
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

  // Use ref to store timeout for debouncing
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for input fields
  const phoneInputRef = useRef<TextInput>(null);
  const nameInputRef = useRef<TextInput>(null);
  const addressInputRef = useRef<TextInput>(null);

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

  // Memoize the save function to prevent infinite loops
  const debouncedSave = useCallback((customerInfo: CustomerInfo) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onSave(customerInfo);
    }, 300); // 300ms debounce
  }, [onSave]);

  // Auto save when any field changes with debounce
  React.useEffect(() => {
    const customerInfo: CustomerInfo = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
    };
    
    // Only call save if at least one field has content or if it's a reset
    if (customerName || customerPhone || customerAddress || shouldReset) {
      debouncedSave(customerInfo);
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [customerName, customerPhone, customerAddress, debouncedSave, shouldReset]);

  // Reset function to clear all customer info and focus on phone input
  const handleReset = useCallback(() => {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    
    // Focus on phone input after reset
    setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 100);
  }, []);

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
            <TouchableOpacity 
              style={styles.resetButton} 
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={18} color="#666" />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
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
                ref={phoneInputRef}
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
                ref={nameInputRef}
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
                ref={addressInputRef}
              />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
    flex: 1,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginLeft: 4,
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
});
