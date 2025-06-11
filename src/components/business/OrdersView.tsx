import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  FnBConfig,
  OrderListItem,
  OrdersRequestParams,
  ordersService,
} from "@/src/api";

interface OrdersViewProps {
  onOrderPress?: (order: OrderListItem) => void;
  onRefresh?: () => void;
  refreshTrigger?: number;
}

// Enum cho các tab trạng thái đơn hàng
enum OrderTabType {
  NEW = "new",
  CONFIRMED = "confirmed",
  SENT = "sent",
  RECEIVED = "received",
  CANCELLED = "cancelled",
}

const { width } = Dimensions.get("window");

const OrdersView: React.FC<OrdersViewProps> = ({
  onOrderPress,
  onRefresh,
  refreshTrigger,
}) => {
  const [activeTab, setActiveTab] = useState<OrderTabType>(OrderTabType.NEW);
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fnbConfig, setFnbConfig] = useState<FnBConfig | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const requestParams: OrdersRequestParams = {
    pageNumber: currentPage,
    pageSize: 15,
    searchTerm: "",
    fromDate: "",
    toDate: "",
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadOrdersByTab();
  }, [activeTab]);

  // Lắng nghe refreshTrigger từ parent component
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log("🔄 OrdersView refreshing due to trigger:", refreshTrigger);
      loadOrdersByTab();
    }
  }, [refreshTrigger]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [configResult] = await Promise.all([
        ordersService.getFnBConfigs(),
        loadOrdersByTab(),
      ]);
      setFnbConfig(configResult);
    } catch (error: any) {
      console.error("❌ Error loading initial data:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const loadOrdersByTab = async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = { ...requestParams, pageNumber: page };
      let response;

      switch (activeTab) {
        case OrderTabType.NEW:
          response = await ordersService.getNewOrders(params);
          break;
        case OrderTabType.CONFIRMED:
          response = await ordersService.getConfirmedOrders(params);
          break;
        case OrderTabType.SENT:
          response = await ordersService.getSentOrders(params);
          break;
        case OrderTabType.RECEIVED:
          response = await ordersService.getReceivedOrders(params);
          break;
        case OrderTabType.CANCELLED:
          response = await ordersService.getCancelledOrders(params);
          break;
        default:
          response = await ordersService.getNewOrders(params);
      }

      if (append) {
        setOrders((prev) => [...prev, ...response.items]);
      } else {
        setOrders(response.items);
      }

      setCurrentPage(response.metaData.currentPage);
      setTotalPages(response.metaData.totalPages);
    } catch (error: any) {
      console.error(`❌ Error loading ${activeTab} orders:`, error);
      // Don't show alert for empty responses, just log the error
      if (error.message && !error.message.includes("items: []")) {
        Alert.alert(
          "Lỗi",
          `Không thể tải danh sách đơn hàng. ${error.message}`
        );
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await loadOrdersByTab(1, false);
    onRefresh?.();
    setRefreshing(false);
  }, [activeTab, onRefresh]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && currentPage < totalPages) {
      loadOrdersByTab(currentPage + 1, true);
    }
  }, [currentPage, totalPages, loadingMore, activeTab]);

  const handleTabPress = (tab: OrderTabType) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      setCurrentPage(1);
      setOrders([]);
    }
  };

  const handleOrderAction = async (
    orderId: string,
    action: "confirm" | "send" | "receive" | "cancel"
  ) => {
    try {
      let actionText = "";
      let confirmText = "";

      switch (action) {
        case "confirm":
          actionText = "xác nhận";
          confirmText = "Bạn có chắc muốn xác nhận đơn hàng này?";
          break;
        case "send":
          actionText =
            fnbConfig?.LoaiFnB === 1 ? "phục vụ & thanh toán" : "phục vụ";
          confirmText =
            fnbConfig?.LoaiFnB === 1
              ? "Đơn hàng sẽ được chuyển sang trạng thái 'Đã thanh toán' (thanh toán tại quầy)"
              : "Đơn hàng sẽ được chuyển sang trạng thái 'Tạm tính' (chờ thanh toán tại bàn)";
          break;
        case "receive":
          actionText = "thanh toán";
          confirmText = "Xác nhận đã nhận thanh toán cho đơn hàng này?";
          break;
        case "cancel":
          actionText = "hủy";
          confirmText = "Bạn có chắc muốn hủy đơn hàng này?";
          break;
      }

      Alert.alert(
        `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} đơn hàng`,
        confirmText,
        [
          { text: "Không", style: "cancel" },
          {
            text: "Có",
            onPress: async () => {
              try {
                switch (action) {
                  case "confirm":
                    await ordersService.confirmOrder(orderId);
                    break;
                  case "send":
                    await ordersService.sendOrder(orderId);
                    break;
                  case "receive":
                    await ordersService.receiveOrder(orderId);
                    break;
                  case "cancel":
                    await ordersService.cancelOrder(orderId);
                    break;
                }

                Alert.alert(
                  "Thành công",
                  `Đã ${actionText} đơn hàng thành công!`
                );
                handleRefresh();
              } catch (error: any) {
                Alert.alert(
                  "Lỗi",
                  `Không thể ${actionText} đơn hàng: ${error.message}`
                );
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Lỗi", `Có lỗi xảy ra: ${error.message}`);
    }
  };

  const getTabTitle = (tab: OrderTabType): string => {
    switch (tab) {
      case OrderTabType.NEW:
        return "Đơn mới";
      case OrderTabType.CONFIRMED:
        return "Đã xác nhận";
      case OrderTabType.SENT:
        return fnbConfig?.LoaiFnB === 1 ? "Đã thanh toán" : "Tạm tính";
      case OrderTabType.RECEIVED:
        return "Thanh toán";
      case OrderTabType.CANCELLED:
        return "Đã hủy";
      default:
        return "";
    }
  };

  const getTabIcon = (tab: OrderTabType): keyof typeof Ionicons.glyphMap => {
    switch (tab) {
      case OrderTabType.NEW:
        return "document-text-outline";
      case OrderTabType.CONFIRMED:
        return "checkmark-circle-outline";
      case OrderTabType.SENT:
        return "restaurant-outline";
      case OrderTabType.RECEIVED:
        return "card-outline";
      case OrderTabType.CANCELLED:
        return "close-circle-outline";
      default:
        return "document-text-outline";
    }
  };

  const getOrderStatusColor = (tab: OrderTabType): string => {
    switch (tab) {
      case OrderTabType.NEW:
        return "#007bff";
      case OrderTabType.CONFIRMED:
        return "#28a745";
      case OrderTabType.SENT:
        return "#fd7e14";
      case OrderTabType.RECEIVED:
        return "#20c997";
      case OrderTabType.CANCELLED:
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("vi-VN"),
      time: date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const renderActionButtons = (order: OrderListItem) => {
    // Chỉ hiển thị nút Chi tiết
    return [
      <TouchableOpacity
        key="detail"
        style={[styles.actionButton, styles.detailButton]}
        onPress={() => onOrderPress?.(order)}
      >
        <Ionicons name="eye" size={16} color="#198754" />
        <Text style={styles.detailButtonText}>Chi tiết</Text>
      </TouchableOpacity>,
    ];
  };

  const renderOrderItem = ({ item }: { item: OrderListItem }) => {
    const { date, time } = formatDateTime(item.date);
    const statusColor = getOrderStatusColor(activeTab);

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderCodeContainer}>
            <Text style={styles.orderCode}>#{item.code}</Text>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor }]}
            >
              <Text style={styles.statusText}>{getTabTitle(activeTab)}</Text>
            </View>
          </View>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.orderDate}>{date}</Text>
            <Text style={styles.orderTime}>{time}</Text>
          </View>
        </View>

        <View style={styles.orderInfo}>
          <View style={styles.customerInfo}>
            <Ionicons name="person" size={16} color="#666" />
            <Text style={styles.customerName} numberOfLines={1}>
              {item.customerName || "Khách hàng"}
            </Text>
            {item.customerPhone && (
              <Text style={styles.customerPhone}>📞 {item.customerPhone}</Text>
            )}
          </View>

          <View style={styles.orderStats}>
            <View style={styles.statItem}>
              <Ionicons name="restaurant" size={16} color="#198754" />
              <Text style={styles.statText}>{item.countProducts} mặt hàng</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.totalPrice}>
                {formatPrice(item.totalPrice)}
              </Text>
            </View>
          </View>

          {item.voucher && (
            <View style={styles.voucherInfo}>
              <Ionicons name="ticket" size={16} color="#fd7e14" />
              <Text style={styles.voucherText}>
                {item.voucher.voucherCode} (-
                {formatPrice(item.voucher.discount)})
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionContainer}>{renderActionButtons(item)}</View>
      </View>
    );
  };

  const renderTabBar = () => {
    const tabs = [
      OrderTabType.NEW,
      OrderTabType.CONFIRMED,
      OrderTabType.SENT,
      OrderTabType.RECEIVED,
      OrderTabType.CANCELLED,
    ];

    // Ẩn tab SENT nếu là thanh toán tại quầy
    const visibleTabs = tabs.filter(
      (tab) => !(tab === OrderTabType.SENT && fnbConfig?.LoaiFnB === 1)
    );

    return (
      <View style={styles.tabBar}>
        {visibleTabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && styles.activeTabButton,
            ]}
            onPress={() => handleTabPress(tab)}
          >
            <Ionicons
              name={getTabIcon(tab)}
              size={18}
              color={activeTab === tab ? "#198754" : "#666"}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab && styles.activeTabButtonText,
              ]}
              numberOfLines={1}
            >
              {getTabTitle(tab)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="receipt-long" size={64} color="#dee2e6" />
      <Text style={styles.emptyTitle}>Không có đơn hàng</Text>
      <Text style={styles.emptyText}>
        Chưa có đơn hàng nào ở trạng thái {getTabTitle(activeTab)}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#198754" />
        <Text style={styles.footerLoaderText}>Đang tải thêm...</Text>
      </View>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#198754" />
        <Text style={styles.loadingText}>Đang tải danh sách đơn hàng...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderTabBar()}

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        style={styles.ordersList}
        contentContainerStyle={[
          styles.ordersListContent,
          orders.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#198754"]}
            tintColor="#198754"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: "#198754",
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  activeTabButtonText: {
    color: "#198754",
    fontWeight: "bold",
  },
  ordersList: {
    flex: 1,
  },
  ordersListContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  orderCodeContainer: {
    flex: 1,
  },
  orderCode: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  dateTimeContainer: {
    alignItems: "flex-end",
  },
  orderDate: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  orderTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  orderInfo: {
    padding: 16,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  customerName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  customerPhone: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  orderStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#198754",
  },
  voucherInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 8,
    backgroundColor: "#fff3cd",
    borderRadius: 6,
  },
  voucherText: {
    fontSize: 12,
    color: "#856404",
    marginLeft: 4,
    fontWeight: "500",
  },
  actionContainer: {
    flexDirection: "row",
    padding: 16,
    paddingTop: 0,
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  detailButton: {
    backgroundColor: "#fff",
    borderColor: "#198754",
  },
  confirmButton: {
    backgroundColor: "#28a745",
    borderColor: "#28a745",
  },
  sendButton: {
    backgroundColor: "#fd7e14",
    borderColor: "#fd7e14",
  },
  receiveButton: {
    backgroundColor: "#20c997",
    borderColor: "#20c997",
  },
  cancelButton: {
    backgroundColor: "#dc3545",
    borderColor: "#dc3545",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 4,
  },
  detailButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#198754",
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  footerLoaderText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
});

export default OrdersView;
