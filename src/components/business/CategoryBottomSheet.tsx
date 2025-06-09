import { Category } from "@/src/api";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface CategoryBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  onSelectCategory: (category: Category) => void;
  loading: boolean;
}

const { height, width } = Dimensions.get("window");
const numColumns = 2;
const ITEM_WIDTH = (width - 48) / numColumns; // padding 16 mỗi bên, 16 giữa các item

const CategoryBottomSheet: React.FC<CategoryBottomSheetProps> = ({
  visible,
  onClose,
  categories,
  onSelectCategory,
  loading,
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const [modalVisible, setModalVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setModalVisible(false));
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      onClose();
    });
  };

  const renderCategoryItem = ({ item }: { item: Category; index: number }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      activeOpacity={0.8}
      onPress={() => {
        onSelectCategory(item);
        handleClose();
      }}
    >
      <View style={styles.categoryCard}>
        <Text style={styles.categoryTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View
            style={[
              styles.bottomSheet,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.handle} />
            <Text style={styles.title}>Chọn nhóm món</Text>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Đang tải danh mục...</Text>
              </View>
            ) : (
              <FlatList
                data={categories}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item.id}
                numColumns={numColumns}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={
                  numColumns > 1 ? styles.columnWrapper : undefined
                }
                showsVerticalScrollIndicator={false}
              />
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.32)", // nhẹ hơn để dịu mắt
    justifyContent: "flex-end",
  },
  overlayTouch: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    minHeight: height * 0.4,
    maxHeight: height * 0.8,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 7,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#d1d5db", // Tailwind's gray-300
    borderRadius: 2,
    alignSelf: "center",
    marginVertical: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 12,
    color: "#222",
    marginTop: 5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  categoryItem: {
    width: ITEM_WIDTH,
    marginBottom: 3,
  },
  categoryCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 70,
  },
  categoryTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#198754", // Tailwind's green-700
    textAlign: "center",
    textTransform: "capitalize",
    lineHeight: 19,
  },
  loadingContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 15,
    color: "#5b5b5b",
  },
});

export default CategoryBottomSheet;
