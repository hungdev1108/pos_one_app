import { Category, Product } from "@/api";
import { API_CONFIG } from "@/api/constants";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import React, { useEffect, useRef } from "react";
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
}

const { width } = Dimensions.get("window");
const numColumns = 2;
const ITEM_WIDTH = (width - 48) / numColumns;

const AllCategoriesProductList: React.FC<AllCategoriesProductListProps> = ({
  categories,
  allProducts,
  loading,
  onProductSelect,
  onAddToOrder,
  onRefresh,
  selectedCategoryId,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const categoryRefs = useRef<{ [categoryId: string]: number }>({});

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
          onAddToOrder(product);
        }}
      >
        <View style={styles.productCard}>
          <View style={styles.imageContainer}>
            {imageSource ? (
              <ExpoImage
                source={imageSource}
                style={styles.productImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="restaurant" size={32} color="#dee2e6" />
              </View>
            )}
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {product.title}
            </Text>
            <Text style={styles.productPrice}>{formattedPrice}đ</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={(e) => {
              e.stopPropagation();
              onAddToOrder(product);
            }}
          >
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{category.title}</Text>
          <View style={styles.sectionDivider} />
        </View>

        {/* Products Grid */}
        {products.length === 0 ? (
          <View style={styles.emptySectionContainer}>
            <Ionicons name="restaurant-outline" size={32} color="#dee2e6" />
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
        <Ionicons name="restaurant-outline" size={48} color="#dee2e6" />
        <Text style={styles.emptyText}>Chưa có danh mục nào</Text>
      </View>
    );
  }

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
    paddingVertical: 16,
    paddingHorizontal: 0,
    marginBottom: 12,
    width: "100%",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  sectionDivider: {
    height: 2,
    backgroundColor: "#198754",
    borderRadius: 1,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  productItem: {
    width: ITEM_WIDTH,
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: "relative",
  },
  imageContainer: {
    width: "100%",
    height: ITEM_WIDTH * 0.7,
    backgroundColor: "#f0f0f0",
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
    fontSize: 16,
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
});

export default AllCategoriesProductList;
