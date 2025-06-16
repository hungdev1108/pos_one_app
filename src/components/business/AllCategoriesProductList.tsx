import { Category, Product } from "@/src/api";
import { API_CONFIG } from "@/src/api/constants";
import { Entypo, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface AllCategoriesProductListProps {
  categories: Category[];
  allProducts: { [categoryId: string]: Product[] };
  loading: boolean;
  onProductSelect: (product: Product) => void;
  onAddToOrder: (product: Product) => void;
  onRefresh?: () => void;
  selectedCategoryId?: string | null;
  orderItems?: { id: string; quantity: number }[];
  onUpdateQuantity?: (productId: string, newQuantity: number) => void;
  onCategoryPress?: () => void;
}

const { width } = Dimensions.get("window");

// Responsive layout constants
const isTablet = width >= 720;
const isSmallTablet = width >= 560;

// Mobile layout
const numColumns = 2;
const ITEM_WIDTH = (width - 48) / numColumns;

// Tablet responsive columns - smart adaptive logic
const getTabletColumns = (screenWidth: number): number => {
  if (!isTablet) return 2; // Mobile always 2 columns
  
  // Tablet: Start with 4 columns as default, adapt based on available width
  const SIDEBAR_WIDTH = 130;
  const TABLET_PADDING = 32;
  const ITEM_SPACING = 16;
  const MIN_ITEM_WIDTH = 120; // Minimum width per item for good UX (reduced for better fit)
  
  // Calculate available width for products
  const availableWidth = screenWidth - SIDEBAR_WIDTH - TABLET_PADDING;
  
  // Calculate how many columns can fit with minimum width
  const maxPossibleColumns = Math.floor((availableWidth + ITEM_SPACING) / (MIN_ITEM_WIDTH + ITEM_SPACING));
  
  // Target 4 columns, but intelligently adapt
  let columns = 5;
  
  // If screen is too small for 4 columns, reduce appropriately
  if (maxPossibleColumns < 4) {
    columns = Math.max(2, maxPossibleColumns); // Never go below 2 columns
  }
  
  // For very large screens, allow up to 5 columns but cap at 4 for consistency
  columns = Math.min(columns, 5);
  
  console.log(`📱 Tablet layout: ${screenWidth}px width, ${availableWidth}px available, ${columns} columns`);
  
  return columns;
};

const numColumns_tablet = getTabletColumns(width);

// Constants for tablet layout calculations
const SIDEBAR_WIDTH = 130;
const TABLET_PADDING = 32; // 16px * 2 sides
const ITEM_SPACING = 16;

const ITEM_WIDTH_tablet = isTablet 
  ? (width - SIDEBAR_WIDTH - TABLET_PADDING - (ITEM_SPACING * (numColumns_tablet - 1))) / numColumns_tablet
  : ITEM_WIDTH; // Fallback to mobile width if somehow not tablet

const AllCategoriesProductList: React.FC<AllCategoriesProductListProps> = ({
  categories,
  allProducts,
  loading,
  onProductSelect,
  onAddToOrder,
  onRefresh,
  selectedCategoryId,
  orderItems = [],
  onUpdateQuantity,
  onCategoryPress,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const categoryRefs = useRef<{ [categoryId: string]: number }>({});
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [editingQuantityId, setEditingQuantityId] = useState<string | null>(null);
  const [inputQuantity, setInputQuantity] = useState<string>("");
  const [tabletSelectedCategoryId, setTabletSelectedCategoryId] = useState<
    string | null
  >(null);

  // Scroll to selected category when selectedCategoryId changes
  useEffect(() => {
    if (selectedCategoryId && scrollViewRef.current) {
      const offset = categoryRefs.current[selectedCategoryId];
      if (offset !== undefined) {
        scrollViewRef.current.scrollTo({
          y: offset,
          animated: true,
        });
      }
    }
  }, [selectedCategoryId]);

  // Initialize tablet to show first category by default
  useEffect(() => {
    if (isTablet && categories.length > 0 && !tabletSelectedCategoryId) {
      setTabletSelectedCategoryId(categories[0].id);
    }
  }, [categories, isTablet, tabletSelectedCategoryId]);

  const getImageSource = (product: Product) => {
    // Priority 1: Use BASE_URL + fullPath if available
    if (product.image?.fullPath) {
      const imageUrl = `${API_CONFIG.BASE_URL}/${product.image.fullPath}`;
      return { uri: imageUrl };
    }

    // Priority 2: Use BASE_URL + filePath + fileName
    if (product.image?.filePath && product.image?.fileName) {
      const imageUrl = `${API_CONFIG.BASE_URL}/${product.image.filePath}/${product.image.fileName}`;
      return { uri: imageUrl };
    }

    // Priority 3: Base64 data if available
    if (product.image?.base64data) {
      return {
        uri: `data:${product.image.contentType || "image/jpeg"};base64,${
          product.image.base64data
        }`,
      };
    } else if (product.image?.fileContent) {
      // Legacy structure with fileContent
      return {
        uri: `data:${product.image.contentType || "image/jpeg"};base64,${
          product.image.fileContent
        }`,
      };
    }

    return null;
  };

  const getItemQuantity = (productId: string): number => {
    const orderItem = orderItems.find((item) => item.id === productId);
    return orderItem ? orderItem.quantity : 0;
  };

  const handleQuantityPress = (productId: string) => {
    setActiveProductId(activeProductId === productId ? null : productId);
  };

  const handleIncreaseQuantity = (product: Product) => {
    const currentQuantity = getItemQuantity(product.id);
    setActiveProductId(product.id);
    onUpdateQuantity?.(product.id, currentQuantity + 1);
    if (currentQuantity === 0) {
      onAddToOrder(product);
    }
  };

  const handleDecreaseQuantity = (productId: string) => {
    const currentQuantity = getItemQuantity(productId);
    if (currentQuantity > 0) {
      onUpdateQuantity?.(productId, currentQuantity - 1);
      if (currentQuantity === 1) {
        setActiveProductId(null);
      }
    }
  };

  const handleDeleteQuantity = (productId: string) => {
    onUpdateQuantity?.(productId, 0);
    setActiveProductId(null);
  };

  const handleQuantityEdit = (productId: string) => {
    const currentQuantity = getItemQuantity(productId);
    setEditingQuantityId(productId);
    setInputQuantity(currentQuantity.toString());
  };

  const handleQuantitySubmit = (productId: string) => {
    const newQuantity = parseInt(inputQuantity) || 0;
    if (newQuantity >= 0) {
      onUpdateQuantity?.(productId, newQuantity);
      if (newQuantity === 0) {
        setActiveProductId(null);
      }
    }
    setEditingQuantityId(null);
    setInputQuantity("");
  };

  const handleQuantityCancel = () => {
    setEditingQuantityId(null);
    setInputQuantity("");
  };

  const renderQuantityControls = (product: Product) => {
    const quantity = getItemQuantity(product.id);
    const isActive = activeProductId === product.id;

    if (quantity === 0) {
      return (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleIncreaseQuantity(product)}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      );
    }

    if (isActive) {
      const isEditing = editingQuantityId === product.id;
      
      return (
        <View style={styles.quantityControlsContainer}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteQuantity(product.id)}
          >
            <Ionicons name="trash" size={18} color="#dc3545" />
          </TouchableOpacity>
          
          {isEditing ? (
            <View style={styles.quantityInputContainer}>
              <TextInput
                style={styles.quantityInput}
                value={inputQuantity}
                onChangeText={setInputQuantity}
                keyboardType="numeric"
                autoFocus={true}
                selectTextOnFocus={true}
                onSubmitEditing={() => handleQuantitySubmit(product.id)}
                onBlur={() => handleQuantitySubmit(product.id)}
              />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.quantityDisplayButton}
              onPress={() => handleQuantityEdit(product.id)}
            >
              <Text style={styles.quantityText}>{quantity}</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.decreaseButton}
            onPress={() => handleDecreaseQuantity(product.id)}
          >
            <Ionicons name="remove" size={18} color="#dc3545" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.quantityBadge}
        onPress={() => handleQuantityPress(product.id)}
      >
        <Text style={styles.quantityBadgeText}>{quantity}</Text>
      </TouchableOpacity>
    );
  };

  // Mobile: Render product item
  const renderProductItem = (product: Product) => {
    const imageSource = getImageSource(product);
    const price = product.priceAfterDiscount || product.price;
    const formattedPrice = price.toLocaleString("vi-VN");

    return (
      <View
        key={product.id}
        style={styles.productItem}
      >
        <View style={styles.productCard}>
          {/* Vùng click chính - bao phủ toàn bộ card ngoại trừ quantity controls */}
          <TouchableOpacity 
            style={styles.productClickableArea}
            onPress={() => handleIncreaseQuantity(product)}
            activeOpacity={0.7}
          >
            <View style={styles.imageContainer}>
              {imageSource ? (
                <ExpoImage
                  source={imageSource}
                  style={styles.productImage}
                  contentFit="contain"
                  contentPosition="center"
                  // transition={200}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Entypo name="drink" size={32} color="#dee2e6" />
                </View>
              )}
            </View>
            <View style={styles.productInfo}>
              <View style={styles.titleContainer}>
                <Text 
                  style={styles.productTitle} 
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {product.title}
                </Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.productPrice}>{formattedPrice}</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          {/* Quantity controls overlay */}
          {renderQuantityControls(product)}
        </View>
      </View>
    );
  };

  // Tablet: Render category sidebar item
  const renderTabletCategoryItem = (category: Category) => {
    const isSelected = tabletSelectedCategoryId === category.id;

    return (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.tabletCategoryItem,
          isSelected && styles.tabletCategoryItemSelected,
        ]}
        onPress={() => {
          setTabletSelectedCategoryId(category.id);
        }}
      >
        <Text
          style={[
            styles.tabletCategoryText,
            isSelected && styles.tabletCategoryTextSelected,
          ]}
        >
          {category.title}
        </Text>
        {isSelected && <View style={styles.tabletCategoryIndicator} />}
      </TouchableOpacity>
    );
  };

  // Tablet: Render products for selected category
  const renderTabletSelectedCategoryProducts = () => {
    // Show specific category products
    if (!tabletSelectedCategoryId) return null;

    const selectedCategory = categories.find(
      (cat) => cat.id === tabletSelectedCategoryId
    );
    const products = allProducts[tabletSelectedCategoryId] || [];

    return (
      <View style={styles.tabletProductsContainer}>
        {selectedCategory && (
          <Text style={styles.tabletSelectedCategoryTitle}>
            {selectedCategory.title}
          </Text>
        )}

        {products.length === 0 ? (
          <View style={styles.tabletEmptyProducts}>
            <MaterialIcons name="no-drinks" size={48} color="#dee2e6" />
            <Text style={styles.tabletEmptyProductsText}>
              Chưa có sản phẩm trong danh mục này
            </Text>
          </View>
        ) : (
          <View style={styles.tabletProductsGrid}>
            {products.map((product) => renderProductItem(product))}
          </View>
        )}
      </View>
    );
  };

  // Mobile: Render category
  const renderCategory = (category: Category, index: number) => {
    const products = allProducts[category.id] || [];

    return (
      <View
        key={category.id}
        onLayout={(event) => {
          categoryRefs.current[category.id] = event.nativeEvent.layout.y;
        }}
      >
        {/* Category Header */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={onCategoryPress}
        >
          <View style={styles.sectionHeaderContent}>
            <Text style={styles.sectionTitle}>{category.title}</Text>
            {!isTablet && (
              <Ionicons name="chevron-down" size={20} color="#333" />
            )}
          </View>
          <View style={styles.sectionDivider} />
        </TouchableOpacity>

        {/* Products Grid */}
        {products.length === 0 ? (
          <View style={styles.emptySectionContainer}>
            <MaterialIcons name="no-drinks" size={32} color="#dee2e6" />
            <Text style={styles.emptySectionText}>
              Chưa có sản phẩm trong danh mục này
            </Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {products.map((product) => renderProductItem(product))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#198754" />
        <Text style={styles.loadingText}>Đang tải thực đơn...</Text>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="no-drinks" size={32} color="#dee2e6" />
        <Text style={styles.emptyText}>Chưa có danh mục nào</Text>
      </View>
    );
  }

  // Tablet layout with sidebar
  if (isTablet) {
    return (
      <View style={styles.tabletContainer}>
        {/* Left: Products */}
        <View style={styles.tabletProductsSection}>
          <ScrollView
            style={styles.tabletProductsScrollView}
            contentContainerStyle={styles.tabletProductsScrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={onRefresh}
                colors={["#198754"]}
                tintColor="#198754"
              />
            }
          >
            {renderTabletSelectedCategoryProducts()}
          </ScrollView>
        </View>

        {/* Right: Categories Sidebar */}
        <View style={styles.tabletSidebar}>
          <ScrollView
            style={styles.tabletCategoriesScrollView}
            showsVerticalScrollIndicator={false}
          >
            {categories.map((category) => renderTabletCategoryItem(category))}
          </ScrollView>
        </View>
      </View>
    );
  }

  // Mobile layout (original)
  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={onRefresh}
          colors={["#198754"]}
          tintColor="#198754"
        />
      }
    >
      {categories.map((category, index) => renderCategory(category, index))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sectionHeader: {
    backgroundColor: "#f8f9fa",
    paddingVertical: 10,
    paddingHorizontal: 0,
    marginBottom: isTablet ? 0 : 8,
    width: "100%",
  },
  sectionHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: isTablet ? 0 : 10,
  },
  sectionTitle: {
    fontSize: isTablet ? 14 : 18,
    fontWeight: "bold",
    color: "#333",
  },
  sectionDivider: {
    display: isTablet ? "none" : "flex",
    height: 1,
    backgroundColor: "#198754",
    borderRadius: 1,
  },
  productsGrid: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginBottom: 6,
  },
  productItem: {
    width: isTablet ? ITEM_WIDTH_tablet : ITEM_WIDTH,
    marginBottom: isTablet ? 0 : 12,
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: "relative",
    height: isTablet ? ITEM_WIDTH_tablet * 1.35 : ITEM_WIDTH * 1.3, // Tăng chiều cao trên tablet để có đủ chỗ
    display: "flex",
    flexDirection: "column",
  },
  productClickableArea: {
    flex: 1,
    width: "100%",
    zIndex: 1, // Thấp hơn quantity controls
  },
  imageContainer: {
    padding: 5,
    width: "100%",
    height: isTablet ? ITEM_WIDTH_tablet * 0.5 : ITEM_WIDTH * 0.55, // Giảm tỷ lệ hình để có chỗ cho text
    // backgroundColor: "#f0f0f0",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  productInfo: {
    padding: isTablet ? 8 : 12,
    paddingTop: isTablet ? 6 : 8, // Giảm padding top để có thêm chỗ
    paddingBottom: isTablet ? 45 : 46, // Đảm bảo có đủ chỗ cho quantity controls
    flex: 1,
    justifyContent: "flex-start", // Không dùng space-between để tránh overlap
    minHeight: isTablet ? 100 : 95, // Tăng min height trên tablet để có đủ không gian
    position: "relative", // Đảm bảo z-index hoạt động
  },
  titleContainer: {
    // Không dùng flex để tránh conflict với fixed height
    justifyContent: "flex-start",
    marginBottom: isTablet ? 12 : 8, // Tăng khoảng cách trên tablet
    paddingHorizontal: isTablet ? 4 : 0, // Thêm padding để tránh overflow
  },
  priceContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: isTablet ? 12 : 8, // Tăng khoảng cách với quantity controls
    marginTop: isTablet ? 8 : 4, // Tăng khoảng cách với title trên tablet
  },
  productTitle: {
    fontSize: (() => {
      if (!isTablet) return 14; // Mobile - giảm size để có chỗ cho giá
      if (width < 768) return 11; // Small tablet
      if (width < 1024) return 12; // Medium tablet  
      return 13; // Large tablet
    })(),
    fontWeight: "500",
    color: "#333",
    lineHeight: (() => {
      if (!isTablet) return 16; // Mobile
      if (width < 768) return 13; // Small tablet
      if (width < 1024) return 14; // Medium tablet
      return 15; // Large tablet
    })(),
    textAlign: "center",
    // Auto height for exactly 2 lines với safety margin
    // minHeight: (() => {
    //   if (!isTablet) return 32; // Mobile: 16 * 2
    //   if (width < 768) return 28; // Small tablet: 13 * 2 + padding
    //   if (width < 1024) return 30; // Medium tablet: 14 * 2 + padding
    //   return 32; // Large tablet: 15 * 2 + padding
    // })(),
    // maxHeight: (() => {
    //   if (!isTablet) return 32; // Mobile: 16 * 2
    //   if (width < 768) return 28; // Small tablet: 13 * 2 + padding
    //   if (width < 1024) return 30; // Medium tablet: 14 * 2 + padding
    //   return 32; // Large tablet: 15 * 2 + padding
    // })(),
    // overflow: "hidden",
    zIndex: 2, // Đảm bảo không bị che bởi các element khác
    position: "relative",
  },
  productPrice: {
    fontSize: (() => {
      if (!isTablet) return 15; // Mobile
      if (width < 768) return 12; // Small tablet
      if (width < 1024) return 13; // Medium tablet
      return 14; // Large tablet
    })(),
    fontWeight: "bold",
    color: "#198754",
    textAlign: "center",
    zIndex: 5, // Cao hơn clickable area, thấp hơn quantity controls
    position: "relative",
    backgroundColor: "transparent",
    paddingVertical: 2,
    paddingHorizontal: isTablet ? 4 : 0, // Thêm padding để tránh overflow
  },
  addButton: {
    display: "none",
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#198754",
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  quantityBadge: {
    position: "absolute",
    bottom: 8,
    right: 10,
    backgroundColor: "#dc3545",
    borderRadius: 16,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10, // Cao hơn clickable area để có thể click
   
  },
  quantityBadgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  quantityControlsContainer: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    zIndex: 10, // Cao hơn clickable area để có thể click
    elevation: 10,
  },
  quantityButton: {
    color: "#333",
    borderRadius: 14,
    width: 30,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  decreaseButton: {
    backgroundColor: "#e9ecef",
    // borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 14,
    
  },
  deleteButton: {
    backgroundColor: "#e9ecef",
    borderRadius: 20,
    borderColor: "#dc3545",
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  increaseButton: {
    backgroundColor: "#198754",
    borderRadius: 20,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 14,
  },
  quantityDisplayButton: {
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderColor: "#28a745",
    justifyContent: "center",
    alignItems: "center",
    width: 60,
    minWidth: 60,
  },
  quantityInputContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#28a745",
    paddingHorizontal: 4,
    paddingVertical: 2,
    justifyContent: "center",
    alignItems: "center",
    width: 60,
    minWidth: 60,
  },
  quantityInput: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    width: "100%",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  emptySectionContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    width: "100%",
    marginBottom: 24,
  },
  emptySectionText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
  // Tablet-specific styles
  tabletContainer: {
    flex: 1,
    flexDirection: "row",
  },
  tabletProductsSection: {
    flex: 1,
    // backgroundColor: "#fff",
  },
  tabletProductsScrollView: {
    flex: 1,
  },
  tabletProductsScrollContent: {
    paddingHorizontal: 16,
  },
  tabletSidebar: {
    width: 130,
    backgroundColor: "#f8f9fa",
    borderLeftWidth: 1,
    borderLeftColor: "#e9ecef",
  },
  tabletSidebarTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  tabletCategoriesScrollView: {
    flex: 1,
  },
  tabletCategoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    position: "relative",
  },
  tabletCategoryItemSelected: {
    backgroundColor: "#e8f5e8",
  },
  tabletCategoryText: {
    fontSize: isTablet ? 12 : 14,
    color: "#666",
    fontWeight: "500",
  },
  tabletCategoryTextSelected: {
    color: "#198754",
    fontWeight: "bold",
  },
  tabletCategoryIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#198754",
  },
  tabletProductsContainer: {
    flex: 1,
  },
  tabletSelectedCategoryTitle: {
    fontSize: isTablet ? 14 : 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: isTablet ? 10 : 20,
    marginTop: isTablet ? 10 : 0,
  },
  tabletProductsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: ITEM_SPACING,
  },
  tabletEmptyProducts: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  tabletEmptyProductsText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
});

export default AllCategoriesProductList;
