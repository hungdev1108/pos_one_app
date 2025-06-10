import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Area,
  areasService,
  authService,
  Category,
  OrderListItem,
  ordersService,
  Product,
  Table,
  UserInfo,
  warehouseService,
} from "@/src/api";
import AllCategoriesProductList from "@/src/components/business/AllCategoriesProductList";
import AreasTablesView from "@/src/components/business/AreasTablesView";
import CategoryBottomSheet from "@/src/components/business/CategoryBottomSheet";
import OrderBottomSheet from "@/src/components/business/OrderBottomSheet";
import OrdersView from "@/src/components/business/OrdersView";
import UnifiedOrderModal from "@/src/components/business/UnifiedOrderModal";
import AppBar from "@/src/components/common/AppBar";
import DrawerMenu from "@/src/components/common/DrawerMenu";
import { showAddProductToast } from "@/src/components/common/ToastCustome";

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  product: Product;
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
  const [selectedTableForOrder, setSelectedTableForOrder] =
    useState<Table | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
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
  const [selectedOrder, setSelectedOrder] = useState<OrderListItem | undefined>(
    undefined
  );
  const [orderDetailRefreshTrigger, setOrderDetailRefreshTrigger] = useState(0);

  const [unifiedOrderModalVisible, setUnifiedOrderModalVisible] =
    useState(false);

  useEffect(() => {
    loadInitialData();

    // Test button visibility service (chỉ chạy khi dev)
    if (__DEV__) {
      const {
        testButtonVisibilityService,
      } = require("@/src/utils/testButtonVisibility");
      testButtonVisibilityService();
    }
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

      // Thử sử dụng API theo branch trước, fallback về API cũ nếu fail
      let categoriesData: Category[] = [];

      try {
        categoriesData = await warehouseService.getCategoriesByBranch();
        console.log("📋 Categories by branch loaded:", categoriesData.length);
      } catch (branchError) {
        console.log(
          "⚠️ Branch categories failed, falling back to general categories"
        );
        categoriesData = await warehouseService.getCategories();
        console.log("📋 General categories loaded:", categoriesData.length);
      }

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

      // Thử sử dụng API theo branch trước, fallback về API cũ nếu fail
      let productsData: Product[] = [];

      try {
        productsData = await warehouseService.getProductsByBranch(
          undefined,
          categoryId
        );
        console.log("📦 Products by branch loaded:", productsData.length);
      } catch (branchError) {
        console.log(
          "⚠️ Branch products failed, falling back to general products"
        );
        productsData = await warehouseService.getProducts(categoryId);
        console.log("📦 General products loaded:", productsData.length);
      }

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
          // Thử sử dụng API theo branch trước
          let productsData: Product[] = [];

          try {
            productsData = await warehouseService.getProductsByBranch(
              undefined,
              category.id
            );
          } catch (branchError) {
            productsData = await warehouseService.getProducts(category.id);
          }

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

  const loadTableOrder = async (orderId: string) => {
    try {
      const orderDetail = await ordersService.getOrderDetail(orderId);
      if (orderDetail) {
        // Tạo OrderListItem từ orderDetail
        const tableOrderListItem: OrderListItem = {
          id: orderDetail.id,
          code: orderDetail.code,
          customerName: orderDetail.customerName || "Khách hàng",
          customerPhone: orderDetail.customerPhone || "",
          customerAddress: "",
          countProducts: orderDetail.products?.length || 0,
          totalPrice:
            orderDetail.totalPayableAmount ||
            orderDetail.products?.reduce(
              (sum, p) => sum + (p.totalCostInclideVAT || p.totalCost || 0),
              0
            ) ||
            0,
          date: orderDetail.createDate,
          exportWarehouse: false,
        };
        setSelectedOrder(tableOrderListItem);
      }
    } catch (error) {
      console.error("Error loading table order:", error);
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
    console.log("🍽️ Table pressed:", table.name);

    // Nếu đang có món trong giỏ hàng và chọn bàn khác
    if (
      orderItems.length > 0 &&
      selectedTableForOrder &&
      selectedTableForOrder.id !== table.id
    ) {
      // Kiểm tra nếu bàn đích đã có order (status = 1)
      if (table.status === 1) {
        // Bàn đã có order - clear món hiện tại và chuyển sang bàn mới
        Alert.alert(
          "Chuyển sang bàn đã có đơn hàng",
          `Bàn ${table.name} đã có đơn hàng. Các món đang chọn sẽ bị xóa và hiển thị thông tin đơn hàng của bàn này.`,
          [
            { text: "Hủy", style: "cancel" },
            {
              text: "Chuyển sang bàn",
              onPress: () => {
                // Clear order items hiện tại
                setOrderItems([]);
                // Chọn bàn mới
                setSelectedTable(table);
                setSelectedTableForOrder(table);
                // Load thông tin đơn hàng của bàn mới
                if (table.order?.id) {
                  loadTableOrder(table.order.id);
                }
                console.log(
                  `🔄 Switched to occupied table ${table.name}, cleared current order items`
                );
              },
            },
          ]
        );
        return;
      } else {
        // Bàn trống - hiển thị thông báo chuyển bàn trống
        Alert.alert(
          "Chuyển bàn",
          `Bạn có muốn chuyển ${orderItems.length} món từ ${selectedTableForOrder.name} sang ${table.name}?`,
          [
            { text: "Hủy", style: "cancel" },
            {
              text: "Chuyển bàn",
              onPress: () => {
                setSelectedTable(table);
                setSelectedTableForOrder(table);
                // Clear selectedOrder khi chuyển sang bàn trống
                setSelectedOrder(undefined);
                console.log(
                  `🔄 Moved ${orderItems.length} items from ${selectedTableForOrder.name} to ${table.name}`
                );
              },
            },
          ]
        );
        return;
      }
    }

    setSelectedTable(table);
    setSelectedTableForOrder(table);

    if (table.status === 0) {
      // Bàn trống - clear selectedOrder để không hiển thị thông tin đơn hàng cũ
      setSelectedOrder(undefined);
      // Chuyển thẳng sang tab Menu nếu chưa có món, hoặc hiển thị bottom sheet
      if (orderItems.length === 0) {
        setActiveTab(TabType.MENU);
      }
      // Bottom sheet sẽ tự động hiển thị nếu có món
    } else {
      // Bàn có khách - load order detail từ API
      if (table.order?.id) {
        loadTableOrder(table.order.id);
      }
      // Bottom sheet sẽ hiển thị thông tin bàn và đơn hàng
    }
  };

  const handleAreaPress = (area: Area) => {
    console.log("🏢 Area pressed:", area.name);
  };

  const handleCreateOrder = (table?: Table) => {
    console.log(
      "➕ Create order for table:",
      table?.name || selectedTableForOrder?.name || "No table selected"
    );

    // Kiểm tra xem có món nào trong giỏ hàng không
    if (orderItems.length === 0) {
      Alert.alert("Chưa có món", "Vui lòng chọn món trước khi tạo đơn hàng.", [
        { text: "OK" },
      ]);
      return;
    }

    // Logic tạo đơn hàng sẽ được thực hiện trong UnifiedOrderModal
    // Không cần mở CreateOrderModal nữa
    console.log("📋 Create order logic will be handled in UnifiedOrderModal");
  };

  const handleOrderCreated = (orderId: string) => {
    console.log("✅ Order created with ID:", orderId);

    // Clear selected table và order items
    setSelectedTableForOrder(null);
    setSelectedTable(null);
    setOrderItems([]);
    setUnifiedOrderModalVisible(false);

    // Refresh areas ngay lập tức để cập nhật trạng thái bàn
    console.log("🔄 Refreshing areas/tables data after order creation");
    loadAreas();

    // Chuyển về tab Đơn hàng với delay nhỏ để smooth transition
    setTimeout(() => {
      setActiveTab(TabType.ORDERS);
      // Reload orders để hiển thị đơn hàng mới
      onRefresh();
    }, 300);
  };

  const handleClearOrder = () => {
    setOrderItems([]);
    setSelectedTableForOrder(null);
    setSelectedTable(null);
    setSelectedOrder(undefined);
    console.log("🗑️ Order items cleared");
  };

  const handleViewOrder = (table: Table) => {
    console.log("👁️ View order for table:", table.name);

    // Mở UnifiedOrderModal thay vì hiển thị thông báo Alert
    setUnifiedOrderModalVisible(true);
  };

  const handleOrderPress = (order: OrderListItem) => {
    console.log("📋 Order pressed:", order.code);

    // Clear order items hiện tại để tránh conflict
    setOrderItems([]);

    // Set selected order để hiển thị trong OrderBottomSheet
    setSelectedOrder(order);

    // Clear selectedTable và selectedTableForOrder vì đang xem đơn hàng riêng lẻ
    setSelectedTable(null);
    setSelectedTableForOrder(null);

    // Không mở modal ngay, để user có thể chọn xem chi tiết hoặc thêm món
    console.log(
      "📋 Order loaded to bottom sheet. User can view details or add items."
    );
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
    } else if (activeTab === TabType.ORDERS) {
      console.log("🔄 Manual reload orders data");
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
    } else if (activeTab === TabType.ORDERS) {
      // OrdersView sẽ tự handle refresh khi onRefresh được gọi
      console.log("🔄 Refreshing orders data");
    }

    setRefreshing(false);
  };

  const onRefreshAreas = async () => {
    await loadAreas();
  };

  const handleAddToOrder = async (product: Product) => {
    const currentPrice = product.priceAfterDiscount || product.price;

    // Nếu có selectedOrder, thêm sản phẩm vào đơn hàng hiện có thông qua API
    if (selectedOrder) {
      try {
        console.log(
          "➕ Adding product to existing order:",
          selectedOrder.code,
          product.title
        );

        // Kiểm tra trạng thái đơn hàng trước khi thêm sản phẩm
        const orderDetail = await ordersService.getOrderDetail(
          selectedOrder.id
        );
        const canAddResult = ordersService.canAddProductToOrder(orderDetail);

        if (!canAddResult.canAdd) {
          Alert.alert(
            "Không thể thêm sản phẩm",
            canAddResult.reason || "Đơn hàng không hợp lệ"
          );
          return;
        }

        // Kiểm tra xem sản phẩm đã tồn tại trong đơn hàng chưa
        const existingProduct = orderDetail.products?.find(
          (p) => p.productName === product.title
        );

        // Chuẩn bị danh sách sản phẩm cập nhật
        let updatedProducts;

        if (existingProduct) {
          // Nếu sản phẩm đã tồn tại, hỏi user có muốn tăng số lượng không
          const shouldIncrease = await new Promise<boolean>((resolve) => {
            Alert.alert(
              "Sản phẩm đã tồn tại",
              `${product.title} đã có trong đơn hàng (số lượng: ${existingProduct.quantity}). Bạn có muốn tăng số lượng không?`,
              [
                { text: "Hủy", style: "cancel", onPress: () => resolve(false) },
                { text: "Tăng số lượng", onPress: () => resolve(true) },
              ]
            );
          });

          if (!shouldIncrease) return;

          // Tăng số lượng sản phẩm hiện có
          updatedProducts = orderDetail.products!.map((p) => ({
            productId: p.id,
            quantity:
              p.productName === product.title ? p.quantity + 1 : p.quantity,
            price: p.price,
            priceIncludeVAT: p.priceIncludeVAT,
            unitName: product.unitName || "Cái",
            vat: 10,
            name: p.productName || "Sản phẩm",
            productCode: p.id.substring(0, 8) || "",
          }));

          console.log("📈 Increasing quantity for existing product");
        } else {
          // Nếu sản phẩm chưa tồn tại, thêm vào cuối danh sách
          const existingProducts =
            orderDetail.products?.map((p) => ({
              productId: p.id,
              quantity: p.quantity,
              price: p.price,
              priceIncludeVAT: p.priceIncludeVAT,
              unitName: product.unitName || "Cái",
              vat: 10,
              name: p.productName || "Sản phẩm",
              productCode: p.id.substring(0, 8) || "",
            })) || [];

          const newProduct = {
            productId: product.id,
            quantity: 1,
            price: product.price,
            priceIncludeVAT: currentPrice,
            unitName: product.unitName || "Cái",
            vat: 10,
            name: product.title || "Sản phẩm mới",
            productCode: product.code || "",
          };

          updatedProducts = [...existingProducts, newProduct];
          console.log("➕ Adding new product to order");
        }

        if (existingProduct) {
          // Nếu là tăng số lượng sản phẩm hiện có, sử dụng updateProductQuantityInOrder
          console.log(
            "📈 Updating quantity for existing product via updateProductQuantityInOrder"
          );
          await ordersService.updateProductQuantityInOrder(
            selectedOrder.id,
            existingProduct.id,
            existingProduct.quantity + 1
          );
          console.log("✅ Product quantity updated successfully");
        } else {
          // Nếu là thêm sản phẩm mới, chỉ cần gọi addProductToOrder cho sản phẩm mới
          console.log("➕ Adding only new product via addProductToOrder");
          await ordersService.addProductToOrder(selectedOrder.id, {
            productId: product.id,
            quantity: 1,
            price: product.price,
            priceIncludeVAT: currentPrice,
            unitName: product.unitName || "Cái",
            vat: 10,
            name: product.title, // Thêm tên sản phẩm từ trường title
            productCode: product.code, // Sử dụng mã sản phẩm thực từ trường code
          });
        }

        // Clear orderItems để tránh hiển thị view order mới song song
        setOrderItems([]);
        console.log("🗑️ Cleared orderItems to avoid duplicate display");

        // const message = existingProduct
        //   ? `Đã tăng số lượng ${product.title} lên ${
        //       existingProduct.quantity + 1
        //     }`
        //   : `Đã thêm ${product.title} vào đơn hàng ${selectedOrder.code}`;

        // Trigger reload orderDetail để cập nhật hiển thị ngay sau khi API thành công
        setOrderDetailRefreshTrigger((prev) => prev + 1);
        console.log("🔄 Triggered orderDetail refresh");

        // Hiển thị một toast message để thông báo thêm sản phẩm thành công, toast sẽ mất sau 2s
        showAddProductToast(product);

        // Alert.alert("Thành công", message);
        console.log("✅ Product updated in existing order successfully");
      } catch (error: any) {
        console.error("❌ Error adding product to existing order:", error);
        Alert.alert(
          "Lỗi",
          error.message || "Không thể thêm sản phẩm vào đơn hàng"
        );
      }
      return;
    }

    // Logic cũ: thêm vào orderItems cho đơn hàng mới
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
            product: product,
          },
        ];
      }
    });

    console.log("🛒 Added to order:", product.title);

    // Nếu chưa có bàn được chọn, hiển thị thông báo gợi ý
    // if (!selectedTableForOrder && orderItems.length === 0) {
    //   setTimeout(() => {
    //     Alert.alert(
    //       "Gợi ý",
    //       "Bạn có thể chọn bàn để gán đơn hàng này, hoặc tiếp tục thêm món và tạo đơn hàng không cần bàn.",
    //       [{ text: "Đã hiểu" }]
    //     );
    //   }, 500);
    // }
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    console.log("🏠 HomeScreen handleUpdateQuantity called with:", {
      itemId,
      newQuantity,
    });
    console.log(
      "🏠 Current selectedOrder:",
      selectedOrder ? selectedOrder.id : "none"
    );

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
      return prevItems.filter((item) => item.id !== itemId);
    });
  };

  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleBottomSheetPress = () => {
    console.log("📋 Bottom sheet pressed - opening unified modal");
    setUnifiedOrderModalVisible(true);
  };

  const handleTabChange = (tab: TabType) => {
    // Keep selected table and order items persistent across tabs
    console.log(
      "🔄 Tab change:",
      tab,
      "| Selected table:",
      selectedTable?.name,
      "| Selected table for order:",
      selectedTableForOrder?.name,
      "| Order items:",
      orderItems.length
    );

    setActiveTab(tab);

    // Refresh data khi chuyển về tab Tables để đảm bảo dữ liệu mới nhất
    if (tab === TabType.TABLES) {
      console.log("🔄 Refreshing areas when switching to Tables tab");
      loadAreas();
    }
  };

  // Xác định đơn hàng nào sẽ hiển thị trong UnifiedOrderModal
  const modalOrderItems = React.useMemo(() => {
    if (selectedOrder) {
      // Nếu có selectedOrder (từ bàn hoặc từ tab Orders), UnifiedOrderModal sẽ tự load data
      return []; // Trả về array rỗng vì UnifiedOrderModal sẽ load từ API
    } else {
      return orderItems; // Hiển thị đơn hàng đang tạo mới
    }
  }, [selectedOrder, orderItems]);

  // Xác định trạng thái thanh toán cho modal
  const modalIsPaid = React.useMemo(() => {
    if (selectedOrder) {
      // Trạng thái thanh toán sẽ được xác định trong UnifiedOrderModal dựa vào orderDetail
      return false; // UnifiedOrderModal sẽ tự kiểm tra receiveDate
    }
    return false;
  }, [selectedOrder]);

  // Xác định tiêu đề cho modal
  const modalTitle = React.useMemo(() => {
    if (selectedOrder && selectedTable?.status === 1) {
      return `Chi tiết đơn - ${selectedTable.name}`;
    } else if (selectedOrder) {
      return `Chi tiết đơn #${selectedOrder.code}`;
    }
    return undefined;
  }, [selectedTable, selectedOrder]);

  const handleCloseUnifiedModal = () => {
    setUnifiedOrderModalVisible(false);

    // Chỉ clear selectedOrder nếu đang ở tab Orders (không có selectedTable)
    // Nếu đang ở tab Tables và chọn bàn, giữ selectedOrder để OrderBottomSheet hiển thị
    if (!selectedTable) {
      setSelectedOrder(undefined);
    }
  };

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
            selectedTable={selectedTable || selectedTableForOrder}
          />
        );
      case TabType.MENU:
        return (
          <View style={styles.menuSection}>
            {/* Product List */}
            <AllCategoriesProductList
              categories={categories}
              allProducts={allProducts}
              loading={allProductsLoading || refreshing}
              onProductSelect={handleProductSelect}
              onAddToOrder={handleAddToOrder}
              onRefresh={onRefresh}
              selectedCategoryId={selectedCategoryId}
              orderItems={orderItems.map((item) => ({
                id: item.id,
                quantity: item.quantity,
              }))}
              onUpdateQuantity={handleUpdateQuantity}
              onCategoryPress={() => setCategoryBottomSheetVisible(true)}
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
          <OrdersView onOrderPress={handleOrderPress} onRefresh={onRefresh} />
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
            onPress={() => handleTabChange(TabType.TABLES)}
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
            onPress={() => handleTabChange(TabType.MENU)}
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
            onPress={() => handleTabChange(TabType.ORDERS)}
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
          visible={
            orderItems.length > 0 || // Có món trong giỏ hàng
            selectedTable !== null || // Có bàn được chọn (bao gồm cả bàn trống)
            selectedTableForOrder !== null || // Có bàn cho đơn hàng
            selectedOrder !== undefined // Đang xem chi tiết đơn hàng
          }
          orderItems={orderItems}
          selectedTable={selectedTable || selectedTableForOrder}
          totalAmount={totalAmount}
          onPress={handleBottomSheetPress}
          isExistingOrder={
            (selectedTable || selectedTableForOrder)?.status === 1
          } // Bàn có khách
          mode={
            selectedOrder
              ? "view"
              : (selectedTable || selectedTableForOrder)?.status === 1
              ? "edit"
              : "create"
          }
          orderCode={
            selectedOrder?.code ||
            (selectedTable || selectedTableForOrder)?.order?.code
          }
          selectedOrder={selectedOrder}
          refreshTrigger={orderDetailRefreshTrigger}
        />

        {/* Unified Order Modal for Table and Order Creation */}
        <UnifiedOrderModal
          visible={unifiedOrderModalVisible}
          orderItems={modalOrderItems}
          selectedTable={selectedTable || selectedTableForOrder}
          selectedOrder={selectedOrder}
          onClose={handleCloseUnifiedModal}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onCreateOrder={handleCreateOrder}
          onClearOrder={handleClearOrder}
          onOrderCreated={handleOrderCreated}
          onRefresh={onRefresh}
          isExistingOrder={selectedTable?.status === 1}
          isPaid={modalIsPaid}
          title={modalTitle}
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
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    paddingHorizontal: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
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
