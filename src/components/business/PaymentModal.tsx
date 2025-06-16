import { Entypo, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ordersService } from "../../api/services/orders";

interface PaymentModalProps {
  visible: boolean;
  totalAmount: number;
  onClose: () => void;
  onPayment: (paymentData: PaymentData) => void;
  orderId?: string;
  initialCustomerInfo?: {
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
  };
}

interface PaymentData {
  totalAmount: number;
  customerPaid: number;
  change: number;
  paymentMethod: "cash" | "bank";
  bankCode?: string;
  voucher?: string;
  invoiceType?: "individual" | "business";
  customerInfo?: CustomerInvoiceInfo;
}

interface CustomerInvoiceInfo {
  // Thông tin cá nhân
  individualName?: string;
  individualPhone?: string;
  individualAddress?: string;
  individualEmail?: string;

  // Thông tin doanh nghiệp
  taxCodePersonal?: string;
  taxCodeBusiness?: string;
  businessName?: string;
  businessAddress?: string;
  businessEmail?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isTablet = SCREEN_WIDTH >= 720;

const SUGGESTED_AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000];

const BANK_OPTIONS = [
  { code: "vnpay", name: "VNPAY QR", color: "#005aaa" },
  { code: "vnpay_pos", name: "VNPAY POS", color: "#ed1c24" },
  // { code: "vietqr", name: "VietQR", color: "#aa362e" },
  // { code: "momo", name: "MOMO", color: "#A50064" },
  // { code: "acb", name: "ACB", color: "#10adef" },
  // { code: "mbbank", name: "MBBANK", color: "#009BDA" },
];

export default function PaymentModal({
  visible,
  totalAmount,
  onClose,
  onPayment,
  orderId,
  initialCustomerInfo,
}: PaymentModalProps) {
  const insets = useSafeAreaInsets();
  const [customerPaid, setCustomerPaid] = useState<string>("");
  const [voucher, setVoucher] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [billCounts, setBillCounts] = useState<{ [key: number]: number }>({});

  // State cho loại hóa đơn và thông tin khách hàng
  const [invoiceType, setInvoiceType] = useState<"individual" | "business">(
    "individual"
  );
  
  // Memoize initial customer info to prevent infinite loops
  const memoizedInitialCustomerInfo = useMemo(() => ({
    individualName: initialCustomerInfo?.customerName || "",
    individualPhone: initialCustomerInfo?.customerPhone || "",
    individualAddress: initialCustomerInfo?.customerAddress || "",
    individualEmail: "",
    taxCodePersonal: "",
    taxCodeBusiness: "",
    businessName: "",
    businessAddress: "",
    businessEmail: "",
  }), [
    initialCustomerInfo?.customerName,
    initialCustomerInfo?.customerPhone,
    initialCustomerInfo?.customerAddress
  ]);

  const [customerInfo, setCustomerInfo] = useState<CustomerInvoiceInfo>(memoizedInitialCustomerInfo);
  const [isTaxLookupLoading, setIsTaxLookupLoading] = useState(false);

  // State cho QR Code popup
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [qrPaymentData, setQrPaymentData] = useState<{
    qr: string;
    paymentId: string;
    apptransid: string;
  } | null>(null);
  const [isLoadingQR, setIsLoadingQR] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setCustomerPaid("");
      setVoucher("");
      setSelectedBank("");
      setBillCounts({});
      setInvoiceType("individual");
      setCustomerInfo(memoizedInitialCustomerInfo);
      setIsTaxLookupLoading(false);
      setQrModalVisible(false);
      setQrImageUrl("");
      setQrPaymentData(null);
      setIsLoadingQR(false);
    }
  }, [visible, memoizedInitialCustomerInfo]);

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

  const handleTaxLookup = () => {
    if (!customerInfo.taxCodeBusiness?.trim()) {
      Alert.alert("Thông báo", "Bạn chưa nhập mã số thuế.");
      return;
    }

    if (isTaxLookupLoading) {
      return; // Prevent multiple calls while loading
    }

    const taxCode = customerInfo.taxCodeBusiness.trim();

    // Mock data cho mã số thuế 1234567890
    if (taxCode === "1234567890") {
      setIsTaxLookupLoading(true);

      // Simulate API delay and then update form
      setTimeout(() => {
        setCustomerInfo((prev) => ({
          ...prev,
          businessName: "POS ONE",
          businessAddress: "Hồ Chí Minh",
          businessEmail: "posone.kas@gmail.com",
        }));

        setIsTaxLookupLoading(false);

        Alert.alert("Thành công", "Đã tải thông tin doanh nghiệp thành công!", [
          { text: "OK" },
        ]);
      }, 1500); // 1.5 second delay to simulate API call
    } else {
      // Handle invalid tax code
      Alert.alert(
        "Không tìm thấy",
        `Không tìm thấy thông tin cho mã số thuế: ${taxCode}\n\nThử với mã số thuế: 1234567890`,
        [{ text: "OK" }]
      );
    }
  };

  const handleCustomerInfoChange = (
    field: keyof CustomerInvoiceInfo,
    value: string
  ) => {
    setCustomerInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleVNPayQR = async () => {
    if (!orderId) {
      Alert.alert("Lỗi", "Không tìm thấy ID đơn hàng để tạo mã QR thanh toán.");
      return;
    }

    try {
      setIsLoadingQR(true);
      console.log("🔄 Calling VNPAY QR API for orderId:", orderId);

      // ✅ KIỂM TRA VÀ LẤY ORDER ID THẬT
      let actualOrderId = orderId;
      
      // Nếu orderId là số (từ đơn hàng mới), cần lấy orderId thật từ API
      if (/^\d+$/.test(orderId)) {
        console.log("🔍 Detected numeric orderId, fetching actual orderId from API...");
        try {
          const orderDetail = await ordersService.getOrderDetail(orderId);
          if (orderDetail.id && orderDetail.id !== orderId) {
            actualOrderId = orderDetail.id;
            console.log("✅ Got actual orderId from API:", actualOrderId);
          }
        } catch (error) {
          console.warn("⚠️ Could not fetch order detail, using original orderId:", error);
        }
      }

      console.log("🎯 Using orderId for VNPAY QR:", actualOrderId);

      const paymentResponse = await ordersService.getPaymentMethods(actualOrderId);
      console.log("✅ VNPAY QR API response:", paymentResponse);

      if (paymentResponse && paymentResponse.qr) {
        setQrPaymentData({
          qr: paymentResponse.qr,
          paymentId: paymentResponse.paymentId,
          apptransid: paymentResponse.apptransid,
        });
        setQrModalVisible(true);
      } else {
        Alert.alert("Lỗi", "Không thể tạo mã QR thanh toán. Vui lòng thử lại.");
      }
    } catch (error: any) {
      console.error("❌ Error calling VNPAY QR API:", error);
      Alert.alert(
        "Lỗi",
        `Không thể tạo mã QR thanh toán: ${
          error.message || "Lỗi không xác định"
        }`
      );
    } finally {
      setIsLoadingQR(false);
    }
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
      invoiceType: invoiceType,
      customerInfo: customerInfo,
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
              style={[
                styles.suggestedAmountButton,
                { backgroundColor: "#f8f9fa" },
              ]}
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

        {isTablet ? (
          // Tablet layout: Bank options on top row, suggested amounts on bottom row
          <View style={styles.tabletBankContainer}>
            {/* First row: Bank options */}
            <View style={styles.bankOptionsRow}>
              {BANK_OPTIONS.map((bank) => (
                <TouchableOpacity
                  key={bank.code}
                  style={[
                    styles.tabletBankButton,
                    selectedBank === bank.code && styles.selectedBankButton,
                    bank.code === "vnpay" && isLoadingQR && { opacity: 0.6 },
                  ]}
                  disabled={bank.code === "vnpay" && isLoadingQR}
                  onPress={() => {
                    if (bank.code === "vnpay") {
                      handleVNPayQR();
                    } else {
                      setSelectedBank(bank.code);
                    }
                  }}
                >
                  <Image
                    source={
                      bank.code === "vnpay"
                        ? require("../../../assets/images/PNG_VNPAY-QR.png")
                        : require("../../../assets/images/PNG_VNPAY-POS.png")
                    }
                    style={styles.bankButtonImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.tabletBankButtonText}>
                    {bank.code === "vnpay" && isLoadingQR
                      ? "Đang tạo QR..."
                      : bank.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Second row: Suggested amounts */}
            <View style={styles.suggestedAmountsRow}>
              <View style={styles.exactPaymentRow}>
                <TouchableOpacity
                  style={[
                    styles.exactPaymentButton,
                    { backgroundColor: "#4dd4ac" },
                  ]}
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
                    style={[
                      styles.suggestedAmountButton,
                      { backgroundColor: "#a6e9d5" },
                    ]}
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
        ) : (
          // Mobile layout: Original side-by-side layout
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
                    bank.code === "vnpay" && isLoadingQR && { opacity: 0.6 },
                  ]}
                  disabled={bank.code === "vnpay" && isLoadingQR}
                  onPress={() => {
                    if (bank.code === "vnpay") {
                      handleVNPayQR();
                    } else {
                      setSelectedBank(bank.code);
                    }
                  }}
                >
                  <Text style={styles.bankButtonText}>
                    {bank.code === "vnpay" && isLoadingQR
                      ? "Đang tạo QR..."
                      : bank.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Second column: suggested amounts */}
            <View style={styles.suggestedAmountsColumn}>
              {/* Grid for suggested amounts */}
              <View style={styles.exactPaymentRow}>
                <TouchableOpacity
                  style={[
                    styles.exactPaymentButton,
                    { backgroundColor: "#4dd4ac" },
                  ]}
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
                    style={[
                      styles.suggestedAmountButton,
                      { backgroundColor: "#a6e9d5" },
                    ]}
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
        )}
      </View>
    );
  };

  // Render Type of invoice to be issued
  // Render payment information section (for column 1 on tablet)
  const renderPaymentInfo = () => {
    return (
      <View
        style={[
          styles.paymentInfoContainer,
          isTablet && styles.paymentInfoTablet,
        ]}
      >
        {/* Total Amount */}
        <View style={styles.totalSection}>
          <View style={styles.totalAmountContainer}>
            <Text style={styles.inputLabel}>Tổng phải thu</Text>
            <View style={styles.totalAmountContainer}>
              <Text style={styles.totalAmount}>{formatPrice(totalAmount)}</Text>
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
      </View>
    );
  };

  const renderCustomerInfo = () => {
    return (
      <View style={styles.customerInfoContainer}>
        <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
        
        {/* Số điện thoại */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Số điện thoại</Text>
          <TextInput
            style={styles.textInput}
            value={customerInfo.individualPhone || ""}
            onChangeText={(value) =>
              handleCustomerInfoChange("individualPhone", value)
            }
            placeholder="0000000000"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            maxLength={15}
            returnKeyType="next"
            blurOnSubmit={false}
          />
        </View>

        {/* Tên khách hàng */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Tên khách hàng</Text>
          <TextInput
            style={styles.textInput}
            value={customerInfo.individualName || ""}
            onChangeText={(value) =>
              handleCustomerInfoChange("individualName", value)
            }
            placeholder="Người mua không cung cấp thông tin"
            placeholderTextColor="#999"
            maxLength={100}
            returnKeyType="next"
            blurOnSubmit={false}
          />
        </View>

        {/* Địa chỉ */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Địa chỉ</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={customerInfo.individualAddress || ""}
            onChangeText={(value) =>
              handleCustomerInfoChange("individualAddress", value)
            }
            placeholder="Nhập địa chỉ (tùy chọn)"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            maxLength={200}
            returnKeyType="done"
            blurOnSubmit={true}
          />
        </View>
      </View>
    );
  };

  const renderTypeOfInvoice = () => {
    return (
      <View style={styles.typeOfInvoiceContainer}>
        {/* Radio buttons cho loại hóa đơn */}
        <View style={styles.typeOfInvoiceRadioButtonContainer}>
          <TouchableOpacity
            style={[
              styles.typeOfInvoiceRadioButton,
              invoiceType === "individual" &&
                styles.typeOfInvoiceRadioButtonSelected,
            ]}
            onPress={() => setInvoiceType("individual")}
          >
            <View style={styles.radioButtonInner}>
              <View
                style={[
                  styles.radioCircle,
                  invoiceType === "individual" && styles.radioCircleSelected,
                ]}
              >
                {invoiceType === "individual" && (
                  <View style={styles.radioInnerCircle} />
                )}
              </View>
              <Text
                style={[
                  styles.typeOfInvoiceRadioButtonText,
                  invoiceType === "individual" &&
                    styles.typeOfInvoiceRadioButtonTextSelected,
                ]}
              >
                Cá nhân
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeOfInvoiceRadioButton,
              invoiceType === "business" &&
                styles.typeOfInvoiceRadioButtonSelected,
            ]}
            onPress={() => setInvoiceType("business")}
          >
            <View style={styles.radioButtonInner}>
              <View
                style={[
                  styles.radioCircle,
                  invoiceType === "business" && styles.radioCircleSelected,
                ]}
              >
                {invoiceType === "business" && (
                  <View style={styles.radioInnerCircle} />
                )}
              </View>
              <Text
                style={[
                  styles.typeOfInvoiceRadioButtonText,
                  invoiceType === "business" &&
                    styles.typeOfInvoiceRadioButtonTextSelected,
                ]}
              >
                Doanh nghiệp
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Form thông tin khách hàng */}
        <View style={styles.customerFormContainer}>
          {invoiceType === "individual" ? (
            // Form cá nhân
            <View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Mã số thuế cá nhân (Nếu có)
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={customerInfo.taxCodePersonal}
                  onChangeText={(value) =>
                    handleCustomerInfoChange("taxCodePersonal", value)
                  }
                  placeholder="Nhập mã số thuế"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tên cá nhân</Text>
                <TextInput
                  style={styles.textInput}
                  value={customerInfo.individualName}
                  onChangeText={(value) =>
                    handleCustomerInfoChange("individualName", value)
                  }
                  placeholder="Nhập tên cá nhân"
                  placeholderTextColor="#999"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>
            </View>
          ) : (
            // Form doanh nghiệp
            <View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mã số thuế</Text>
                <View style={styles.taxCodeInputContainer}>
                  <TextInput
                    style={[styles.textInput, styles.taxCodeInput]}
                    value={customerInfo.taxCodeBusiness}
                    onChangeText={(value) =>
                      handleCustomerInfoChange("taxCodeBusiness", value)
                    }
                    placeholder="Nhập mã số thuế"
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                  <TouchableOpacity
                    style={[
                      styles.taxLookupButton,
                      isTaxLookupLoading && styles.taxLookupButtonDisabled,
                    ]}
                    onPress={handleTaxLookup}
                    disabled={isTaxLookupLoading}
                  >
                    <Text
                      style={[
                        styles.taxLookupButtonText,
                        isTaxLookupLoading &&
                          styles.taxLookupButtonTextDisabled,
                      ]}
                    >
                      {isTaxLookupLoading
                        ? "Đang tra cứu..."
                        : "Lấy từ cơ quan thuế"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tên doanh nghiệp</Text>
                <TextInput
                  style={styles.textInput}
                  value={customerInfo.businessName}
                  onChangeText={(value) =>
                    handleCustomerInfoChange("businessName", value)
                  }
                  placeholder="Nhập tên doanh nghiệp"
                  placeholderTextColor="#999"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Địa chỉ</Text>
                <TextInput
                  style={styles.textInput}
                  value={customerInfo.businessAddress}
                  onChangeText={(value) =>
                    handleCustomerInfoChange("businessAddress", value)
                  }
                  placeholder="Nhập địa chỉ doanh nghiệp"
                  placeholderTextColor="#999"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  value={customerInfo.businessEmail}
                  onChangeText={(value) =>
                    handleCustomerInfoChange("businessEmail", value)
                  }
                  placeholder="Nhập email doanh nghiệp"
                  keyboardType="email-address"
                  placeholderTextColor="#999"
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
              </View>
            </View>
          )}
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
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: 20 }]}>
          <Text style={styles.headerTitle}>Thanh toán</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {isTablet ? (
          // Layout for tablet: 3 columns with individual scrolling
          <View style={styles.tabletMainContainer}>
            {/* Column 1: Payment Info */}
            <ScrollView 
              style={styles.tabletColumn1}
              contentContainerStyle={styles.tabletColumnContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {renderPaymentInfo()}
            </ScrollView>

            {/* Column 2: Bank Options */}
            <ScrollView 
              style={styles.tabletColumn2}
              contentContainerStyle={styles.tabletColumnContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {renderBankOptionsAndSuggestedAmounts()}
            </ScrollView>

            {/* Column 3: Customer Info and Invoice Type */}
            <ScrollView 
              style={styles.tabletColumn3}
              contentContainerStyle={styles.tabletColumnContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {renderCustomerInfo()}
              {renderTypeOfInvoice()}
            </ScrollView>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Layout for mobile: original layout */}
            <>
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

              {/* Type of invoice to be issued */}
              {renderTypeOfInvoice()}
            </>
          </ScrollView>
          )}

        {/* Footer */}
        <View
          style={[
            styles.footer,
            { paddingBottom: isTablet ? 10 : insets.bottom + 10 },
          ]}
        >
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
            <Text style={styles.paymentButtonText}>In thanh toán</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* QR Code Modal - New VNPAY API Version */}
      <Modal
        visible={qrModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalContainer}>
            {/* Header */}
            <View style={styles.qrModalHeader}>
              <Text style={styles.qrModalTitle}>Thanh toán VNPAY QR</Text>
              <TouchableOpacity
                style={styles.qrModalCloseButton}
                onPress={() => setQrModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* QR Code Image */}
            <View style={styles.qrImageContainer}>
              {qrPaymentData?.qr ? (
                <Image
                  source={{ uri: `data:image/png;base64,${qrPaymentData.qr}` }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              ) : (
                <Text>Đang tải QR code...</Text>
              )}
            </View>

            {/* Payment Info */}
            <View style={styles.qrPaymentInfo}>
              <Text style={styles.qrPaymentLabel}>Số tiền cần thanh toán:</Text>
              <Text style={styles.qrPaymentAmount}>
                {formatPrice(totalAmount)}
              </Text>
              {qrPaymentData?.apptransid && (
                <Text style={styles.qrTransactionId}>
                  Mã giao dịch: {qrPaymentData.apptransid}
                </Text>
              )}
              <Text style={styles.qrPaymentInstruction}>
                Sử dụng ứng dụng ngân hàng để quét mã QR
              </Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={styles.qrDoneButton}
              onPress={() => setQrModalVisible(false)}
            >
              <Text style={styles.qrDoneButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Commented out old QR Modal */}
      {/* {qrModalVisible && (
        <Modal
          visible={qrModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setQrModalVisible(false)}
        >
          <View style={styles.qrModalOverlay}>
            <View style={styles.qrModalContainer}>
              <View style={styles.qrModalHeader}>
                <Text style={styles.qrModalTitle}>Thanh toán VNPAY QR</Text>
                <TouchableOpacity
                  style={styles.qrModalCloseButton}
                  onPress={() => setQrModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <View style={styles.qrImageContainer}>
                {qrImageUrl ? (
                  <Image
                    source={{ uri: qrImageUrl }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text>Đang tải QR code...</Text>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )} */}
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
    paddingBottom: 100,
  },
  contentTablet: {
    flex: 1,
    paddingBottom: 20,
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
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: isTablet ? 10 : 8,
    marginTop: 10,
  },
  suggestedAmountButton: {
    // borderWidth: 1,
    // borderColor: "#dee2e6",
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
    color: "#000",
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
  typeOfInvoiceContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  typeOfInvoiceRadioButtonContainer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    // marginBottom: 16,
  },
  typeOfInvoiceRadioButton: {
    // paddingHorizontal: 12,
    // paddingVertical: 12,
    // borderRadius: 8,
    // borderWidth: 1,
    // borderColor: "#dee2e6",
    // alignItems: "center",
    // justifyContent: "center",
    // width: "50%",
    // backgroundColor: "#fff",
  },
  typeOfInvoiceRadioButtonSelected: {
    // backgroundColor: "#e9ecef",
  },
  typeOfInvoiceRadioButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  typeOfInvoiceRadioButtonTextSelected: {
    fontWeight: "bold",
  },
  radioButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dee2e6",
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleSelected: {
    borderColor: "#198754",
  },
  radioInnerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#198754",
  },
  customerFormContainer: {
    marginTop: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  taxCodeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  taxCodeInput: {
    flex: 1,
  },
  taxLookupButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#198754",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
  },
  taxLookupButtonDisabled: {
    backgroundColor: "#a5d6a7",
  },
  taxLookupButtonText: {
    color: "#198754",
    fontWeight: "600",
    fontSize: 14,
  },
  taxLookupButtonTextDisabled: {
    color: "#777",
  },
  qrModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  qrModalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    maxWidth: 400,
    alignItems: "center",
  },
  qrModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  qrModalCloseButton: {
    padding: 4,
  },
  qrImageContainer: {
    marginTop: 20,
    // marginBottom: 10,
    width: "100%",
    height: 300,
    borderRadius: 8,
    overflow: "hidden",
    // backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  qrImage: {
    width: "100%",
    height: "100%",
  },
  qrPaymentInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  qrPaymentLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  qrPaymentAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#198754",
  },
  qrTransactionId: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
    marginBottom: 8,
  },
  qrPaymentInstruction: {
    fontSize: 14,
    color: "#666",
  },
  qrDoneButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#198754",
    alignItems: "center",
  },
  qrDoneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Tablet responsive styles
  paymentInfoContainer: {
    flex: 1,
  },
  paymentInfoTablet: {
    flex: 1,
    marginRight: 8,
  },
  tabletMainContainer: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  tabletColumn1: {
    flex: 1,
  },
  tabletColumn2: {
    flex: 1,
  },
  tabletColumn3: {
    flex: 1,
  },
  tabletColumnContent: {
    paddingBottom: 20,
  },
  customerInfoContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  tabletBankContainer: {
    flex: 1,
  },
  bankOptionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  tabletBankButton: {
    padding: 20,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: "#f9fafb",
    flex: 1,
    minHeight: 80,
    justifyContent: "center",
  },
  bankButtonImage: {
    width: 70,
    height: 70,
    marginBottom: 5,
  },
  tabletBankButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  suggestedAmountsRow: {
    marginTop: 15,
  },
});
