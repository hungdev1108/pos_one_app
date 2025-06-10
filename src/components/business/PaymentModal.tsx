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
  const [billCounts, setBillCounts] = useState<{ [key: number]: number }>({});

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setCustomerPaid("");
      setVoucher("");
      setSelectedBank("");
      setBillCounts({});
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
  const changeAmount =
    customerPaid.trim() === "" ? 0 : customerPaidAmount - totalAmount;

  // Calculate total bills count
  const totalBillsCount = Object.values(billCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  const handleAmountSuggestion = (
    amount: number,
    isExactPayment: boolean = false
  ) => {
    if (isExactPayment) {
      // For exact payment: clear all bills and set exact amount
      setBillCounts({});
      setCustomerPaid(formatNumber(amount));
    } else {
      // For denomination selection: add to bill counts and calculate total
      setBillCounts((prev) => ({
        ...prev,
        [amount]: (prev[amount] || 0) + 1,
      }));

      // Calculate new total amount from bills
      const newBillCounts = {
        ...billCounts,
        [amount]: (billCounts[amount] || 0) + 1,
      };

      const totalFromBills = Object.entries(newBillCounts).reduce(
        (sum, [denomination, count]) => {
          return sum + parseInt(denomination) * count;
        },
        0
      );

      setCustomerPaid(formatNumber(totalFromBills));
    }
  };

  const handleCustomerPaidChange = (text: string) => {
    // Remove non-numeric characters and format
    const numericValue = text.replace(/[^\d]/g, "");
    if (numericValue) {
      setCustomerPaid(formatNumber(parseInt(numericValue)));
    } else {
      setCustomerPaid("");
    }
    // Clear bill counts when manually typing
    setBillCounts({});
  };

  const handleClearInput = () => {
    setCustomerPaid("");
    setBillCounts({});
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
    if (customerPaidAmount < totalAmount) {
      Alert.alert("Lỗi", "Số tiền khách trả phải đủ để thanh toán.");
      return;
    }

    const paymentData: PaymentData = {
      totalAmount,
      customerPaid: customerPaidAmount,
      change: changeAmount,
      paymentMethod: "bank",
      bankCode: selectedBank || "cash",
      voucher: voucher.trim() || undefined,
    };

    onPayment(paymentData);
  };

  const renderSuggestedAmounts = () => {
    return (
      <View style={styles.suggestedAmountsContainer}>
        <Text style={styles.sectionTitle}>Gợi ý tiền khách đưa</Text>

        {/* First row: Exact payment button */}
        <View style={styles.exactPaymentRow}>
          <TouchableOpacity
            style={styles.exactPaymentButton}
            onPress={() => handleAmountSuggestion(totalAmount, true)}
          >
            <Text style={styles.exactPaymentLabel}>
              Khách đưa đúng số tiền{" "}
              <Text style={styles.exactPaymentAmount}>
                {formatNumber(totalAmount)}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Grid for suggested amounts */}
        <View style={styles.suggestedAmountsGrid}>
          {SUGGESTED_AMOUNTS.map((amount, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestedAmountButton}
              onPress={() => handleAmountSuggestion(amount)}
            >
              <Text style={styles.suggestedAmountText}>
                {formatNumber(amount)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderBankOptionsAndSuggestedAmounts = () => {
    return (
      <View style={styles.bankOptionsContainer}>
        <View style={styles.bankSectionHeader}>
          <Text style={styles.sectionTitle}>Chọn thanh toán</Text>
          {totalBillsCount > 0 && (
            <View style={styles.selectedBankIndicator}>
              <Ionicons name="receipt-outline" size={16} color="#198754" />
              <Text style={styles.selectedBankText}>
                Tổng số tờ: {totalBillsCount}
              </Text>
            </View>
          )}
        </View>

        {/* Container for bank options and suggested amounts */}
        <View style={styles.bankAndSuggestedAmountsContainer}>
          {/* First column: Bank options */}
          <View style={styles.bankColumn}>
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
              </TouchableOpacity>
            ))}
          </View>
          {/* Second column: suggested amounts */}
          <View style={styles.suggestedAmountsColumn}>
            {/* Grid for suggested amounts */}
            <View style={styles.exactPaymentRow}>
              <TouchableOpacity
                style={styles.exactPaymentButton}
                onPress={() => handleAmountSuggestion(totalAmount, true)}
              >
                <Text style={styles.exactPaymentLabel}>
                  <Text style={styles.exactPaymentAmount}>
                    {formatNumber(totalAmount)}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.suggestedAmountsGrid}>
              {SUGGESTED_AMOUNTS.map((amount, index) => (
                <TouchableOpacity
                  onPress={() => handleAmountSuggestion(amount)}
                  key={index}
                  style={styles.suggestedAmountButton}
                >
                  <Text style={styles.suggestedAmountText}>
                    {formatNumber(amount)}
                  </Text>
                  {billCounts[amount] && (
                    <View style={styles.billCountBadge}>
                      <Text style={styles.billCountText}>
                        {billCounts[amount]}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
          {renderBankOptionsAndSuggestedAmounts()}

          {/* Suggested Amounts */}
          {/* {renderSuggestedAmounts()} */}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Trở lại</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentButton,
              customerPaidAmount < totalAmount && styles.paymentButtonDisabled,
            ]}
            onPress={handlePayment}
            disabled={customerPaidAmount < totalAmount}
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
  exactPaymentRow: {
    // marginBottom: 16,
  },
  exactPaymentButton: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  suggestedAmountsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestedAmountButton: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: "48%",
    alignItems: "center",
    position: "relative",
  },
  billCountBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#dc3545",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  billCountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
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
    // lineHeight: 18,
  },
  exactPaymentAmount: {
    fontSize: 20,
    color: "#5470ff",
    fontWeight: "bold",
  },
  bankOptionsContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    marginBottom: 16,
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
  bankColumn: {
    // flex: 1,
    flexDirection: "column",
    gap: 10,
  },
  suggestedAmountsColumn: {
    flex: 1,
    flexDirection: "column",
    gap: 10,
  },
  bankButton: {
    paddingHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 8,
    // width: "100%",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedBankButton: {
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
    backgroundColor: "#777",
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
  bankAndSuggestedAmountsContainer: {
    flexDirection: "row",
    gap: 16,
    flex: 1,
  },
});
