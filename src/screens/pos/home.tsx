import React, { useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  authService,
  Category,
  Product,
  UserInfo,
  warehouseService,
} from "@/api";
import CategoryList from "@/src/components/business/CategoryList";
import OrderBottomSheet from "@/src/components/business/OrderBottomSheet";
import OrderDetailsModal from "@/src/components/business/OrderDetailsModal";
import ProductList from "@/src/components/business/ProductList";
import UserInfoCard from "@/src/components/business/UserInfoCard";
import AppBar from "@/src/components/common/AppBar";
import DrawerMenu from "@/src/components/common/DrawerMenu";

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
}

export default function HomeScreen() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      loadProducts(selectedCategoryId);
    }
  }, [selectedCategoryId]);

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

        // Auto-select first category
        if (saleableCategories.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(saleableCategories[0].id);
        }

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

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const handleProductSelect = (product: Product) => {
    console.log("🍔 Product selected:", product.title);
    // TODO: Handle product selection (add to cart, show details, etc.)
    Alert.alert("Món ăn", `Bạn đã chọn: ${product.title}`, [{ text: "OK" }]);
  };

  const handleMenuPress = () => {
    setDrawerVisible(true);
  };

  const handleReloadPress = async () => {
    setRefreshing(true);
    await loadInitialData();
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
    await loadInitialData();
    setRefreshing(false);
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
    setOrderItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems((prevItems) =>
      prevItems.filter((item) => item.id !== itemId)
    );
  };

  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <View style={styles.container}>
        {/* AppBar */}
        <AppBar
          onMenuPress={handleMenuPress}
          onReloadPress={handleReloadPress}
        />

        {/* Main Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#198754"]}
              tintColor="#198754"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* User Info Card */}
          <UserInfoCard userInfo={userInfo} loading={loading} />

          {/* Menu Section */}
          <View style={styles.menuSection}>
            {/* Category List */}
            <CategoryList
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onCategorySelect={handleCategorySelect}
              loading={categoriesLoading}
            />

            {/* Product List */}
            <ProductList
              products={products}
              loading={productsLoading}
              onProductSelect={handleProductSelect}
              onAddToOrder={handleAddToOrder}
            />
          </View>

          {/* Additional content can be added here */}
          <View style={styles.spacer} />
        </ScrollView>

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
});
