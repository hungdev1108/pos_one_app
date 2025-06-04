import { Category } from "@/api";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface CategoryListProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string) => void;
  loading?: boolean;
}

export default function CategoryList({
  categories,
  selectedCategoryId,
  onCategorySelect,
  loading = false,
}: CategoryListProps) {
  const renderCategory = ({ item }: { item: Category }) => {
    const isSelected = item.id === selectedCategoryId;

    return (
      <TouchableOpacity
        style={[styles.categoryItem, isSelected && styles.selectedCategory]}
        onPress={() => onCategorySelect(item.id)}
        disabled={loading}
      >
        <Text
          style={[styles.categoryText, isSelected && styles.selectedText]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải thực đơn...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        bounces={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  listContainer: {
    paddingHorizontal: 10,
    gap: 12,
  },
  categoryItem: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dee2e6",
    minWidth: 80,
    alignItems: "center",
  },
  selectedCategory: {
    backgroundColor: "#198754",
    borderColor: "#198754",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#495057",
  },
  selectedText: {
    color: "#fff",
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
});
