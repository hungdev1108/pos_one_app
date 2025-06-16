import { Area, Table, TableStatus } from "@/src/api/types";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

interface AreasTablesViewProps {
  areas: Area[];
  loading: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onTablePress?: (table: Table, areaName?: string) => void;
  onAreaPress?: (area: Area) => void;
  selectedTable?: Table | null;
}

const { width } = Dimensions.get("window");

// Responsive layout constants
const isTablet = width >= 720;

// Tablet responsive columns - smart adaptive logic
const getTabletColumns = (screenWidth: number): number => {
  if (!isTablet) return 2; // Mobile always 2 columns
  
  // Tablet: Start with 5 columns as default, adapt based on available width
  const SIDEBAR_WIDTH = 130;
  const TABLET_PADDING = 32;
  const ITEM_SPACING = 16;
  const MIN_ITEM_WIDTH = 120; // Minimum width per item for good UX
  
  // Calculate available width for tables
  const availableWidth = screenWidth - SIDEBAR_WIDTH - TABLET_PADDING;
  
  // Calculate how many columns can fit with minimum width
  const maxPossibleColumns = Math.floor((availableWidth + ITEM_SPACING) / (MIN_ITEM_WIDTH + ITEM_SPACING));
  
  // Target 5 columns, but intelligently adapt
  let columns = 5;
  
  // If screen is too small for 5 columns, reduce appropriately
  if (maxPossibleColumns < 5) {
    columns = Math.max(2, maxPossibleColumns); // Never go below 2 columns
  }
  
  // Cap at 5 for consistency
  columns = Math.min(columns, 5);
  
  console.log(`📱 Tablet tables layout: ${screenWidth}px width, ${availableWidth}px available, ${columns} columns`);
  
  return columns;
};

const numColumns_tablet = getTabletColumns(width);

// Constants for tablet layout calculations
const SIDEBAR_WIDTH = 130;
const TABLET_PADDING = 32; // 16px * 2 sides
const ITEM_SPACING = 16;

const ITEM_WIDTH_tablet = isTablet 
  ? (width - SIDEBAR_WIDTH - TABLET_PADDING - (ITEM_SPACING * (numColumns_tablet - 1))) / numColumns_tablet
  : (width - 48) / 2; // Fallback to mobile width if somehow not tablet

// Cache for expensive calculations
interface AreasCache {
  occupiedTables: { table: Table; areaName: string }[];
  totalAmount: number;
  lastUpdate: number;
}

const CACHE_DURATION = 10000; // 10 seconds cache

const AreasTablesView: React.FC<AreasTablesViewProps> = ({
  areas,
  loading,
  error,
  onRefresh,
  onTablePress,
  onAreaPress,
  selectedTable,
}) => {
  const [tabletSelectedAreaId, setTabletSelectedAreaId] = useState<
    string | null
  >(null);
  const [showAllOccupiedTables, setShowAllOccupiedTables] = useState(false);
  const [areasCache, setAreasCache] = useState<AreasCache | null>(null);

  // Initialize tablet view with first area selected
  useEffect(() => {
    if (
      isTablet &&
      areas.length > 0 &&
      !tabletSelectedAreaId &&
      !showAllOccupiedTables
    ) {
      setTabletSelectedAreaId(areas[0]?.id || null);
    }
  }, [areas, isTablet, tabletSelectedAreaId, showAllOccupiedTables]);

  // Memoized utility functions
  const getTableStatusColor = useCallback((status: TableStatus) => {
    switch (status) {
      case TableStatus.Available:
        return "#28a745"; // Xanh lá - trống
      case TableStatus.Occupied:
        return "#dc3545"; // Đỏ - có khách
      default:
        return "#6c757d"; // Xám - không xác định
    }
  }, []);

  const getTableStatusText = useCallback((status: TableStatus) => {
    switch (status) {
      case TableStatus.Available:
        return "Trống";
      case TableStatus.Occupied:
        return "Có khách";
      default:
        return "N/A";
    }
  }, []);

  const getTableStatusIcon = useCallback((status: TableStatus) => {
    switch (status) {
      case TableStatus.Available:
        return "checkmark-circle";
      case TableStatus.Occupied:
        return "people";
      default:
        return "help-circle";
    }
  }, []);

  const formatPrice = useCallback((price: number): string => {
    return new Intl.NumberFormat("vi-VN").format(price);
  }, []);

  // Format date to dd/M/yyyy (e.g., 16/6/2025)
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1; // getMonth() returns 0-11
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  // Memoized expensive calculations with caching
  const { occupiedTables, totalAmount } = useMemo(() => {
    const now = Date.now();
    
    // Return cached data if still valid
    if (areasCache && (now - areasCache.lastUpdate) < CACHE_DURATION) {
      console.log("📦 Using cached areas data");
      return {
        occupiedTables: areasCache.occupiedTables,
        totalAmount: areasCache.totalAmount
      };
    }

    console.log("🔄 Calculating areas data");
    
    // Calculate occupied tables
    const newOccupiedTables: { table: Table; areaName: string }[] = [];
    let newTotalAmount = 0;

    areas.forEach((area) => {
      area.tables.forEach((table) => {
        if (table.status === TableStatus.Occupied) {
          newOccupiedTables.push({ table, areaName: area.name });
          
          if (table.order) {
            table.order.products.forEach((product) => {
              newTotalAmount += product.totalCostInclideVAT || 0;
            });
          }
        }
      });
    });

    // Update cache
    const newCache: AreasCache = {
      occupiedTables: newOccupiedTables,
      totalAmount: newTotalAmount,
      lastUpdate: now
    };
    setAreasCache(newCache);

    return {
      occupiedTables: newOccupiedTables,
      totalAmount: newTotalAmount
    };
  }, [areas, areasCache]);

  // Memoized table calculations
  const getTableCalculations = useCallback((table: Table) => {
    if (!table.order) return { totalQuantity: 0, totalAmount: 0 };

    const totalQuantity = table.order.products.reduce((sum, product) => {
      return sum + (product.quantity || 0);
    }, 0);

    const totalAmount = table.order.products.reduce((sum, product) => {
      return sum + (product.totalCostInclideVAT || 0);
    }, 0);

    return { totalQuantity, totalAmount };
  }, []);

  // Memoized render functions
  const renderTable = useCallback((table: Table, areaName: string) => {
    const statusColor = getTableStatusColor(table.status);
    const statusText = getTableStatusText(table.status);
    const statusIcon = getTableStatusIcon(table.status);
    const isSelected = selectedTable?.id === table.id;
    const { totalQuantity, totalAmount } = getTableCalculations(table);

    // Layout cho bàn trống
    if (table.status === TableStatus.Available || !table.order) {
      return (
        <TouchableOpacity
          style={[
            styles.tableCardEmpty,
            isSelected && styles.selectedTableCard,
          ]}
          onPress={() => onTablePress?.(table, areaName)}
          key={table.id}
        >
          <View style={styles.emptyTableContent}>
            <Image
              source={require("@/assets/images/icon-table-c.png")}
              style={styles.tableIconLarge}
              resizeMode="contain"
            />
            <Text style={styles.tableNameLarge} numberOfLines={1}>
              {table.name}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Layout cho bàn có khách
    return (
      <TouchableOpacity
        style={[
          styles.tableCard,
          isSelected && styles.selectedTableCard,
        ]}
        onPress={() => onTablePress?.(table, areaName)}
        key={table.id}
      >
        <View style={styles.tableHeader}>
          <View style={styles.tableNameContainer}>
            <Image
              source={require("@/assets/images/icon-table.png")}
              style={styles.tableIcon}
              resizeMode="contain"
            />
            <View style={styles.tableNameContainer_areaName}>
              <Text style={styles.tableName} numberOfLines={1}>
                {table.name}
              </Text>
              <Text style={styles.tableName_areaName}>{areaName}</Text>
            </View>
          </View>
        </View>

        {table.order && (
          <View style={styles.orderInfo}>
            <View style={styles.timeAndCustomerContainer}>
              {table.status === TableStatus.Occupied && (
                <View style={styles.customerIconContainer}>
                  <FontAwesome6 name="person" size={22} color="#666" />
                </View>
              )}
              <View style={styles.timeInfoContainer}>
                <View style={styles.timeContainer}>
                  <Text style={styles.timeLabel}>Giờ vào:</Text>
                  <Text style={styles.orderTime}>
                    {new Date(table.order.createDate).toLocaleTimeString(
                      "vi-VN",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </Text>
                </View>

                <View style={styles.dateContainer}>
                  <Text style={styles.orderDate}>
                    {formatDate(table.order.createDate)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.bottomInfo}>
              <View style={styles.productCountContainer}>
                <Text style={styles.productCountNumber}>{totalQuantity}</Text>
                <Text style={styles.productCountText}> món</Text>
              </View>
              <View style={styles.totalAmountContainer}>
                <Text style={styles.totalAmount} numberOfLines={2}>
                  {formatPrice(totalAmount)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [selectedTable, getTableStatusColor, getTableStatusText, getTableStatusIcon, getTableCalculations, formatPrice, formatDate, onTablePress]);

  // Memoized tablet area item
  const renderTabletAreaItem = useCallback((area: Area) => {
    const isSelected =
      tabletSelectedAreaId === area.id && !showAllOccupiedTables;
    const availableTables = area.tables.filter(
      (t) => t.status === TableStatus.Available
    ).length;
    const occupiedTablesCount = area.tables.filter(
      (t) => t.status === TableStatus.Occupied
    ).length;

    return (
      <TouchableOpacity
        key={area.id}
        style={[
          styles.tabletAreaItem,
          isSelected && styles.tabletAreaItemSelected,
        ]}
        onPress={() => {
          setTabletSelectedAreaId(area.id);
          setShowAllOccupiedTables(false);
          onAreaPress?.(area);
        }}
      >
        <Text
          style={[
            styles.tabletAreaText,
            isSelected && styles.tabletAreaTextSelected,
          ]}
          numberOfLines={1}
        >
          {area.name}
        </Text>
        <View style={styles.tabletAreaStats}>
          <Text style={styles.tabletAreaStatsText}>
            {availableTables} trống • {occupiedTablesCount} có khách
          </Text>
        </View>
        {isSelected && <View style={styles.tabletAreaIndicator} />}
      </TouchableOpacity>
    );
  }, [tabletSelectedAreaId, showAllOccupiedTables, onAreaPress]);

  // Memoized tablet selected area tables
  const renderTabletSelectedAreaTables = useCallback(() => {
    // Show all occupied tables
    if (showAllOccupiedTables) {
      return (
        <View style={styles.tabletTablesContainer}>
          <Text style={styles.tabletSelectedAreaTitle}>
            Tất cả bàn đang có khách
          </Text>

          {occupiedTables.length === 0 ? (
            <View style={styles.tabletEmptyTables}>
              <Ionicons
                name="tablet-landscape-outline"
                size={48}
                color="#dee2e6"
              />
              <Text style={styles.tabletEmptyTablesText}>
                Không có bàn nào đang có khách
              </Text>
            </View>
          ) : (
            <View style={styles.tabletTablesGrid}>
              {occupiedTables.map(({ table, areaName }) =>
                renderTable(table, areaName)
              )}
            </View>
          )}
        </View>
      );
    }

    // Show specific area tables
    if (!tabletSelectedAreaId) return null;

    const selectedArea = areas.find((area) => area.id === tabletSelectedAreaId);
    if (!selectedArea) return null;

    return (
      <View style={styles.tabletTablesContainer}>
        <Text style={styles.tabletSelectedAreaTitle}>{selectedArea.name}</Text>

        {selectedArea.tables.length === 0 ? (
          <View style={styles.tabletEmptyTables}>
            <Ionicons
              name="tablet-landscape-outline"
              size={48}
              color="#dee2e6"
            />
            <Text style={styles.tabletEmptyTablesText}>
              Chưa có bàn nào trong khu vực này
            </Text>
          </View>
        ) : (
          <View style={styles.tabletTablesGrid}>
            {selectedArea.tables.map((table) =>
              renderTable(table, selectedArea.name)
            )}
          </View>
        )}
      </View>
    );
  }, [showAllOccupiedTables, occupiedTables, tabletSelectedAreaId, areas, renderTable]);

  // Memoized area render for mobile
  const renderArea = useCallback(({ item: area }: { item: Area }) => {
    const availableTables = area.tables.filter(
      (t) => t.status === TableStatus.Available
    ).length;
    const occupiedTablesCount = area.tables.filter(
      (t) => t.status === TableStatus.Occupied
    ).length;

    return (
      <View style={styles.areaContainer}>
        <TouchableOpacity
          style={styles.areaHeader}
          onPress={() => onAreaPress?.(area)}
        >
          <View style={styles.areaInfo}>
            <Ionicons name="tablet-landscape-outline" size={20} color="#666" />
            <Text style={styles.areaName}>{area.name}</Text>
          </View>
          <View style={styles.areaStats}>
            {occupiedTablesCount > 0 ? (
              <Text style={styles.statsText_available}>
                {availableTables} bàn trống • {occupiedTablesCount} bàn có khách
              </Text>
            ) : (
              <Text style={styles.statsText_occupied}>
                {availableTables} bàn trống • {occupiedTablesCount} bàn có khách
              </Text>
            )}
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </View>
        </TouchableOpacity>

        <View style={styles.tablesGrid}>
          {area.tables.map((table) => renderTable(table, area.name))}
        </View>
      </View>
    );
  }, [onAreaPress, renderTable]);

  // Memoized refresh control
  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={loading}
      onRefresh={onRefresh}
      colors={["#198754"]}
      tintColor="#198754"
    />
  ), [loading, onRefresh]);

  // Clear cache when areas change significantly
  useEffect(() => {
    if (areas.length === 0) {
      setAreasCache(null);
      console.log("🗑️ Cleared areas cache - no areas data");
    } else {
      console.log(`📊 Areas data updated: ${areas.length} areas, ${occupiedTables.length} occupied tables`);
    }
  }, [areas.length, occupiedTables.length]);

  if (areas.length === 0 && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons 
          name={error ? "alert-circle-outline" : "business-outline"} 
          size={60} 
          color={error ? "#dc3545" : "#ddd"} 
        />
        <Text style={[styles.emptyText, error && styles.errorText]}>
          {error || "Chưa có khu vực nào"}
        </Text>
        {error && (
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={onRefresh}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Tablet layout with sidebar
  if (isTablet) {
    const totalOccupiedCount = occupiedTables.length;

    return (
      <View style={styles.tabletContainer}>
        {/* Left: Tables */}
        <View style={styles.tabletTablesSection}>
          <ScrollView
            style={styles.tabletTablesScrollView}
            contentContainerStyle={styles.tabletTablesScrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
          >
            {renderTabletSelectedAreaTables()}
          </ScrollView>
        </View>

        {/* Right: Areas Sidebar */}
        <View style={styles.tabletSidebar}>
          <ScrollView
            style={styles.tabletAreasScrollView}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={[
                styles.tabletSidebarHeader,
                styles.tableAllOccupiedTables,
                showAllOccupiedTables &&
                  styles.tabletSidebarHeaderActiveAllOccupiedTables,
              ]}
              onPress={() => {
                setShowAllOccupiedTables(true);
                setTabletSelectedAreaId(null);
              }}
            >
              <Text style={[styles.tabletOccupiedCount]}>
                {totalOccupiedCount} bàn
              </Text>
              <Text style={[styles.tabletTotalAmount]}>
                {formatPrice(totalAmount)}
              </Text>
            </TouchableOpacity>
            {areas.map((area) => renderTabletAreaItem(area))}
          </ScrollView>
        </View>
      </View>
    );
  }

  // Mobile layout (original)
  return (
    <FlatList
      data={areas}
      removeClippedSubviews={true}
      renderItem={renderArea}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      maxToRenderPerBatch={3}
      windowSize={8}
      initialNumToRender={2}
      updateCellsBatchingPeriod={50}
      getItemLayout={undefined} // Let FlatList calculate automatically for better performance with dynamic content
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  areaContainer: {
    marginTop: 16,
    // marginBottom: 16,
  },
  areaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  areaInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  areaName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  areaStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsText: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  tablesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 1,
  },
  tableCard: {
    backgroundColor: "#a6e9d5",
    borderRadius: 12,
    padding: 12,
    marginBottom: isTablet ? 0 : 12,
    width: isTablet ? ITEM_WIDTH_tablet : (width - 48) / 2,
    // borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: 140,
  },
  // Styles cho bàn trống
  tableCardEmpty: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: isTablet ? 0 : 12,
    width: isTablet ? ITEM_WIDTH_tablet : (width - 48) / 2 - 6,
    // borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTableContent: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  tableIconLarge: {
    width: 32,
    height: 32,
    marginBottom: 8,
  },
  tableNameLarge: {
    fontSize: (() => {
      if (!isTablet) return 18; // Mobile
      if (width < 768) return 14; // Small tablet
      if (width < 1024) return 15; // Medium tablet
      return 16; // Large tablet
    })(),
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  statusBadgeLarge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusTextLarge: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 4,
  },
  // Styles cho bàn có khách (giữ nguyên)
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  tableNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  tableIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  tableName: {
    fontSize: (() => {
      if (!isTablet) return 16; // Mobile
      if (width < 768) return 12; // Small tablet
      if (width < 1024) return 13; // Medium tablet
      return 14; // Large tablet
    })(),
    fontWeight: "bold",
    color: "#333",
    // flex: 1,
  },
  tableNameContainer_areaName: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
    // marginRight: 8,
  },
  tableName_areaName: {
    fontSize: 13,
    color: "#666",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 50,
    justifyContent: "center",
  },
  statusText: {
    fontSize: 9,
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 2,
  },
  orderInfo: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 8,
    flex: 1,
  },
  timeAndCustomerContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  customerIconContainer: {
    marginRight: 8,
    marginTop: 2,
  },
  timeInfoContainer: {
    flex: 1,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 2,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 13,
    color: "#777",
    fontWeight: "500",
    marginRight: 2,
  },
  orderDate: {
    fontSize: 13,
    color: "#777",
    fontWeight: "500",
  },
  orderTime: {
    fontSize: 13,
    color: "#777",
    fontWeight: "500",
  },
  customerName: {
    fontSize: 12,
    color: "#333",
    marginBottom: 6,
  },
  bottomInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "auto",
    paddingTop: 4,
  },
  productCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  totalAmountContainer: {
    flex: 1,
    alignItems: "flex-end",
    marginLeft: 8,
  },
  totalAmount: {
    fontSize: (() => {
      if (!isTablet) return 15; // Mobile
      if (width < 768) return 12; // Small tablet
      if (width < 1024) return 13; // Medium tablet
      return 14; // Large tablet
    })(),
    fontWeight: "bold",
    // color: "#dc3545",
    color: "#198754",
    textAlign: "right",
    lineHeight: (() => {
      if (!isTablet) return 14; // Mobile
      if (width < 768) return 11; // Small tablet
      if (width < 1024) return 12; // Medium tablet
      return 13; // Large tablet
    })(),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
  },
  errorText: {
    color: "#dc3545",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#198754",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  selectedTableCard: {
    // backgroundColor: "#ffe6e6", // Màu đỏ nhạt
    backgroundColor: "#ffe69c",
    // borderWidth: 1,
    // borderColor: "#ff9999",
  },
  areaStatsText: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 10,
  },
  productCountContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  productCountNumber: {
    fontSize: (() => {
      if (!isTablet) return 16; // Mobile
      if (width < 768) return 13; // Small tablet
      if (width < 1024) return 14; // Medium tablet
      return 15; // Large tablet
    })(),
    fontWeight: "bold",
    color: "#333",
  },
  productCountText: {
    fontSize: 13,
    color: "#666",
  },
  statsText_available: {
    fontSize: 14,
    color: "#198754",
  },
  statsText_occupied: {
    fontSize: 14,
    color: "#666",
  },
  // Tablet-specific styles
  tabletContainer: {
    flex: 1,
    flexDirection: "row",
  },
  tabletTablesSection: {
    flex: 1,
  },
  tabletTablesScrollView: {
    flex: 1,
  },
  tabletTablesScrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra padding for bottom navigation
  },
  tabletSidebar: {
    width: 130,
    backgroundColor: "#f8f9fa",
    borderLeftWidth: 1,
    borderLeftColor: "#e9ecef",
  },
  tabletSidebarHeader: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    alignItems: "center",
  },
  tableAllOccupiedTables: {
    backgroundColor: "#5470ff",
  },
  tabletSidebarHeaderActive: {
    backgroundColor: "#e8f5e8",
  },
  tabletSidebarHeaderActiveAllOccupiedTables: {
    backgroundColor: "#3d9970",
  },
  tabletOccupiedCount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  tabletTotalAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  tabletAreasScrollView: {
    flex: 1,
  },
  tabletAreaItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    position: "relative",
  },
  tabletAreaItemSelected: {
    backgroundColor: "#e8f5e8",
  },
  tabletAreaText: {
    fontSize: (() => {
      if (width < 768) return 12; // Small tablet
      if (width < 1024) return 13; // Medium tablet
      return 14; // Large tablet
    })(),
    color: "#666",
    fontWeight: "500",
    marginBottom: 4,
  },
  tabletAreaTextSelected: {
    color: "#198754",
    fontWeight: "bold",
  },
  tabletAreaStats: {
    marginTop: 2,
  },
  tabletAreaStatsText: {
    fontSize: 12,
    color: "#777",
  },
  tabletAreaIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#198754",
  },
  tabletTablesContainer: {
    flex: 1,
  },
  tabletSelectedAreaTitle: {
    fontSize: isTablet ? 14 : 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: isTablet ? 8 : 16,
  },
  tabletTablesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: ITEM_SPACING, // Consistent spacing between tables
  },
  tabletEmptyTables: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  tabletEmptyTablesText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
});

export default AreasTablesView;
