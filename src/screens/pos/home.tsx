import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Area,
  areasService,
  authService,
  Category,
  Product,
  Table,
  UserInfo,
  warehouseService,
} from "@/api";
import AllCategoriesProductList from "@/src/components/business/AllCategoriesProductList";
import AreasTablesView from "@/src/components/business/AreasTablesView";
import CategoryBottomSheet from "@/src/components/business/CategoryBottomSheet";
import OrderBottomSheet from "@/src/components/business/OrderBottomSheet";
import OrderDetailsModal from "@/src/components/business/OrderDetailsModal";
import TableDetailModal from "@/src/components/business/TableDetailModal";
import AppBar from "@/src/components/common/AppBar";
import DrawerMenu from "@/src/components/common/DrawerMenu";

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
}

// Enum để quản lý tab hiện tại
enum TabType {
  TABLES = "tables",
  MENU = "menu",
  ORDERS = "orders",
}

export default function HomeScreen() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<{
    [categoryId: string]: Product[];
  }>({});
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);
  const [tableDetailVisible, setTableDetailVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [allProductsLoading, setAllProductsLoading] = useState(true);
  const [areasLoading, setAreasLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(TabType.MENU);
  const [categoryBottomSheetVisible, setCategoryBottomSheetVisible] =
    useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      loadProducts(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  // Load areas when switching to TABLES tab
  useEffect(() => {
    if (activeTab === TabType.TABLES && areas.length === 0) {
      loadAreas();
    }
  }, [activeTab]);

  // Load all products when switching to MENU tab
  useEffect(() => {
    if (
      activeTab === TabType.MENU &&
      categories.length > 0 &&
      Object.keys(allProducts).length === 0
    ) {
      loadAllProducts();
    }
  }, [activeTab, categories.length]);

  // Auto-select first category after allProducts is loaded
  useEffect(() => {
    if (
      categories.length > 0 &&
      Object.keys(allProducts).length > 0 &&
      !selectedCategoryId
    ) {
      setSelectedCategoryId(categories[0].id);
      setSelectedCategory(categories[0]);
    }
  }, [categories.length, Object.keys(allProducts).length, selectedCategoryId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load user info and categories in parallel
      const [userInfoResult, categoriesResult] = await Promise.all([
        authService.getUserInfo(),
        loadCategories(),
      ]);

      setUserInfo(userInfoResult);
      console.log("📱 Initial data loaded");
    } catch (error) {
      console.error("Error loading initial data:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin. Vui lòng thử lại.", [
        { text: "OK" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const categoriesData = await warehouseService.getCategories();

      console.log("📋 Categories data received:", categoriesData);

      // Kiểm tra nếu categoriesData là array hợp lệ
      if (Array.isArray(categoriesData)) {
        // Filter only categories that can be sold
        const saleableCategories = categoriesData.filter(
          (cat) => cat && cat.isSale
        );
        setCategories(saleableCategories);

        console.log("✅ Saleable categories set:", saleableCategories.length);
        return saleableCategories;
      } else {
        console.warn("⚠️ Categories data is not an array:", categoriesData);
        setCategories([]);
        return [];
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories([]); // Set empty array thay vì để undefined
      Alert.alert("Lỗi", "Không thể tải danh sách thực đơn.", [{ text: "OK" }]);
      return [];
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadProducts = async (categoryId: string) => {
    try {
      setProductsLoading(true);
      const productsData = await warehouseService.getProducts(categoryId);

      console.log("📦 Products data received:", productsData);

      // Kiểm tra nếu productsData là array hợp lệ
      if (Array.isArray(productsData)) {
        // Filter products that are published (since isActive seems to be false for all)
        // Prioritize isPublished, but fallback to show all if needed
        let filteredProducts = productsData.filter(
          (product) => product && product.isPublished
        );

        // If no published products, show all products to avoid empty list
        if (filteredProducts.length === 0) {
          filteredProducts = productsData.filter((product) => product);
          console.log("⚠️ No published products found, showing all products");
        }

        setProducts(filteredProducts);
        console.log("✅ Filtered products set:", filteredProducts.length);
      } else {
        console.warn("⚠️ Products data is not an array:", productsData);
        setProducts([]);
      }
    } catch (error) {
      console.error("Error loading products:", error);
      setProducts([]); // Set empty array thay vì để undefined
      Alert.alert("Lỗi", "Không thể tải danh sách món ăn. Vui lòng thử lại.", [
        { text: "OK" },
      ]);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadAllProducts = async () => {
    try {
      setAllProductsLoading(true);
      const allProductsData: { [categoryId: string]: Product[] } = {};

      // Load products for each category
      const loadPromises = categories.map(async (category) => {
        try {
          const productsData = await warehouseService.getProducts(category.id);
          if (Array.isArray(productsData)) {
            let filteredProducts = productsData.filter(
              (product) => product && product.isPublished
            );
            if (filteredProducts.length === 0) {
              filteredProducts = productsData.filter((product) => product);
            }
            allProductsData[category.id] = filteredProducts;
          } else {
            allProductsData[category.id] = [];
          }
        } catch (error) {
          console.error(
            `Error loading products for category ${category.title}:`,
            error
          );
          allProductsData[category.id] = [];
        }
      });

      await Promise.all(loadPromises);
      setAllProducts(allProductsData);
      console.log(
        "✅ All products loaded:",
        Object.keys(allProductsData).length
      );
    } catch (error) {
      console.error("Error loading all products:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách món ăn. Vui lòng thử lại.", [
        { text: "OK" },
      ]);
    } finally {
      setAllProductsLoading(false);
    }
  };

  const loadAreas = async () => {
    try {
      setAreasLoading(true);
      const areasData = await areasService.getAreas();

      console.log("🏢 Areas data received:", areasData);
      setAreas(areasData);
    } catch (error) {
      console.error("Error loading areas:", error);
      setAreas([]);
      Alert.alert("Lỗi", "Không thể tải danh sách khu vực. Vui lòng thử lại.", [
        { text: "OK" },
      ]);
    } finally {
      setAreasLoading(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    const category = categories.find((cat) => cat.id === categoryId);
    if (category) {
      setSelectedCategory(category);
    }
  };

  const handleSelectCategory = (category: Category) => {
    handleCategorySelect(category.id);
    setCategoryBottomSheetVisible(false);
  };

  const handleProductSelect = (product: Product) => {
    console.log("🍽️ Product selected:", product.title);
    // TODO: Show product details modal
  };

  const handleTablePress = (table: Table) => {
    console.log("🪑 Table pressed:", table.name);
    setSelectedTable(table);
    setTableDetailVisible(true);
  };

  const handleAreaPress = (area: Area) => {
    console.log("🏢 Area pressed:", area.name);
    // TODO: Handle area press (filter tables, show area details, etc.)
  };

  const handleCreateOrder = (table: Table) => {
    console.log("➕ Create order for table:", table.name);
    setTableDetailVisible(false);
    // TODO: Navigate to order creation screen or open order modal
    Alert.alert("Tạo đơn hàng", `Tạo đơn hàng mới cho ${table.name}`, [
      { text: "OK" },
    ]);
  };

  const handleViewOrder = (table: Table) => {
    console.log("👁️ View order for table:", table.name);
    setTableDetailVisible(false);
    // TODO: Navigate to order details screen
    Alert.alert("Xem đơn hàng", `Xem chi tiết đơn hàng ${table.order?.code}`, [
      { text: "OK" },
    ]);
  };

  const handleMenuPress = () => {
    setDrawerVisible(true);
  };

  const handleReloadPress = async () => {
    setRefreshing(true);

    // Reload data based on current tab
    if (activeTab === TabType.TABLES) {
      await loadAreas();
    } else if (activeTab === TabType.MENU) {
      await loadInitialData();
    }

    setRefreshing(false);
    Alert.alert("Thành công", "Đã cập nhật thông tin mới nhất.", [
      { text: "OK" },
    ]);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);

    if (activeTab === TabType.TABLES) {
      await loadAreas();
    } else if (activeTab === TabType.MENU) {
      await Promise.all([loadCategories(), loadAllProducts()]);
    }

    setRefreshing(false);
  };

  const onRefreshAreas = async () => {
    await loadAreas();
  };

  const handleAddToOrder = (product: Product) => {
    const currentPrice = product.priceAfterDiscount || product.price;

    setOrderItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);

      if (existingItem) {
        // Increase quantity if item already exists
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item
        return [
          ...prevItems,
          {
            id: product.id,
            title: product.title,
            price: currentPrice,
            quantity: 1,
          },
        ];
      }
    });

    console.log("🛒 Added to order:", product.title);
  };

  const handleOrderBottomSheetPress = () => {
    console.log("📋 Order bottom sheet pressed");
    setOrderDetailsVisible(true);
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
    } else {
      setOrderItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems((prevItems) => {
      const newItems = prevItems.filter((item) => item.id !== itemId);
      // Tự động đóng Bottom Sheet nếu không còn sản phẩm nào
      if (newItems.length === 0) {
        setOrderDetailsVisible(false);
      }
      return newItems;
    });
  };

  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Render các tab
  const renderTabContent = () => {
    switch (activeTab) {
      case TabType.TABLES:
        return (
          <AreasTablesView
            areas={areas}
            loading={areasLoading}
            onRefresh={onRefreshAreas}
            onTablePress={handleTablePress}
            onAreaPress={handleAreaPress}
          />
        );
      case TabType.MENU:
        return (
          <View style={styles.menuSection}>
            {/* Category Selector */}
            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => setCategoryBottomSheetVisible(true)}
            >
              <View style={styles.categorySelectorContent}>
                <View style={styles.categorySelectorTextContainer}>
                  <Ionicons
                    name="fast-food-outline"
                    size={20}
                    color="#198754"
                    style={styles.categorySelectorIcon}
                  />
                  <Text style={styles.categorySelectorText}>
                    {selectedCategory
                      ? selectedCategory.title
                      : "Chọn danh mục"}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#333" />
              </View>
            </TouchableOpacity>

            {/* Product List */}
            <AllCategoriesProductList
              categories={categories}
              allProducts={allProducts}
              loading={allProductsLoading || refreshing}
              onProductSelect={handleProductSelect}
              onAddToOrder={handleAddToOrder}
              onRefresh={onRefresh}
              selectedCategoryId={selectedCategoryId}
            />

            {/* Category Bottom Sheet */}
            <CategoryBottomSheet
              visible={categoryBottomSheetVisible}
              onClose={() => setCategoryBottomSheetVisible(false)}
              categories={categories}
              onSelectCategory={handleSelectCategory}
              loading={categoriesLoading}
            />
          </View>
        );
      case TabType.ORDERS:
        return (
          <View style={styles.tabContent}>
            <Ionicons
              name="receipt"
              size={60}
              color="#ddd"
              style={styles.placeholderIcon}
            />
            <Text style={styles.placeholderText}>
              Danh sách đơn hàng (Sẽ được tích hợp API sau)
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <View style={styles.container}>
        {/* AppBar */}
        <AppBar
          onMenuPress={handleMenuPress}
          onReloadPress={handleReloadPress}
        />

        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === TabType.TABLES && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab(TabType.TABLES)}
          >
            <Ionicons
              name="grid-outline"
              size={20}
              color={activeTab === TabType.TABLES ? "#198754" : "#666"}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === TabType.TABLES && styles.activeTabButtonText,
              ]}
            >
              Khu vực - Bàn
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === TabType.MENU && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab(TabType.MENU)}
          >
            <Ionicons
              name="restaurant-outline"
              size={20}
              color={activeTab === TabType.MENU ? "#198754" : "#666"}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === TabType.MENU && styles.activeTabButtonText,
              ]}
            >
              Thực đơn
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === TabType.ORDERS && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab(TabType.ORDERS)}
          >
            <Ionicons
              name="receipt-outline"
              size={20}
              color={activeTab === TabType.ORDERS ? "#198754" : "#666"}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === TabType.ORDERS && styles.activeTabButtonText,
              ]}
            >
              Đơn hàng
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>{renderTabContent()}</View>

        {/* Drawer Menu */}
        <DrawerMenu
          visible={drawerVisible}
          onClose={handleDrawerClose}
          userInfo={userInfo}
        />

        {/* Order Bottom Sheet */}
        <OrderBottomSheet
          visible={orderItems.length > 0}
          orderItems={orderItems}
          totalAmount={totalAmount}
          onPress={handleOrderBottomSheetPress}
        />

        {/* Order Details Modal */}
        <OrderDetailsModal
          visible={orderDetailsVisible}
          onClose={() => setOrderDetailsVisible(false)}
          orderItems={orderItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
        />

        {/* Table Detail Modal */}
        <TableDetailModal
          visible={tableDetailVisible}
          table={selectedTable}
          onClose={() => setTableDetailVisible(false)}
          onCreateOrder={handleCreateOrder}
          onViewOrder={handleViewOrder}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#198754", // Màu của AppBar để không có gap
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  menuSection: {
    marginTop: 5,
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  spacer: {
    height: 50,
  },
  // Styles cho tab bar
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
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: "#198754",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  activeTabButtonText: {
    color: "#198754",
    fontWeight: "bold",
  },
  tabContent: {
    flex: 1,
    paddingTop: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
  },
  placeholderIcon: {
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  // Styles cho category selector
  categorySelector: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categorySelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categorySelectorTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  categorySelectorIcon: {
    marginRight: 8,
  },
  categorySelectorText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  tabIcon: {
    marginRight: 4,
  },
});
