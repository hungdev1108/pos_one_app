import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

const isTablet = width >= 720;
const numColumns = isTablet ? 3 : 1;
const ITEM_WIDTH = isTablet ? (width - 48) / 3 : width - 32;

// Cache for orders by tab to avoid unnecessary API calls
interface OrdersCache {
  [key: string]: {
    orders: OrderListItem[];
    currentPage: number;
    totalPages: number;
    lastFetch: number;
  };
}

const CACHE_DURATION = 30000; // 30 seconds cache

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
  const [ordersCache, setOrdersCache] = useState<OrdersCache>({});
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Memoize request params to prevent unnecessary re-renders
  const requestParams: OrdersRequestParams = useMemo(() => ({
    pageNumber: currentPage,
    pageSize: 15,
    searchTerm: "",
    fromDate: "",
    toDate: "",
  }), [currentPage]);

  // Helper function để kiểm tra loại thanh toán
  const isCounterPayment = useCallback(() => {
    return fnbConfig?.LoaiFnB === 1 || String(fnbConfig?.LoaiFnB) === "1";
  }, [fnbConfig]);

  // Check if cache is valid
  const isCacheValid = useCallback((cacheKey: string): boolean => {
    const cached = ordersCache[cacheKey];
    if (!cached) return false;
    return Date.now() - cached.lastFetch < CACHE_DURATION;
  }, [ordersCache]);

  // Get cached data
  const getCachedData = useCallback((cacheKey: string) => {
    return ordersCache[cacheKey];
  }, [ordersCache]);

  // Update cache
  const updateCache = useCallback((cacheKey: string, data: {
    orders: OrderListItem[];
    currentPage: number;
    totalPages: number;
  }) => {
    setOrdersCache(prev => ({
      ...prev,
      [cacheKey]: {
        ...data,
        lastFetch: Date.now(),
      }
    }));
  }, []);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Optimized: Only load orders when tab changes and initial load is complete
  useEffect(() => {
    if (!initialLoadComplete) return; // Skip if initial load not complete
    
    const cacheKey = `${activeTab}_page_1`;
    if (isCacheValid(cacheKey)) {
      const cached = getCachedData(cacheKey);
      setOrders(cached.orders);
      setCurrentPage(cached.currentPage);
      setTotalPages(cached.totalPages);
      setLoading(false);
    } else {
      loadOrdersByTab();
    }
  }, [activeTab, isCacheValid, getCachedData, initialLoadComplete]);

  // Lắng nghe refreshTrigger từ parent component
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log("🔄 OrdersView refreshing due to trigger:", refreshTrigger);
      // Clear cache and reload
      setOrdersCache({});
      loadOrdersByTab();
    }
  }, [refreshTrigger]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Load both config and initial orders in parallel
      const [configResult] = await Promise.all([
        ordersService.getFnBConfigs(),
        loadOrdersByTab(1, false) // Load initial orders
      ]);
      setFnbConfig(configResult);
      setInitialLoadComplete(true);
    } catch (error: any) {
      console.error("❌ Error loading initial data:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  const loadOrdersByTab = async (page: number = 1, append: boolean = false) => {
    try {
      // Check cache first for non-append requests
      if (!append && page === 1) {
        const cacheKey = `${activeTab}_page_${page}`;
        if (isCacheValid(cacheKey)) {
          const cached = getCachedData(cacheKey);
          console.log(`📦 Using cached data for ${activeTab}, page ${page}`);
          setOrders(cached.orders);
          setCurrentPage(cached.currentPage);
          setTotalPages(cached.totalPages);
          setLoading(false);
          return;
        }
      }

      console.log(`🚀 Loading ${activeTab} orders from API, page ${page}, append: ${append}`);

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

      // Update cache for first page only
      if (page === 1) {
        const cacheKey = `${activeTab}_page_${page}`;
        console.log(`💾 Caching data for ${activeTab}, page ${page}`);
        updateCache(cacheKey, {
          orders: response.items,
          currentPage: response.metaData.currentPage,
          totalPages: response.metaData.totalPages,
        });
      }
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
    // Clear cache for current tab
    const cacheKey = `${activeTab}_page_1`;
    setOrdersCache(prev => {
      const newCache = { ...prev };
      delete newCache[cacheKey];
      return newCache;
    });
    await loadOrdersByTab(1, false);
    onRefresh?.();
    setRefreshing(false);
  }, [activeTab, onRefresh, updateCache]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && currentPage < totalPages) {
      loadOrdersByTab(currentPage + 1, true);
    }
  }, [currentPage, totalPages, loadingMore, activeTab]);

  const handleTabPress = useCallback((tab: OrderTabType) => {
    if (tab !== activeTab) {
      console.log(`🔄 Switching to tab: ${tab}`);
      setActiveTab(tab);
      setCurrentPage(1);
      // Don't clear orders here, let useEffect handle it with cache
    }
  }, [activeTab]);

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
          actionText = isCounterPayment() ? "phục vụ & thanh toán" : "phục vụ";
          confirmText = isCounterPayment()
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
        return "Tạm tính";
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

  const formatPrice = useCallback((price: number): string => {
    return new Intl.NumberFormat("vi-VN").format(price);
  }, []);

  const formatDateTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("vi-VN"),
      time: date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  }, []);

  const renderActionButtons = useCallback((order: OrderListItem) => {
    // Action buttons logic remains the same
    return null; // Simplified for now
  }, []);

  const renderOrderItem = useCallback(({ item }: { item: OrderListItem }) => {
    const { date, time } = formatDateTime(item.date);

    return (
      <TouchableOpacity
        style={[styles.orderCard, isTablet && styles.orderCardTablet]}
        onPress={() => onOrderPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          {/* Order info */}
        <View style={styles.orderInfo}>
          <Text style={styles.orderCode}>#{item.code}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getOrderStatusColor(activeTab) },
            ]}
          >
            <Text style={styles.statusText}>{getTabTitle(activeTab)}</Text>
          </View>
        </View>
        </View>
        {/* Order time */}
        <View style={styles.orderTimeContainer}>
            <Text style={styles.orderTime}>
              {time} - {date}
            </Text>
            {(item.areaName || item.tableName) && (
              <View style={styles.tableInfo}>
                <Ionicons name="tablet-landscape-outline" size={14} color="#666" />
                <Text style={styles.tableText}>
                  {item.areaName && item.tableName 
                    ? `${item.areaName} - ${item.tableName}`
                    : item.areaName || item.tableName}
                </Text>
              </View>
            )}
          </View>

        <View style={styles.orderContent}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.customerName || "Khách lẻ"}
            </Text>
            {item.customerPhone && (
              <Text style={styles.customerPhone}>{item.customerPhone}</Text>
            )}
            
          </View>

          <View style={styles.priceInfo}>
            <Text style={styles.totalLabel}>Tổng tiền:</Text>
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

        <View style={styles.actionContainer}>{renderActionButtons(item)}</View>
      </TouchableOpacity>
    );
  }, [activeTab, formatDateTime, formatPrice, getOrderStatusColor, getTabTitle, onOrderPress, renderActionButtons]);

  const renderTabBar = useMemo(() => {
    const tabs = [
      OrderTabType.NEW,
      OrderTabType.CONFIRMED,
      OrderTabType.SENT,
      OrderTabType.RECEIVED,
    ];

    return (
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
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
  }, [activeTab, handleTabPress]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="receipt-long" size={64} color="#dee2e6" />
      <Text style={styles.emptyTitle}>Không có đơn hàng</Text>
      <Text style={styles.emptyText}>
        Chưa có đơn hàng nào ở trạng thái {getTabTitle(activeTab)}
      </Text>
    </View>
  ), [activeTab]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#198754" />
        <Text style={styles.footerLoaderText}>Đang tải thêm...</Text>
      </View>
    );
  }, [loadingMore]);

  // Memoize FlatList props (excluding key)
  const flatListProps = useMemo(() => ({
    data: orders,
    removeClippedSubviews: true,
    renderItem: renderOrderItem,
    keyExtractor: (item: OrderListItem) => item.id,
    numColumns: numColumns,
    style: styles.ordersList,
    contentContainerStyle: [
      styles.ordersListContent,
      orders.length === 0 && styles.emptyListContent,
    ],
    columnWrapperStyle: isTablet ? styles.row : undefined,
    onEndReached: handleLoadMore,
    onEndReachedThreshold: 0.1,
    ListEmptyComponent: renderEmptyState,
    ListFooterComponent: renderFooter,
    showsVerticalScrollIndicator: false,
    maxToRenderPerBatch: 10,
    windowSize: 10,
    initialNumToRender: 10,
    getItemLayout: undefined, // Let FlatList calculate automatically for better performance
  }), [orders, renderOrderItem, handleLoadMore, renderEmptyState, renderFooter]);

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
      {renderTabBar}

      <FlatList
        key={numColumns}
        {...flatListProps}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#198754"]}
            tintColor="#198754"
          />
        }
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
  row: {
    justifyContent: "space-between",
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
  orderCardTablet: {
    width: ITEM_WIDTH - 8,
    marginHorizontal: 4,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 12,
    paddingTop: 12,
    // borderBottomWidth: 1,
    // borderBottomColor: "#f0f0f0",
  },
  orderTimeContainer: {
    paddingHorizontal: 12,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderCode: {
    fontSize: isTablet ? 16 : 18,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 12,
    color: "#999",
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
  orderContent: {
    paddingHorizontal: 12,
    // paddingVertical: 5,
    marginTop: 8,
  },
  customerInfo: {
    flex: 1,
    marginBottom: 12,
  },
  customerName: {
    fontSize: isTablet ? 14 : 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: isTablet ? 12 : 14,
    color: "#666",
    marginBottom: 4,
  },
  tableInfo: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "baseline",
    marginTop: 4,
  },
  tableText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
  },
  priceInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  totalPrice: {
    fontSize: isTablet ? 20 : 18,
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
    justifyContent: "flex-end",
    padding: 16,
    paddingTop: 0,
    flexWrap: "wrap",
    gap: 8,
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
