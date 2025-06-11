import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface KitchenPrintData {
  orderCode: string;
  tableName?: string;
  employeeName?: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    note?: string;
  }[];
  createTime: string;
}

interface KitchenPrintModalProps {
  visible: boolean;
  onClose: () => void;
  printData: KitchenPrintData;
}

const { width } = Dimensions.get("window");

export default function KitchenPrintModal({
  visible,
  onClose,
  printData,
}: KitchenPrintModalProps) {
  const insets = useSafeAreaInsets();

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} - ${hours}:${minutes}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bill In Chế Biến</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Print Preview */}
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.printContainer}>
            {/* Bill Content */}
            <View style={styles.billContent}>
              {/* Title */}
              <Text style={styles.billTitle}>CHẾ BIẾN</Text>

              {/* Table Info */}
              <View style={styles.tableInfo}>
                <Text style={styles.tableLabel}>Bàn: </Text>
                <Text style={styles.tableValue}>
                  {printData.tableName || "BÀN SỐ - Bàn Số 8"}
                </Text>
              </View>

              {/* Employee Info */}
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeLabel}>Nhân viên:</Text>
              </View>

              {/* Order Code and Time */}
              <View style={styles.orderInfo}>
                <Text style={styles.orderCode}>
                  {printData.orderCode} - {formatDateTime(printData.createTime)}
                </Text>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Header Row */}
              <View style={styles.headerRow}>
                <Text style={styles.headerMon}>Món</Text>
                <Text style={styles.headerDvt}>ĐVT</Text>
                <Text style={styles.headerSl}>SL</Text>
              </View>

              {/* Items List */}
              {printData.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemNameContainer}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.note && (
                      <Text style={styles.itemNote}>{item.note}</Text>
                    )}
                  </View>
                  <View style={styles.quantityContainer}>
                    <Text style={styles.itemQuantity}>{item.quantity}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.printButton}
            onPress={() => {
              // Giả lập in - có thể thêm logic in thật ở đây
              console.log("🖨️ Đã in bill chế biến:", printData.orderCode);
              onClose();
            }}
          >
            <Ionicons name="print" size={20} color="#fff" />
            <Text style={styles.printButtonText}>In Bill</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  printContainer: {
    padding: 20,
    alignItems: "center",
  },
  billContent: {
    width: Math.min(280, width - 40),
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  billTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
    color: "#000",
  },
  tableInfo: {
    flexDirection: "row",
    marginBottom: 4,
  },
  tableLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  tableValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  employeeInfo: {
    marginBottom: 4,
  },
  employeeLabel: {
    fontSize: 14,
    color: "#000",
  },
  orderInfo: {
    marginBottom: 12,
  },
  orderCode: {
    fontSize: 12,
    color: "#666",
  },
  divider: {
    height: 1,
    backgroundColor: "#000",
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginBottom: 8,
  },
  headerMon: {
    flex: 1,
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  headerDvt: {
    width: 40,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    color: "#000",
  },
  headerSl: {
    width: 30,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    color: "#000",
  },
  itemRow: {
    flexDirection: "row",
    paddingVertical: 4,
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  itemNameContainer: {
    flex: 1,
    paddingRight: 8,
  },
  itemName: {
    fontSize: 13,
    color: "#000",
    lineHeight: 18,
  },
  itemNote: {
    fontSize: 11,
    color: "#666",
    fontStyle: "italic",
    marginTop: 2,
  },
  quantityContainer: {
    width: 30,
    alignItems: "center",
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
  },
  actionContainer: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    gap: 12,
  },
  printButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#198754",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  printButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6c757d",
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
