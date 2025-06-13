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

const numColumns = 2;
const ITEM_WIDTH = (width - 48) / numColumns;

// Breakpint for tablet android and ios
const isTablet = width >= 720;
const numColumns_tablet = 6;
const ITEM_WIDTH_tablet = (width - 80) / numColumns_tablet;

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
  const [tabletSelectedCategoryId, setTabletSelectedCategoryId] = useState<
    string | null
  >(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

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

  // Initialize tablet to show all categories by default
  useEffect(() => {
    if (
      isTablet &&
      categories.length > 0 &&
      !tabletSelectedCategoryId &&
      !showAllCategories
    ) {
      setShowAllCategories(true);
    }
  }, [categories, isTablet, tabletSelectedCategoryId, showAllCategories]);

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
      return (
        <View style={styles.quantityControlsContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleDecreaseQuantity(product.id)}
          >
            <Ionicons name="remove" size={20} color="#999" bold={true} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleIncreaseQuantity(product)}
          >
            <Ionicons name="add" size={20} color="#999" bold={true} />
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
      <TouchableOpacity
        key={product.id}
        style={styles.productItem}
        onPress={() => {
          onProductSelect(product);
        }}
      >
        <View style={styles.productCard}>
          <View style={styles.imageContainer}>
            {imageSource ? (
              <ExpoImage
                source={imageSource}
                style={styles.productImage}
                contentFit="contain"
                contentPosition="center"
                transition={200}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Entypo name="drink" size={32} color="#dee2e6" />
              </View>
            )}
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {product.title}
            </Text>
            <Text style={styles.productPrice}>{formattedPrice}</Text>
          </View>
          {renderQuantityControls(product)}
        </View>
      </TouchableOpacity>
    );
  };

  // Tablet: Render category sidebar item
  const renderTabletCategoryItem = (category: Category) => {
    const isSelected =
      tabletSelectedCategoryId === category.id && !showAllCategories;

    return (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.tabletCategoryItem,
          isSelected && styles.tabletCategoryItemSelected,
        ]}
        onPress={() => {
          setTabletSelectedCategoryId(category.id);
          setShowAllCategories(false);
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

  // Tablet: Render products for selected category or all categories
  const renderTabletSelectedCategoryProducts = () => {
    // If "Tất cả" is selected, show all categories like mobile
    if (showAllCategories) {
      return (
        <View style={styles.tabletProductsContainer}>
          {categories.map((category, index) => renderCategory(category, index))}
        </View>
      );
    }

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
            {/* "Tất cả" button */}
            <TouchableOpacity
              style={[
                styles.tabletCategoryItem,
                showAllCategories && styles.tabletCategoryItemSelected,
              ]}
              onPress={() => {
                setShowAllCategories(true);
                setTabletSelectedCategoryId(null);
              }}
            >
              <Text
                style={[
                  styles.tabletCategoryText,
                  showAllCategories && styles.tabletCategoryTextSelected,
                ]}
              >
                Tất cả
              </Text>
              {showAllCategories && (
                <View style={styles.tabletCategoryIndicator} />
              )}
            </TouchableOpacity>

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
    height: isTablet ? ITEM_WIDTH_tablet * 1.2 : ITEM_WIDTH * 1.2,
  },
  imageContainer: {
    padding: 5,
    width: "100%",
    height: isTablet ? ITEM_WIDTH_tablet * 0.7 : ITEM_WIDTH * 0.7,
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
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#198754",
  },
  addButton: {
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
    bottom: 10,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#198754",
  },
  quantityBadgeText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "bold",
  },
  quantityControlsContainer: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#198754",
    width: 90,
    justifyContent: "space-between",
  },
  quantityButton: {
    color: "#333",
    borderRadius: 14,
    width: 30,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 5,
    minWidth: 20,
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
    gap: 16,
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
