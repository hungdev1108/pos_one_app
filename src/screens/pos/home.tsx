/**
 * HOME SCREEN - POS System
 * 
 * ===== LUỒNG CHUYỂN BÀN MỚI =====
 * 1. Khi chuyển bàn → tự động TẠO ĐƠN HÀNG THẬT trong DB cho bàn hiện tại (nếu có món)
 * 2. Bàn trống → load draft order (nếu có) để tiếp tục chỉnh sửa
 * 3. Bàn có khách → xóa draft order và load order hiện tại từ areas data
 * 4. Fallback: Nếu tạo order thất bại → lưu vào draft order
 * 5. Tạo đơn hàng thành công → xóa draft order
 * 
 * ===== AUTO ORDER CREATION =====
 * - autoCreateOrderInDB() - Tự động tạo đơn hàng thực trong database
 * - loadOrderFromAPIForOccupiedTable() - Load order hiện tại của bàn có khách
 * 
 * ===== DRAFT ORDER MANAGEMENT (Fallback) =====
 * - draftOrders: Map<tableId, DraftOrder> - Backup khi tạo order thất bại
 * - saveDraftOrder() - Lưu order nháp cho bàn
 * - loadDraftOrder() - Load order nháp của bàn
 * - clearDraftOrder() - Xóa order nháp của bàn
 * - hasDraftOrder() - Kiểm tra bàn có order nháp không
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Area,
  authService,
  Category,
  OrderListItem,
  ordersService,
  Product,
  Table,
  UserInfo,
  warehouseService
} from "@/src/api";
import AllCategoriesProductList from "@/src/components/business/AllCategoriesProductList";
import AreasTablesView from "@/src/components/business/AreasTablesView";
import CategoryBottomSheet from "@/src/components/business/CategoryBottomSheet";
import OrderBottomSheet from "@/src/components/business/OrderBottomSheet";
import OrdersView from "@/src/components/business/OrdersView";
import PaymentModal from "@/src/components/business/PaymentModal";
import UnifiedOrderModal from "@/src/components/business/UnifiedOrderModal";
import AppBar from "@/src/components/common/AppBar";
import DrawerMenu from "@/src/components/common/DrawerMenu";
import { showAddProductToast, showAutoSaveFailedToast, showAutoSaveOrderToast } from "@/src/components/common/ToastCustome";
import { useAreasData } from "@/src/hooks/useAreasData";

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

// Interface cho thông tin đơn hàng tạm thời - dùng cho luồng thanh toán mới
interface TempOrderData {
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  orderItems: OrderItem[];
  customerInfo: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
  };
  selectedTable?: Table | null;
  orderId?: string; // ID đơn hàng sau khi tạo
}

// Interface cho draft order (đơn hàng nháp theo bàn)
interface DraftOrder {
  tableId: string;
  tableName: string;
  orderItems: OrderItem[];
  customerInfo?: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
  };
  createdAt: number;
  modifiedAt: number;
}

interface PaymentData {
  totalAmount: number;
  customerPaid: number;
  change: number;
  paymentMethod: "cash" | "bank";
  bankCode?: string;
  voucher?: string;
}

const { width } = Dimensions.get("window");
const isTablet = width >= 720;

export default function HomeScreen() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<{
    [categoryId: string]: Product[];
  }>({});
  
  // Use the new areas hook
  const { 
    areas, 
    loading: areasLoading, 
    error: areasError,
    loadAreas, 
    refreshAreas 
  } = useAreasData();
  
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
  
  // ===== NEW: Draft orders management =====
  const [draftOrders, setDraftOrders] = useState<Map<string, DraftOrder>>(new Map());
  const [savingDraft, setSavingDraft] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [allProductsLoading, setAllProductsLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(TabType.TABLES);
  const [categoryBottomSheetVisible, setCategoryBottomSheetVisible] =
    useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderListItem | undefined>(
    undefined
  );
  const [orderDetailRefreshTrigger, setOrderDetailRefreshTrigger] = useState(0);
  const [ordersRefreshTrigger, setOrdersRefreshTrigger] = useState(0);

  const [unifiedOrderModalVisible, setUnifiedOrderModalVisible] =
    useState(false);
  const [autoOpenPaymentForNewOrder, setAutoOpenPaymentForNewOrder] =
    useState(false);

  // State cho luồng thanh toán mới tối ưu
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [tempOrderData, setTempOrderData] = useState<TempOrderData | null>(
    null
  );

  // ===== DRAFT ORDERS UTILITIES =====
  
  /**
   * Lưu draft order cho bàn hiện tại
   */
  const saveDraftOrder = async (tableId: string, tableName: string, items: OrderItem[]) => {
    if (items.length === 0) {
      // Nếu không có món nào, xóa draft order của bàn này
      setDraftOrders(prev => {
        const newMap = new Map(prev);
        newMap.delete(tableId);
        return newMap;
      });
      console.log(`🗑️ Removed empty draft order for table ${tableName}`);
      return;
    }

    const draftOrder: DraftOrder = {
      tableId,
      tableName,
      orderItems: [...items], // Clone array
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    };

    setDraftOrders(prev => {
      const newMap = new Map(prev);
      const existingDraft = newMap.get(tableId);
      if (existingDraft) {
        draftOrder.createdAt = existingDraft.createdAt; // Giữ nguyên thời gian tạo
      }
      newMap.set(tableId, draftOrder);
      return newMap;
    });

    console.log(`💾 Saved draft order for table ${tableName} with ${items.length} items`);
  };

  /**
   * Load draft order cho bàn được chọn
   */
  const loadDraftOrder = (tableId: string): OrderItem[] => {
    const draftOrder = draftOrders.get(tableId);
    if (draftOrder) {
      console.log(`📋 Loaded draft order for table ${draftOrder.tableName} with ${draftOrder.orderItems.length} items`);
      return [...draftOrder.orderItems]; // Clone array
    }
    return [];
  };

  /**
   * Xóa draft order của bàn
   */
  const clearDraftOrder = (tableId: string, tableName: string) => {
    setDraftOrders(prev => {
      const newMap = new Map(prev);
      newMap.delete(tableId);
      return newMap;
    });
    console.log(`🗑️ Cleared draft order for table ${tableName}`);
  };

  /**
   * Kiểm tra bàn có draft order không
   */
  const hasDraftOrder = (tableId: string): boolean => {
    return draftOrders.has(tableId);
  };

  /**
   * Tự động tạo đơn hàng thực trong database
   * Thay thế cho việc lưu draft order
   */
  const autoCreateOrderInDB = async (tableId: string, tableName: string, items: OrderItem[]): Promise<string | null> => {
    if (items.length === 0) {
      console.log(`⚠️ No items to create order for table ${tableName}`);
      return null;
    }

    try {
      console.log(`🍽️ Auto-creating order in DB for table ${tableName} with ${items.length} items`);

      // ✅ Generate GUID ID for order consistency
      const generateGuid = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const orderId = generateGuid();

      // Chuẩn bị dữ liệu sản phẩm
      const products = items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        priceIncludeVAT: item.product.priceAfterDiscount || item.product.price,
        note: "",
        vat: 10,
        name: item.product.title.trim(),
        productCode: item.product.code,
        unitName: item.product.unitName || "Cái",
      }));

      // Sử dụng thông tin khách hàng mặc định
      const finalCustomerName = "Người mua không cung cấp thông tin";
      const finalCustomerPhone = "0000000000";

      // Tạo request
      const orderData: any = {
        id: orderId, // ✅ GUID ID for consistency
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        products,
        note: `Auto-created order for table ${tableName}`,
        paymentMethod: 0,
        priceIncludeVAT: true,
        discountType: 0,
        discount: 0,
        discountVAT: 0,
        orderCustomerName: finalCustomerName,
        orderCustomerPhone: finalCustomerPhone,
        isDelivery: false,
        tableId: tableId,
        debt: {
          debit: 0,
          debitExpire: new Date().toISOString(),
        },
        delivery: {
          deliveryId: 0,
          deliveryName: "",
          deliveryCode: "",
          deliveryFee: 0,
          cod: false,
        },
        flashSales: [],
      };

      const response = await ordersService.createOrder(orderData);

      if (response.successful && response.data) {
        const orderId = response.data.id;
        console.log(`✅ Auto-created order ${response.data.code} for table ${tableName}`);
        
        // Hiển thị toast thông báo tự động lưu thành công
        showAutoSaveOrderToast(tableName, response.data.code);
        
        // Force refresh areas để cập nhật trạng thái bàn ngay lập tức
        console.log("🔄 Force refreshing areas after auto-order creation");
        await refreshAreas();
        
        // Thêm delay nhỏ để đảm bảo UI được cập nhật mượt mà
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return orderId;
      } else {
        throw new Error(response.error || "Không thể tạo đơn hàng tự động");
      }
    } catch (error: any) {
      console.error(`❌ Error auto-creating order for table ${tableName}:`, error);
      
      // ✅ KHÔI PHỤC FALLBACK: Nếu tạo đơn hàng thất bại, lưu vào draft
      console.log(`🔄 Fallback: Saving as draft order for table ${tableName}`);
      await saveDraftOrder(tableId, tableName, items);
      
      // Hiển thị toast thông báo lưu draft
      showAutoSaveFailedToast(tableName);
      
      return null;
    }
  };

  /**
   * Load order thực từ API cho bàn có khách (status = 1)
   * Không dùng cho bàn trống vì bàn trống sẽ load draft order
   */
  const loadOrderFromAPIForOccupiedTable = async (tableId: string, tableName: string): Promise<OrderItem[]> => {
    try {
      console.log(`🔍 Loading existing order for occupied table ${tableName} (${tableId})`);
      
      // Tìm bàn trong areas data để lấy thông tin order
      const targetTable = areas.find(area => 
        area.tables.some(table => table.id === tableId)
      )?.tables.find(table => table.id === tableId);
      
      if (targetTable?.order) {
        console.log(`📋 Found order ${targetTable.order.code} for table ${tableName}`);
        
        // Convert order products to OrderItem format
        const orderItems: OrderItem[] = targetTable.order.products?.map((product: any) => ({
          id: product.id,
          title: product.name,
          price: product.price,
          quantity: product.quantity,
          product: {
            id: product.id,
            title: product.name,
            code: product.id, // Fallback to id if no code
            categoryId: "",
            categoryName: "",
            price: product.price,
            priceAfterDiscount: product.price,
            discount: 0,
            discountType: 0,
            unitName: product.unit?.name || "Cái",
            isActive: true,
            isPublished: true,
            categoryOutputMethod: 0
          }
        })) || [];
        
        return orderItems;
      }
      
      console.log(`ℹ️ No order found for table ${tableName}`);
      return [];
      
    } catch (error) {
      console.error(`❌ Error loading order for table ${tableName}:`, error);
      return [];
    }
  };

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

  // Load areas when switching to TABLES tab (handled by useAreasData hook)
  useEffect(() => {
    if (activeTab === TabType.TABLES) {
      loadAreas(); // Will use cache if data is fresh
    }
  }, [activeTab, loadAreas]);

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

      // console.log("📋 Categories data received:", categoriesData);

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

      // console.log("📦 Products data received:", productsData);

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

  const handleTablePress = async (table: Table, areaName?: string) => {
    console.log("🍽️ Table pressed:", table.name, "in area:", areaName);
    setSavingDraft(true);

    try {
      // Thêm thông tin areaName vào table object
      const tableWithArea = {
        ...table,
        areaName: areaName,
      } as Table & { areaName?: string };

      // BƯỚC 1: Xử lý tự động tạo đơn hàng dựa trên trạng thái bàn hiện tại
      if (selectedTableForOrder && orderItems.length > 0) {
        // ✅ Kiểm tra trạng thái bàn hiện tại
        if (selectedTableForOrder.status === 0) {
          // Bàn trống có món → TỰ ĐỘNG tạo order
          console.log(`🚀 Auto-creating order for empty table: ${selectedTableForOrder.name} with ${orderItems.length} items`);
          
          const orderId = await autoCreateOrderInDB(
            selectedTableForOrder.id,
            selectedTableForOrder.name,
            orderItems
          );
          
          if (orderId) {
            console.log(`✅ Successfully created order for empty table: ${selectedTableForOrder.name}`);
            // Clear draft order sau khi tạo thành công
            clearDraftOrder(selectedTableForOrder.id, selectedTableForOrder.name);
            
            // Force refresh areas để hiển thị ngay đơn hàng vừa tạo
            console.log("🔄 Force refreshing areas after successful auto-order creation in table switch");
            await refreshAreas();
            
            // Chuyển về tab Tables để hiển thị trạng thái bàn đã cập nhật
            setActiveTab(TabType.TABLES);
          } else {
            // ❌ Nếu thất bại, hiển thị lỗi và không chuyển bàn
            Alert.alert(
              "Lỗi tạo đơn hàng", 
              `Không thể tạo đơn hàng cho bàn ${selectedTableForOrder.name}. Vui lòng thử lại hoặc tạo đơn hàng thủ công.`,
              [{ text: "OK" }]
            );
            setSavingDraft(false);
            return; // Không chuyển bàn nếu không tạo được order
          }
        } else {
          // Bàn có khách có order → KHÔNG tự động tạo order, chỉ chuyển bàn
          console.log(`🔄 Switching from occupied table ${selectedTableForOrder.name} with existing order - no auto creation`);
          
          // Clear draft order của bàn cũ (nếu có)
          if (hasDraftOrder(selectedTableForOrder.id)) {
            clearDraftOrder(selectedTableForOrder.id, selectedTableForOrder.name);
            console.log(`🗑️ Cleared draft order for occupied table: ${selectedTableForOrder.name}`);
          }
        }
      }

      // BƯỚC 2: Set bàn mới được chọn
      setSelectedTable(tableWithArea);
      setSelectedTableForOrder(tableWithArea);

      // BƯỚC 3: Xử lý theo trạng thái bàn
      if (table.status === 0) {
        // Bàn trống - load draft order (nếu có) hoặc tạo order mới
        setSelectedOrder(undefined);
        
        // ✅ KHÔI PHỤC: Load draft order của bàn mới (nếu có)
        const draftItems = loadDraftOrder(table.id);
        if (draftItems.length > 0) {
          setOrderItems(draftItems);
          console.log(`📋 Loaded ${draftItems.length} items from draft order for table ${table.name}`);
          
          // Hiển thị thông báo có draft order
          // Alert.alert(
          //   "Đơn hàng nháp",
          //   `Bàn ${table.name} có ${draftItems.length} món trong đơn hàng nháp. Bạn có thể tiếp tục chỉnh sửa hoặc tạo đơn hàng mới.`,
          //   [{ text: "Đã hiểu" }]
          // );
        } else {
          // Không có draft order - clear orderItems và tạo order mới
          setOrderItems([]);
          console.log(`🆕 Empty table ${table.name} selected - no draft order found, creating new order`);
        }
        
        // Chuyển thẳng sang tab Menu nếu chưa có món
        if (draftItems.length === 0) {
          setActiveTab(TabType.MENU);
        }
      } else {
        // Bàn có khách - clear draft order (nếu có) và load order hiện tại
        if (hasDraftOrder(table.id)) {
          clearDraftOrder(table.id, table.name);
          console.log(`🗑️ Cleared draft order for occupied table ${table.name}`);
        }
        
        // Load order hiện tại của bàn từ areas data
        const existingOrderItems = await loadOrderFromAPIForOccupiedTable(table.id, table.name);
        setOrderItems(existingOrderItems);
        
        // Set selectedOrder để hiển thị thông tin đơn hàng
        if (table.order?.id) {
          loadTableOrder(table.order.id);
        }
      }

      console.log(`✅ Successfully switched to table ${table.name} (${table.status === 0 ? 'empty' : 'occupied'})`);
      
    } catch (error) {
      console.error("❌ Error in handleTablePress:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi chuyển bàn. Vui lòng thử lại.");
    } finally {
      setSavingDraft(false);
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

  const handleOrderCreated = (orderId: string, shouldOpenPayment?: boolean) => {
    console.log(
      "✅ Order created with ID:",
      orderId,
      "shouldOpenPayment:",
      shouldOpenPayment
    );

    // Clear draft order của bàn hiện tại (nếu có)
    if (selectedTableForOrder) {
      clearDraftOrder(selectedTableForOrder.id, selectedTableForOrder.name);
      console.log(`🗑️ Cleared draft order after successful order creation for table ${selectedTableForOrder.name}`);
    }

    // Clear selected table và order items
    setSelectedTableForOrder(null);
    setSelectedTable(null);
    setOrderItems([]);
    setUnifiedOrderModalVisible(false);

    // Force refresh areas ngay lập tức để cập nhật trạng thái bàn
    console.log("🔄 Force refreshing areas/tables data after manual order creation");
    refreshAreas();

    if (shouldOpenPayment) {
      setTimeout(() => {
        setActiveTab(TabType.ORDERS);
        onRefresh();
      }, 300);
    } else {
      setTimeout(() => {
        setActiveTab(TabType.ORDERS);
        onRefresh();
      }, 300);
    }
  };

  const handleClearOrder = () => {
    // Clear draft order của bàn hiện tại (nếu có)
    if (selectedTableForOrder) {
      clearDraftOrder(selectedTableForOrder.id, selectedTableForOrder.name);
      console.log(`🗑️ Cleared draft order for table ${selectedTableForOrder.name}`);
    }
    
    setOrderItems([]);
    setSelectedTableForOrder(null);
    setSelectedTable(null);
    setSelectedOrder(undefined);
    console.log("🗑️ Order items cleared - including selectedOrder and draft orders");
  };

  const handleViewOrder = (table: Table) => {
    console.log("👁️ View order for table:", table.name);
    setUnifiedOrderModalVisible(true);
  };

  const handleOrderPress = (order: OrderListItem) => {
    console.log("📋 Order pressed:", order.code);
    setOrderItems([]);
    setSelectedOrder(order);
    setSelectedTable(null);
    setSelectedTableForOrder(null);
    console.log("📋 Order loaded to bottom sheet.");
  };

  const handleMenuPress = () => {
    setDrawerVisible(true);
  };

  const handleReloadPress = async () => {
    Alert.alert(
      "Quay lại trang chính",
      "Bạn có muốn quay lại trang chính không?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Quay lại", onPress: () => router.replace("/main") },
      ]
    );
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === TabType.TABLES) {
      await refreshAreas();
    } else if (activeTab === TabType.MENU) {
      await Promise.all([loadCategories(), loadAllProducts()]);
    } else if (activeTab === TabType.ORDERS) {
      setOrdersRefreshTrigger((prev) => prev + 1);
    }
    setRefreshing(false);
  };

  const onRefreshAreas = async () => {
    console.log("🔄 Manual refresh of areas requested");
    await refreshAreas();
  };

  const handleAddToOrder = async (product: Product) => {
    const currentPrice = product.priceAfterDiscount || product.price;

    if (selectedOrder) {
      // Logic thêm vào đơn hàng hiện có
      try {
        const orderDetail = await ordersService.getOrderDetail(selectedOrder.id);
        const canAddResult = ordersService.canAddProductToOrder(orderDetail);

        if (!canAddResult.canAdd) {
          Alert.alert("Không thể thêm sản phẩm", canAddResult.reason || "Đơn hàng không hợp lệ");
          return;
        }

        await ordersService.addProductToOrder(selectedOrder.id, {
          productId: product.id,
          quantity: 1,
          price: product.price,
          priceIncludeVAT: currentPrice,
          unitName: product.unitName || "Cái",
          vat: 10,
          name: product.title.trim(),
          productCode: product.code,
        });

        setOrderItems([]);
        setOrderDetailRefreshTrigger((prev) => prev + 1);
        showAddProductToast(product);
      } catch (error: any) {
        console.error("❌ Error adding product to existing order:", error);
        Alert.alert("Lỗi", error.message || "Không thể thêm sản phẩm vào đơn hàng");
      }
      return;
    }

    // Logic thêm vào đơn hàng mới
    setOrderItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      let newItems;
      if (existingItem) {
        newItems = prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [
          ...prevItems,
          {
            id: product.id,
            title: product.title.trim(),
            price: currentPrice,
            quantity: 1,
            product: product,
          },
        ];
      }
      
      // ✅ KHÔI PHỤC AUTO-SAVE DRAFT ORDER cho bàn mới
      // Chỉ save draft cho bàn trống (status = 0)
      if (selectedTableForOrder && selectedTableForOrder.status === 0) {
        setTimeout(() => {
          saveDraftOrder(selectedTableForOrder.id, selectedTableForOrder.name, newItems);
        }, 0);
        console.log(`💾 Auto-saved draft order for empty table: ${selectedTableForOrder.name}`);
      } else {
        console.log(`🛒 Updated order items for table ${selectedTableForOrder?.name || 'unknown'} - no auto-save (occupied table)`);
      }
      
      return newItems;
    });

    console.log("🛒 Added to order:", product.title);
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
    } else {
      setOrderItems((prevItems) => {
        const newItems = prevItems.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        );
        
        // ✅ KHÔI PHỤC AUTO-SAVE DRAFT ORDER cho bàn trống
        if (selectedTableForOrder && selectedTableForOrder.status === 0) {
          setTimeout(() => {
            saveDraftOrder(selectedTableForOrder.id, selectedTableForOrder.name, newItems);
          }, 0);
          console.log(`💾 Auto-saved draft order for empty table: ${selectedTableForOrder.name}`);
        } else {
          console.log(`📝 Updated quantity for table ${selectedTableForOrder?.name || 'unknown'} - no auto-save (occupied table)`);
        }
        
        return newItems;
      });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems((prevItems) => {
      const newItems = prevItems.filter((item) => item.id !== itemId);
      
      // ✅ KHÔI PHỤC AUTO-SAVE DRAFT ORDER cho bàn trống
      if (selectedTableForOrder && selectedTableForOrder.status === 0) {
        setTimeout(() => {
          saveDraftOrder(selectedTableForOrder.id, selectedTableForOrder.name, newItems);
        }, 0);
        console.log(`💾 Auto-saved draft order for empty table: ${selectedTableForOrder.name}`);
      } else {
        console.log(`🗑️ Removed item from table ${selectedTableForOrder?.name || 'unknown'} - no auto-save (occupied table)`);
      }
      
      return newItems;
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
    console.log("🔄 Tab change:", tab);
    setActiveTab(tab);
    if (tab === TabType.TABLES) {
      loadAreas();
    }
  };

  const modalOrderItems = React.useMemo(() => {
    if (selectedOrder) {
      return [];
    } else {
      return orderItems;
    }
  }, [selectedOrder, orderItems]);

  const modalIsPaid = React.useMemo(() => {
    if (selectedOrder) {
      return false;
    }
    return false;
  }, [selectedOrder]);

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
    setAutoOpenPaymentForNewOrder(false);
    if (!selectedTable) {
      setSelectedOrder(undefined);
    }
  };

  const handleDirectPayment = (orderData: TempOrderData) => {
    console.log("🚀 Nhận thông tin đơn hàng tạm để thanh toán:", orderData);
    setTempOrderData(orderData);
    setPaymentModalVisible(true);
  };

  const handlePaymentComplete = async (paymentData: PaymentData) => {
    try {
      if (tempOrderData?.orderId) {
        await ordersService.receiveOrder(tempOrderData.orderId);
        Alert.alert("Thành công", "Đã thanh toán đơn hàng");
        setPaymentModalVisible(false);
        setTempOrderData(null);
        onRefresh();
      }
    } catch (error: any) {
      console.error("❌ Lỗi khi thanh toán:", error);
      Alert.alert("Lỗi", `Không thể thanh toán đơn hàng: ${error.message}`);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case TabType.TABLES:
        return (
          <AreasTablesView
            areas={areas}
            loading={areasLoading}
            error={areasError}
            onRefresh={onRefreshAreas}
            onTablePress={handleTablePress}
            onAreaPress={handleAreaPress}
            selectedTable={selectedTable || selectedTableForOrder}
          />
        );
      case TabType.MENU:
        return (
          <View style={styles.menuSection}>
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
          <OrdersView
            onOrderPress={handleOrderPress}
            onRefresh={onRefresh}
            refreshTrigger={ordersRefreshTrigger}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <View style={styles.container}>
        <AppBar onMenuPress={handleMenuPress} onReloadPress={handleReloadPress} />
        
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === TabType.TABLES && styles.activeTabButton]}
            onPress={() => handleTabChange(TabType.TABLES)}
          >
            <Ionicons
              name="grid-outline"
              size={20}
              color={activeTab === TabType.TABLES ? "#198754" : "#666"}
              style={styles.tabIcon}
            />
            <Text style={[styles.tabButtonText, activeTab === TabType.TABLES && styles.activeTabButtonText]}>
              Khu vực - Bàn
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === TabType.MENU && styles.activeTabButton]}
            onPress={() => handleTabChange(TabType.MENU)}
          >
            <Ionicons
              name="restaurant-outline"
              size={20}
              color={activeTab === TabType.MENU ? "#198754" : "#666"}
              style={styles.tabIcon}
            />
            <Text style={[styles.tabButtonText, activeTab === TabType.MENU && styles.activeTabButtonText]}>
              Thực đơn
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === TabType.ORDERS && styles.activeTabButton]}
            onPress={() => handleTabChange(TabType.ORDERS)}
          >
            <Ionicons
              name="receipt-outline"
              size={20}
              color={activeTab === TabType.ORDERS ? "#198754" : "#666"}
              style={styles.tabIcon}
            />
            <Text style={[styles.tabButtonText, activeTab === TabType.ORDERS && styles.activeTabButtonText]}>
              Đơn hàng
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>{renderTabContent()}</View>

        <DrawerMenu
          visible={drawerVisible}
          onClose={handleDrawerClose}
          userInfo={userInfo}
        />

        <OrderBottomSheet
          visible={
            orderItems.length > 0 ||
            selectedTable !== null ||
            selectedTableForOrder !== null ||
            selectedOrder !== undefined
          }
          orderItems={orderItems}
          selectedTable={selectedTable || selectedTableForOrder}
          totalAmount={totalAmount}
          onPress={handleBottomSheetPress}
          isExistingOrder={(selectedTable || selectedTableForOrder)?.status === 1}
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
          autoOpenPayment={autoOpenPaymentForNewOrder}
          onDirectPayment={handleDirectPayment}
        />

        <PaymentModal
          visible={paymentModalVisible}
          totalAmount={tempOrderData?.totalAmount || 0}
          onClose={() => {
            setPaymentModalVisible(false);
            setTempOrderData(null);
          }}
          onPayment={handlePaymentComplete}
          orderId={tempOrderData?.orderId}
          initialCustomerInfo={tempOrderData?.customerInfo}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#198754",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    flex: 1,
  },
  menuSection: {
    marginTop: 5,
    flex: 1,
  },
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
    paddingVertical: isTablet ? 10 : 15,
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
  tabIcon: {
    marginRight: 4,
  },
});
