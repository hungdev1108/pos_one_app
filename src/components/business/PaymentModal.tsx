import { Entypo, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface PaymentModalProps {
  visible: boolean;
  totalAmount: number;
  onClose: () => void;
  onPayment: (paymentData: PaymentData) => void;
}

interface PaymentData {
  totalAmount: number;
  customerPaid: number;
  change: number;
  paymentMethod: "cash" | "bank";
  bankCode?: string;
  voucher?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SUGGESTED_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000];

const BANK_OPTIONS = [
  { code: "vnpay", name: "VNPAY QR", color: "#005aaa" },
  { code: "vnpay_pos", name: "VNPAY POS", color: "#ed1c24" },
  { code: "vietqr", name: "VietQR", color: "#aa362e" },
  { code: "momo", name: "MOMO", color: "#A50064" },
  { code: "acb", name: "ACB", color: "#10adef" },
  { code: "mbbank", name: "MBBANK", color: "#009BDA" },
];

export default function PaymentModal({
  visible,
  totalAmount,
  onClose,
  onPayment,
}: PaymentModalProps) {
  const insets = useSafeAreaInsets();
  const [customerPaid, setCustomerPaid] = useState<string>("");
  const [voucher, setVoucher] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<string>("");

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setCustomerPaid("");
      setVoucher("");
      setSelectedBank("");
    }
  }, [visible]);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  const parseNumber = (str: string): number => {
    return parseInt(str.replace(/[^\d]/g, "")) || 0;
  };

  const customerPaidAmount = parseNumber(customerPaid);
  const changeAmount = customerPaidAmount - totalAmount;

  const handleAmountSuggestion = (amount: number) => {
    setCustomerPaid(formatNumber(amount));
  };

  const handleCustomerPaidChange = (text: string) => {
    // Remove non-numeric characters and format
    const numericValue = text.replace(/[^\d]/g, "");
    if (numericValue) {
      setCustomerPaid(formatNumber(parseInt(numericValue)));
    } else {
      setCustomerPaid("");
    }
  };

  const handleClearInput = () => {
    setCustomerPaid("");
  };

  const handleVoucherCheck = () => {
    if (!voucher.trim()) {
      Alert.alert("Thông báo", "Bạn chưa nhập mã giảm giá.");
      return;
    }
    // TODO: Implement voucher validation logic
    Alert.alert(
      "Thông báo",
      "Chức năng kiểm tra voucher đang được phát triển."
    );
  };

  const handlePayment = () => {
    if (customerPaidAmount <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập số tiền khách trả.");
      return;
    }

    if (!selectedBank) {
      Alert.alert("Lỗi", "Vui lòng chọn ngân hàng thanh toán.");
      return;
    }

    const paymentData: PaymentData = {
      totalAmount,
      customerPaid: customerPaidAmount,
      change: changeAmount,
      paymentMethod: "bank",
      bankCode: selectedBank,
      voucher: voucher.trim() || undefined,
    };

    onPayment(paymentData);
  };

  const renderSuggestedAmounts = () => {
    const amounts = [totalAmount, ...SUGGESTED_AMOUNTS];

    return (
      <View style={styles.suggestedAmountsContainer}>
        <Text style={styles.sectionTitle}>Gợi ý tiên khách đưa</Text>
        <View style={styles.suggestedAmountsGrid}>
          {amounts.map((amount, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.suggestedAmountButton,
                index === 0 && styles.totalAmountButton,
              ]}
              onPress={() => handleAmountSuggestion(amount)}
            >
              {index === 0 ? (
                <View style={styles.exactPaymentContainer}>
                  <Text style={styles.exactPaymentLabel}>
                    Khách đưa đúng số tiền{" "}
                    <Text style={styles.exactPaymentAmount}>
                      {formatNumber(amount)}
                    </Text>
                  </Text>
                </View>
              ) : (
                <Text style={styles.suggestedAmountText}>
                  {formatNumber(amount)}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderBankOptions = () => {
    const selectedBankName = BANK_OPTIONS.find(
      (bank) => bank.code === selectedBank
    )?.name;

    return (
      <View style={styles.bankOptionsContainer}>
        <View style={styles.bankSectionHeader}>
          <Text style={styles.sectionTitle}>Chọn nhà thanh toán</Text>
          {selectedBankName && (
            <View style={styles.selectedBankIndicator}>
              <Ionicons name="checkmark-circle" size={16} color="#198754" />
              <Text style={styles.selectedBankText}>{selectedBankName}</Text>
            </View>
          )}
        </View>
        <View style={styles.bankGrid}>
          {BANK_OPTIONS.map((bank) => (
            <TouchableOpacity
              key={bank.code}
              style={[
                styles.bankButton,
                { backgroundColor: bank.color },
                selectedBank === bank.code && styles.selectedBankButton,
              ]}
              onPress={() => setSelectedBank(bank.code)}
            >
              <Text style={styles.bankButtonText}>{bank.name}</Text>
              {/* {selectedBank === bank.code && (
                <View style={styles.checkmarkOverlay}>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                </View>
              )} */}
            </TouchableOpacity>
          ))}
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
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: 20 }]}>
          <Text style={styles.headerTitle}>Thanh toán</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Total Amount */}
          <View style={styles.totalSection}>
            <View style={styles.totalAmountContainer}>
              <Text style={styles.inputLabel}>Tổng phải thu</Text>
              <View style={styles.totalAmountContainer}>
                <Text style={styles.totalAmount}>
                  {formatPrice(totalAmount)}
                </Text>
              </View>
            </View>
            {/* Customer Payment Input */}

            <View style={styles.customerPaymentContainer}>
              <Text style={styles.inputLabel}>Tiền khách trả</Text>
            </View>
            <View style={styles.customerPaymentInputContainer}>
              {customerPaid ? (
                <TouchableOpacity
                  style={styles.clearIcon}
                  onPress={handleClearInput}
                >
                  <Ionicons name="close-circle" size={26} color="red" />
                </TouchableOpacity>
              ) : (
                <Entypo
                  style={styles.keyboardIcon}
                  name="keyboard"
                  size={26}
                  color="#ddd"
                />
              )}
              <TextInput
                style={styles.amountInput}
                value={customerPaid}
                onChangeText={handleCustomerPaidChange}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#000"
              />
            </View>

            {/* Change Amount */}

            <View style={styles.changeAmountContainer}>
              <Text style={styles.inputLabel}>Tiền thối lại</Text>
              <View style={styles.totalAmountContainer}>
                <Text
                  style={[
                    styles.changeAmount,
                    changeAmount >= 0
                      ? styles.positiveChange
                      : styles.negativeChange,
                  ]}
                >
                  {changeAmount >= 0
                    ? formatPrice(changeAmount)
                    : `-${formatPrice(Math.abs(changeAmount))}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Voucher Section */}
          <View style={styles.voucherSection}>
            <Text style={styles.inputLabel}>Voucher</Text>
            <View style={styles.voucherInputContainer}>
              <TextInput
                style={styles.voucherInput}
                value={voucher}
                onChangeText={setVoucher}
                placeholder="Nhập mã giảm giá"
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.voucherCheckButton}
                onPress={handleVoucherCheck}
              >
                <Text style={styles.voucherCheckText}>Kiểm tra</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bank Options */}
          {renderBankOptions()}

          {/* Suggested Amounts */}
          {renderSuggestedAmounts()}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Trở lại</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentButton,
              (customerPaidAmount <= 0 || !selectedBank) &&
                styles.paymentButtonDisabled,
            ]}
            onPress={handlePayment}
            disabled={customerPaidAmount <= 0 || !selectedBank}
          >
            <Text style={styles.paymentButtonText}>Thanh toán</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
    // borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  totalSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginTop: 8,
  },
  customerPaymentContainer: {
    marginTop: 20,
    alignItems: "center",
  },

  customerPaymentInputContainer: {
    // marginTop: 10,
  },

  changeAmountContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  totalAmountContainer: {
    borderRadius: 8,
    // paddingHorizontal: 16,
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#198754",
  },
  inputSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 16,
    // fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 28,
    fontWeight: "600",
    textAlign: "center",
  },
  changeSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  changeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  changeAmount: {
    fontSize: 28,
    fontWeight: "bold",
  },
  positiveChange: {
    color: "#198754",
  },
  negativeChange: {
    color: "#dc3545",
  },
  voucherSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  voucherInputContainer: {
    flexDirection: "row",
    gap: 12,
  },
  voucherInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  voucherCheckButton: {
    // backgroundColor: "#198754",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#198754",
  },
  voucherCheckText: {
    color: "#198754",
    fontWeight: "600",
    fontSize: 14,
  },
  suggestedAmountsContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    // fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  suggestedAmountsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  suggestedAmountButton: {
    // backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: (SCREEN_WIDTH - 80) / 3 - 8,
    alignItems: "center",
  },
  totalAmountButton: {
    // backgroundColor: "#198754",
    color: "#5470ff",
    borderColor: "#dee2e6",
    width: "100%",
    // marginBottom: 8,
  },
  suggestedAmountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  totalAmountText: {
    color: "#5470ff",
    fontSize: 20,
  },
  exactPaymentContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  exactPaymentLabel: {
    fontSize: 13,
    color: "#5470ff",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },
  exactPaymentAmount: {
    fontSize: 14,
    color: "#5470ff",
    fontWeight: "bold",
  },
  bankOptionsContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  bankSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // marginBottom: 16,
  },
  selectedBankIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 10,
  },
  selectedBankText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#198754",
  },
  bankGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  bankButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: (SCREEN_WIDTH - 80) / 3 - 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedBankButton: {
    // borderColor: "#fff",
    // borderWidth: 1,
    // elevation: 1,
    // shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 0,
    // },
    // shadowOpacity: 0.3,
    // shadowRadius: 4,
    transform: [{ scale: 1.01 }],
  },
  bankButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "center",
  },
  checkmarkOverlay: {
    // position: "absolute",
    // top: -2,
    // right: -2,
    // backgroundColor: "rgba(255, 255, 255, 0.9)",
    // borderRadius: 12,
    // padding: 2,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: "#6c757d",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  paymentButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: "#198754",
    alignItems: "center",
  },
  paymentButtonDisabled: {
    backgroundColor: "#a5d6a7",
  },
  paymentButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  keyboardIcon: {
    position: "absolute",
    right: 10,
    bottom: 15,
  },
  clearIcon: {
    position: "absolute",
    right: 10,
    bottom: 15,
    zIndex: 1,
  },
});
