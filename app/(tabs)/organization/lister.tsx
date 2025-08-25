import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { State as GestureState, PanGestureHandler } from 'react-native-gesture-handler';

import { ThemedText } from "../../../components/ThemedText";
import { ThemedView } from "../../../components/ThemedView";
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from "../../../hooks/useColorScheme";
import { useLister } from "../../../hooks/useLister";
import type { ListerItem } from '../../../types/lister';
import { ListerCategory, ListerList } from '../../../types/lister';

// Placeholder for drag-and-drop, to be replaced with a library

export default function ListerScreen() {
  // All hooks must be at the top, before any returns or logic
  const {
    state,
    loading,
    createList,
    renameList,
    updateListColor,
    deleteList,
    addCategory,
    renameCategory,
    deleteCategory,
    addItem,
    deleteItem,
    toggleItemInCart,
    reorderCategories,
    reorderItems,
    moveItemToCategory,
    selectList,
  } = useLister();
  const colorScheme = useColorScheme();
  const [newListName, setNewListName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [showListModal, setShowListModal] = useState(false);
  const [newListColor, setNewListColor] = useState('#22292f');
  const [showDropdown, setShowDropdown] = useState(false);
  const [editList, setEditList] = useState<ListerList | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editCategory, setEditCategory] = useState<ListerCategory | null>(null);
  const [categoryName, setCategoryName] = useState("");

  const LIST_COLORS = [
    '#22292f', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#E91E63', '#607D8B',
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  ];
  const selectedList = state.lists.find((l) => l.id === state.selectedListId);

  // Floating Action Button for Add List
  const renderFab = () => (
    <TouchableOpacity style={styles.fab} onPress={() => setShowListModal(true)}>
      <Ionicons name="add" size={28} color="#fff" />
    </TouchableOpacity>
  );

  // Modal for new list creation
  const renderListModal = () => (
    <Modal visible={showListModal} animationType="slide" transparent onRequestClose={() => {
      setShowListModal(false);
      setEditList(null);
      setNewListName("");
      setNewListColor('#22292f');
    }}>
      <View style={styles.modalBg}>
        <View style={[styles.modalContainer, { backgroundColor: colorScheme === 'dark' ? '#22292f' : '#fff' }] }>
          <View style={styles.modalHeader}>
            <ThemedText style={[styles.modalTitle, { color: colorScheme === 'dark' ? '#fff' : '#222' }]}>{editList ? 'Edit List' : 'New List'}</ThemedText>
            <TouchableOpacity onPress={() => {
              setShowListModal(false);
              setEditList(null);
              setNewListName("");
              setNewListColor('#22292f');
            }} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colorScheme === 'dark' ? '#fff' : '#222'} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <TextInput
              placeholder="List name"
              value={newListName}
              onChangeText={setNewListName}
              style={[styles.input, { color: colorScheme === 'dark' ? '#fff' : '#222', borderColor: '#2196F3', backgroundColor: colorScheme === 'dark' ? '#22292f' : '#f9f9f9' }]}
              placeholderTextColor={colorScheme === 'dark' ? '#888' : '#888'}
              autoFocus
              onSubmitEditing={() => {
                if (newListName.trim()) {
                  if (editList) {
                    renameList(editList.id, newListName.trim());
                    // update color if changed
                    if (editList.color !== newListColor) {
                      updateListColor(editList.id, newListColor);
                    }
                    setEditList(null);
                  } else {
                    createList(newListName.trim(), newListColor);
                  }
                  setNewListName("");
                  setNewListColor('#22292f');
                  setShowListModal(false);
                }
              }}
            />
            <ThemedText style={{ marginBottom: 8, color: colorScheme === 'dark' ? '#fff' : '#222' }}>Pick a color:</ThemedText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
              {LIST_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setNewListColor(color)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: color,
                    marginRight: 8,
                    marginBottom: 8,
                    borderWidth: newListColor === color ? 3 : 1,
                    borderColor: newListColor === color ? '#2196F3' : '#ccc',
                  }}
                />
              ))}
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={() => {
              if (newListName.trim()) {
                if (editList) {
                  renameList(editList.id, newListName.trim());
                  if (editList.color !== newListColor) {
                    updateListColor(editList.id, newListColor);
                  }
                  setEditList(null);
                } else {
                  createList(newListName.trim(), newListColor);
                }
                setNewListName("");
                setNewListColor('#22292f');
                setShowListModal(false);
              }
            }}>
              <ThemedText style={styles.saveButtonText}>{editList ? 'Save Changes' : 'Add List'}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // When opening edit modal, prefill name and color
  const handleEditList = (list: ListerList) => {
    setEditList(list);
    setNewListName(list.name);
    setNewListColor(list.color);
    setShowDropdown(false);
    setShowListModal(true);
  };

  const handleDeleteList = (list: ListerList) => {
    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(`Delete list "${list.name}"? This cannot be undone.`)) {
        deleteList(list.id);
      }
    } else {
      deleteList(list.id);
    }
  };

  // Add handler for opening add/edit category modal
  const openAddCategory = () => {
    setEditCategory(null);
    setCategoryName("");
    setShowCategoryModal(true);
  };
  const openEditCategory = (cat: ListerCategory) => {
    setEditCategory(cat);
    setCategoryName(cat.name);
    setShowCategoryModal(true);
  };
  const handleSaveCategory = () => {
    if (!categoryName.trim() || !selectedList) return;
    if (editCategory) {
      if (editCategory && selectedList) {
        renameCategory(selectedList.id, editCategory.id, categoryName.trim());
      }
    } else {
      addCategory(selectedList.id, categoryName.trim());
    }
    setShowCategoryModal(false);
    setEditCategory(null);
    setCategoryName("");
  };
  const handleDeleteCategory = (cat: ListerCategory) => {
    if (!selectedList) return;
    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(`Delete category "${cat.name}"? Items will be moved to 'Other'.`)) {
        deleteCategory(selectedList.id, cat.id);
      }
    } else {
      deleteCategory(selectedList.id, cat.id);
    }
  };




  if (loading) return <ThemedText>Loading...</ThemedText>;

  if (!loading && state.lists.length === 0) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Ionicons name="list-circle-outline" size={64} color={colorScheme === 'dark' ? '#888' : '#bbb'} style={{ marginBottom: 16 }} />
        <ThemedText style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
          No lists yet
        </ThemedText>
        <ThemedText style={{ fontSize: 16, color: colorScheme === 'dark' ? '#aaa' : '#666', marginBottom: 24, textAlign: 'center' }}>
          Create your first shopping or to-do list to get started!
        </ThemedText>
        {renderFab()}
        {renderListModal()}
      </ThemedView>
    );
  }

  // Helper to move item up/down in a category

  function moveItemInCategory(
    list: ListerList,
    categoryId: number,
    itemId: number,
    direction: 'up' | 'down',
    reorderItems: (listId: number, categoryId: number, newOrder: number[]) => void,
    moveItemToCategory: (listId: number, itemId: number, newCategoryId: number) => void,
  categories: ListerCategory[]
  ) {
    const items: ListerItem[] = list.items.filter((i: ListerItem) => i.categoryId === categoryId).sort((a: ListerItem, b: ListerItem) => a.order - b.order);
    const idx = items.findIndex((i: ListerItem) => i.id === itemId);
    if (idx === -1) return;
    // Find the index of the current category in the categories array
    const catIdx = categories.findIndex((c) => c.id === categoryId);
    if (direction === 'up' && idx === 0 && catIdx > 0) {
      // Move to previous category (across all categories)
      const prevCat = categories[catIdx - 1];
      moveItemToCategory(list.id, itemId, prevCat.id);
      return;
    }
    if (direction === 'down' && idx === items.length - 1 && catIdx < categories.length - 1) {
      // Move to next category (across all categories)
      const nextCat = categories[catIdx + 1];
      moveItemToCategory(list.id, itemId, nextCat.id);
      return;
    }
    // Otherwise, move within the category
    let newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= items.length) return;
    // Swap
    const newOrder = items.map((i: ListerItem) => i.id);
    [newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]];
    reorderItems(list.id, categoryId, newOrder);
  }

  return (
    <ThemedView style={{ flex: 1, padding: 0 }}>
      {/* List selection dropdown and add button */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderColor: colorScheme === 'dark' ? '#333' : '#eee',
        backgroundColor: selectedList ? `${selectedList.color}22` : (colorScheme === 'dark' ? '#181c20' : '#f9f9f9'), // 22 = ~13% opacity
        zIndex: 2,
      }}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
            onPress={() => setShowDropdown((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: selectedList ? selectedList.color || '#2196F3' : '#bbb', marginRight: 8, borderWidth: 1, borderColor: '#ccc' }} />
            <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: colorScheme === 'dark' ? '#fff' : '#222' }}>
              {selectedList ? selectedList.name : 'Select a list'}
            </ThemedText>
            <Ionicons name={showDropdown ? 'chevron-up' : 'chevron-down'} size={20} color={colorScheme === 'dark' ? '#fff' : '#222'} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
          {showDropdown && (
            <View style={{
              position: 'absolute',
              top: 44,
              left: 0,
              right: 0,
              minWidth: 240, // increased from 180
              backgroundColor: colorScheme === 'dark' ? '#22292f' : '#fff',
              borderRadius: 8,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 8,
              zIndex: 10,
              borderWidth: 1,
              borderColor: colorScheme === 'dark' ? '#333' : '#eee',
              overflow: 'visible',
            }}>
              {state.lists.map(list => (
                <TouchableOpacity
                  key={list.id}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: colorScheme === 'dark' ? '#333' : '#eee' }}
                  onPress={() => { selectList(list.id); setShowDropdown(false); }}
                  activeOpacity={0.7}
                >
                  <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: list.color || '#2196F3', marginRight: 8, borderWidth: 1, borderColor: '#ccc' }} />
                  <ThemedText style={{ fontSize: 16, color: colorScheme === 'dark' ? '#fff' : '#222', flexShrink: 1, flexGrow: 1 }} numberOfLines={1} ellipsizeMode="tail">{list.name}</ThemedText>
                  {selectedList && selectedList.id === list.id && (
                    <Ionicons name="checkmark" size={18} color="#4caf50" style={{ marginLeft: 8 }} />
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16 }}>
                    <TouchableOpacity
                      onPress={() => handleEditList(list)}
                      style={{ marginRight: 16, padding: 4 }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="pencil" size={18} color={colorScheme === 'dark' ? '#fff' : '#222'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteList(list)}
                      style={{ padding: 4 }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash" size={18} color="#e53935" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => { setShowDropdown(false); setShowListModal(true); }} style={{ marginLeft: 8, padding: 8, backgroundColor: '#2196F3', borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 6 }} />
          <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>New List</ThemedText>
        </TouchableOpacity>
      </View>

      {/* List content */}
      {selectedList ? (
        <ScrollView style={{ flex: 1, padding: 16 }}>
          <TextInput
            value={newItemName}
            onChangeText={setNewItemName}
            placeholder="Add item"
            style={{
              borderBottomWidth: 1,
              borderColor: colorScheme === "dark" ? "#888" : "#aaa",
              marginBottom: 8,
              color: colorScheme === "dark" ? '#fff' : '#222', // use primary text color
            }}
            placeholderTextColor={colorScheme === "dark" ? "#888" : "#aaa"}
            onSubmitEditing={() => {
              if (newItemName.trim()) {
                // Add to 'Other' by default
                const otherCat = selectedList.categories.find(
                  (c) => c.isSpecial && c.name === "Other"
                );
                addItem(selectedList.id, newItemName.trim(), otherCat?.id ?? null);
                setNewItemName("");
              }
            }}
          />
          {/* Render user-defined categories first, then Other, then In Shopping Cart (using isOther/isShoppingCart flags) */}
          {(() => {
            const userCats = selectedList.categories.filter(cat => !cat.isOther && !cat.isShoppingCart);
            const otherCat = selectedList.categories.find(cat => cat.isOther);
            const cartCat = selectedList.categories.find(cat => cat.isShoppingCart);
            return [
              ...userCats,
              ...(otherCat ? [otherCat] : []),
              ...(cartCat ? [cartCat] : []),
            ];
          })().map((cat) => (
              <ThemedView
                key={cat.id}
                style={{
                  marginBottom: 16,
                  backgroundColor: '#F5F5F5',
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: cat.isShoppingCart ? '#4caf50' : '#607d8b',
                  flexDirection: 'column',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, justifyContent: 'space-between' }}>
                  <ThemedText style={{
                    fontWeight: 'bold',
                    fontSize: 17,
                    letterSpacing: 0.5,
                    color: cat.isShoppingCart ? '#4caf50' : '#607d8b',
                  }}>
                    {cat.isShoppingCart ? 'In Shopping Cart' : cat.name}
                  </ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {!cat.isOther && !cat.isShoppingCart && (
                      <>
                        <TouchableOpacity onPress={() => openEditCategory(cat)} style={{ marginLeft: 12, padding: 4 }}>
                          <Ionicons name="pencil" size={18} color={Colors[colorScheme ?? 'light'].textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteCategory(cat)} style={{ marginLeft: 24, padding: 4 }}>
                          <Ionicons name="trash" size={18} color="#e53935" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
                {selectedList.items.filter((item) => item.categoryId === cat.id).length > 0 && (
                  <View style={{ height: 1, backgroundColor: Colors[colorScheme ?? 'light'].textSecondary, opacity: 0.5, marginLeft: 0, marginVertical: 0 }} />
                )}
                {selectedList.items
                  .filter((item) => item.categoryId === cat.id)
                  .sort((a, b) => a.order - b.order)
                  .map((item, idx, arr) => (
                    <PanGestureHandler
                      key={item.id}
                      onHandlerStateChange={event => {
                        if (event.nativeEvent.state === GestureState.END) {
                          // Use the same order as rendered above
                          const userCats = selectedList.categories.filter(cat => !cat.isOther && !cat.isShoppingCart).sort((a, b) => a.id - b.id);
                          const otherCat = selectedList.categories.find(cat => cat.isOther);
                          const cartCat = selectedList.categories.find(cat => cat.isShoppingCart);
                          const orderedCats = [...userCats];
                          if (otherCat) orderedCats.push(otherCat);
                          if (cartCat) orderedCats.push(cartCat);
                          if (event.nativeEvent.translationY < -30) {
                            moveItemInCategory(
                              selectedList,
                              cat.id,
                              item.id,
                              'up',
                              reorderItems,
                              moveItemToCategory,
                              orderedCats
                            );
                          } else if (event.nativeEvent.translationY > 30) {
                            moveItemInCategory(
                              selectedList,
                              cat.id,
                              item.id,
                              'down',
                              reorderItems,
                              moveItemToCategory,
                              orderedCats
                            );
                          }
                        }
                      }}
                    >
                      <View>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 0,
                            opacity: item.inCart ? 0.5 : 1,
                            paddingVertical: 6,
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => {
                              if (!cat.isShoppingCart) {
                                const cartCat = selectedList.categories.find(c => c.isShoppingCart);
                                if (cartCat) moveItemToCategory(selectedList.id, item.id, cartCat.id);
                              } else {
                                // If in shopping cart, return to original category if possible, else to 'Other'
                                let targetCategoryId = item.originalCategoryId;
                                // Only use originalCategoryId if it exists and is not the shopping cart
                                const validOriginal = targetCategoryId && selectedList.categories.some(c => c.id === targetCategoryId && !c.isShoppingCart);
                                if (!validOriginal) {
                                  const otherCat = selectedList.categories.find(c => c.isOther);
                                  targetCategoryId = otherCat ? otherCat.id : null;
                                }
                                if (typeof targetCategoryId === 'number') {
                                  moveItemToCategory(selectedList.id, item.id, targetCategoryId);
                                }
                              }
                            }}
                            style={{ flex: 1 }}
                          >
                            <ThemedText
                              style={{
                                fontSize: 15,
                                fontWeight: '400',
                                fontStyle: 'italic',
                                color: Colors[colorScheme ?? 'light'].textSecondary,
                                letterSpacing: 0.1,
                                textDecorationLine: cat.isShoppingCart ? 'line-through' : (item.inCart ? 'line-through' : 'none'),
                              }}
                            >
                              {item.name}
                            </ThemedText>
                          </TouchableOpacity>
                          {!cat.isShoppingCart && (
                            <TouchableOpacity
                              onPress={() => deleteItem(selectedList.id, item.id)}
                              style={{ marginLeft: 8 }}
                            >
                              <Ionicons name="trash" size={16} color="#e53935" />
                            </TouchableOpacity>
                          )}
                        </View>
                        {idx < arr.length - 1 && (
                          <View style={{ height: 1, backgroundColor: '#bbb', opacity: 0.5, marginLeft: 0, marginVertical: 0 }} />
                        )}
                      </View>
                    </PanGestureHandler>
                  ))}
              </ThemedView>
            ))}
          <TouchableOpacity onPress={openAddCategory} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="add-circle" size={20} color={selectedList.color || '#2196F3'} style={{ marginRight: 6 }} />
            <ThemedText style={{ color: selectedList.color || '#2196F3', fontWeight: 'bold', fontSize: 16 }}>Add Category</ThemedText>
          </TouchableOpacity>
  </ScrollView>
      ) : null}
      {renderListModal()}
      {/* Category modal */}
      <Modal visible={showCategoryModal} animationType="fade" transparent onRequestClose={() => setShowCategoryModal(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalContainer, { backgroundColor: colorScheme === 'dark' ? '#22292f' : '#fff', maxWidth: 340 }] }>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: colorScheme === 'dark' ? '#fff' : '#222' }]}>{editCategory ? 'Edit Category' : 'Add Category'}</ThemedText>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colorScheme === 'dark' ? '#fff' : '#222'} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <TextInput
                placeholder="Category name"
                value={categoryName}
                onChangeText={setCategoryName}
                style={[styles.input, { color: colorScheme === 'dark' ? '#fff' : '#222', borderColor: (selectedList?.color ?? '#2196F3'), backgroundColor: colorScheme === 'dark' ? '#22292f' : '#f9f9f9' }]}
                placeholderTextColor={colorScheme === 'dark' ? '#888' : '#888'}
                autoFocus
                onSubmitEditing={handleSaveCategory}
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveCategory}>
                <ThemedText style={styles.saveButtonText}>{editCategory ? 'Save Changes' : 'Add Category'}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
  </ThemedView>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#2196F3',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});