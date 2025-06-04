import { OrderProduct, Table, TableStatus } from "@/api/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TableDetailModalProps {
  visible: boolean;
  table: Table | null;
  onClose: () => void;
  onCreateOrder?: (table: Table) => void;
  onViewOrder?: (table: Table) => void;
}

const TableDetailModal: React.FC<TableDetailModalProps> = ({
  visible,
  table,
  onClose,
  onCreateOrder,
  onViewOrder,
}) => {
  if (!table) return null;

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getTableStatusColor = (status: TableStatus) => {
    switch (status) {
      case TableStatus.Available:
        return "#28a745";
      case TableStatus.Occupied:
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const getTableStatusText = (status: TableStatus) => {
    switch (status) {
      case TableStatus.Available:
        return "Trống";
      case TableStatus.Occupied:
        return "Có khách";
      default:
        return "Không xác định";
    }
  };

  const getTableStatusIcon = (status: TableStatus) => {
    switch (status) {
      case TableStatus.Available:
        return "checkmark-circle";
      case TableStatus.Occupied:
        return "people";
      default:
        return "help-circle";
    }
  };

  const renderOrderProduct = ({ item }: { item: OrderProduct }) => {
    return (
      <View style={styles.productItem}>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.productUnit}>
            {item.quantity} {item.unit?.name || ""}
          </Text>
        </View>
        <View style={styles.productPricing}>
          <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
          <Text style={styles.productTotal}>
            = {formatPrice(item.totalCostInclideVAT)}
          </Text>
        </View>
      </View>
    );
  };

  const totalAmount =
    table.order?.products.reduce(
      (sum, product) => sum + product.totalCostInclideVAT,
      0
    ) || 0;

  const statusColor = getTableStatusColor(table.status);
  const statusText = getTableStatusText(table.status);
  const statusIcon = getTableStatusIcon(table.status);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{table?.name || ""}</Text>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor }]}
            >
              <Ionicons name={statusIcon} size={14} color="#fff" />
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {table?.status === TableStatus.Available ? (
            // Bàn trống
            <View style={styles.emptyTableContainer}>
              <Ionicons name="checkmark-circle" size={80} color="#28a745" />
              <Text style={styles.emptyTableTitle}>Bàn đang trống</Text>
              <Text style={styles.emptyTableSubtitle}>
                Sẵn sàng phục vụ khách hàng
              </Text>

              <TouchableOpacity
                style={styles.createOrderButton}
                onPress={() => table && onCreateOrder?.(table)}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.createOrderButtonText}>
                  Tạo đơn hàng mới
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Bàn có khách
            table?.order && (
              <View style={styles.orderContainer}>
                {/* Order Header */}
                <View style={styles.orderHeader}>
                  <Text style={styles.orderCode}>#{table.order.code}</Text>
                  <Text style={styles.orderTime}>
                    {new Date(table.order.createDate).toLocaleString("vi-VN")}
                  </Text>
                </View>

                {/* Customer Info */}
                {table.order.customer && (
                  <View style={styles.customerContainer}>
                    <View style={styles.customerHeader}>
                      <Ionicons name="person" size={20} color="#198754" />
                      <Text style={styles.customerTitle}>
                        Thông tin khách hàng
                      </Text>
                    </View>
                    <Text style={styles.customerName}>
                      {table.order.customer.name}
                    </Text>
                    <Text style={styles.customerPhone}>
                      📞 {table.order.customer.phone}
                    </Text>
                  </View>
                )}

                {/* Order Products */}
                <View style={styles.productsContainer}>
                  <View style={styles.productsHeader}>
                    <Ionicons name="restaurant" size={20} color="#198754" />
                    <Text style={styles.productsTitle}>
                      Món đã đặt ({table.order.products.length})
                    </Text>
                  </View>

                  <FlatList
                    data={table.order.products}
                    renderItem={renderOrderProduct}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                  />

                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Tổng cộng:</Text>
                    <Text style={styles.totalAmount}>
                      {formatPrice(totalAmount)}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.viewOrderButton}
                    onPress={() => table && onViewOrder?.(table)}
                  >
                    <Ionicons name="eye" size={18} color="#198754" />
                    <Text style={styles.viewOrderButtonText}>
                      Xem chi tiết đơn hàng
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 4,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  // Empty table styles
  emptyTableContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTableTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyTableSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
  },
  createOrderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#198754",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createOrderButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 8,
  },
  // Order styles
  orderContainer: {
    padding: 20,
  },
  orderHeader: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderCode: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#198754",
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 14,
    color: "#666",
  },
  customerContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  customerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  customerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: "#666",
  },
  productsContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  productsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  productItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  productInfo: {
    flex: 1,
    paddingRight: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  productUnit: {
    fontSize: 12,
    color: "#666",
  },
  productPricing: {
    alignItems: "flex-end",
  },
  productPrice: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  productTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#198754",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: "#f0f0f0",
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#198754",
  },
  actionButtons: {
    marginTop: 16,
  },
  viewOrderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#198754",
  },
  viewOrderButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#198754",
    marginLeft: 8,
  },
});

export default TableDetailModal;
