import { useCallback, useEffect, useState } from 'react';
import { ListerCategory, ListerList, ListerState } from '../types/lister';
import { getInitialListerState, loadListerState, saveListerState } from './useListerStorage';

export function useLister() {
  const [state, setState] = useState<ListerState>(getInitialListerState());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListerState().then((loaded) => {
      if (loaded) setState(loaded);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!loading) saveListerState(state);
  }, [state, loading]);

  // Helper to get next unique ID
  const getNextId = useCallback(() => state.lastId + 1, [state.lastId]);

  // List management
  const createList = useCallback((name: string, color: string = '#22292f') => {
  const id = getNextId();
  const otherCat: ListerCategory = { id: id + 1, name: 'Other', order: 0, isSpecial: true, isOther: true };
  const cartCat: ListerCategory = { id: id + 2, name: 'In shopping cart', order: 1, isSpecial: true, isShoppingCart: true };
    const newList: ListerList = {
      id,
      name,
      color,
      categories: [otherCat, cartCat],
      items: [],
    };
    setState((prev) => ({
      ...prev,
      lists: [...prev.lists, newList],
      lastId: id + 2,
      selectedListId: id,
    }));
  }, [getNextId]);

  const renameList = useCallback((listId: number, name: string) => {
    setState((prev) => ({
      ...prev,
      lists: prev.lists.map((l) => l.id === listId ? { ...l, name } : l),
    }));
  }, []);

  const updateListColor = useCallback((listId: number, color: string) => {
    setState((prev) => ({
      ...prev,
      lists: prev.lists.map((l) => l.id === listId ? { ...l, color } : l),
    }));
  }, []);

  const deleteList = useCallback((listId: number) => {
    setState((prev) => {
      const lists = prev.lists.filter((l) => l.id !== listId);
      return {
        ...prev,
        lists,
        selectedListId: lists.length ? lists[0].id : null,
      };
    });
  }, []);

  // Category management
  const addCategory = useCallback((listId: number, name: string) => {
    setState((prev) => {
      const id = prev.lastId + 1;
      return {
        ...prev,
        lists: prev.lists.map((l) => {
          if (l.id !== listId) return l;
          // Find indices of special categories
          const otherIdx = l.categories.findIndex(cat => cat.isOther);
          const cartIdx = l.categories.findIndex(cat => cat.isShoppingCart);
          // Insert before the first special category (or at end if none found)
          let insertIdx = l.categories.length;
          if (otherIdx !== -1) insertIdx = otherIdx;
          if (cartIdx !== -1 && (insertIdx === l.categories.length || cartIdx < insertIdx)) insertIdx = cartIdx;
          const newCat = { id, name, order: insertIdx };
          const newCategories = [
            ...l.categories.slice(0, insertIdx),
            newCat,
            ...l.categories.slice(insertIdx)
          ].map((cat, idx) => ({ ...cat, order: idx }));
          return {
            ...l,
            categories: newCategories,
          };
        }),
        lastId: id,
      };
    });
  }, []);

  const renameCategory = useCallback((listId: number, categoryId: number, name: string) => {
    setState((prev) => ({
      ...prev,
      lists: prev.lists.map((l) =>
        l.id === listId
          ? {
              ...l,
              categories: l.categories.map((c) =>
                c.id === categoryId ? { ...c, name } : c
              ),
            }
          : l
      ),
    }));
  }, []);

  const deleteCategory = useCallback((listId: number, categoryId: number) => {
    setState((prev) => ({
      ...prev,
      lists: prev.lists.map((l) => {
        if (l.id !== listId) return l;
        const otherCat = l.categories.find((c) => c.isSpecial && c.name === 'Other');
        if (!otherCat) return l;
        return {
          ...l,
          categories: l.categories.filter((c) => c.id !== categoryId),
          items: l.items.map((item) =>
            item.categoryId === categoryId ? { ...item, categoryId: otherCat.id } : item
          ),
        };
      }),
    }));
  }, []);

  // Item management
  const addItem = useCallback((listId: number, name: string, categoryId: number | null) => {
    setState((prev) => {
      const id = prev.lastId + 1;
      return {
        ...prev,
        lists: prev.lists.map((l) =>
          l.id === listId
            ? {
                ...l,
                items: [
                  ...l.items,
                  {
                    id,
                    name,
                    categoryId,
                    inCart: false,
                    order: l.items.length,
                  },
                ],
              }
            : l
        ),
        lastId: id,
      };
    });
  }, []);

  const deleteItem = useCallback((listId: number, itemId: number) => {
    setState((prev) => ({
      ...prev,
      lists: prev.lists.map((l) =>
        l.id === listId
          ? { ...l, items: l.items.filter((i) => i.id !== itemId) }
          : l
      ),
    }));
  }, []);

  // Move item to cart or back
  const toggleItemInCart = useCallback((listId: number, itemId: number) => {
    setState((prev) => {
      return {
        ...prev,
        lists: prev.lists.map((l) => {
          if (l.id !== listId) return l;
          const cartCat = l.categories.find((c) => c.isSpecial && c.name === 'In shopping cart');
          if (!cartCat) return l;
          return {
            ...l,
            items: l.items.map((item) => {
              if (item.id !== itemId) return item;
              if (!item.inCart) {
                return {
                  ...item,
                  inCart: true,
                  originalCategoryId: item.categoryId,
                  categoryId: cartCat.id,
                };
              } else {
                return {
                  ...item,
                  inCart: false,
                  categoryId: item.originalCategoryId ?? null,
                  originalCategoryId: undefined,
                };
              }
            }),
          };
        }),
      };
    });
  }, []);

  // Drag & drop helpers for reordering categories/items
  const reorderCategories = useCallback((listId: number, newOrder: number[]) => {
    setState((prev) => ({
      ...prev,
      lists: prev.lists.map((l) =>
        l.id === listId
          ? {
              ...l,
              categories: newOrder.map((catId, idx) => {
                const cat = l.categories.find((c) => c.id === catId)!;
                return { ...cat, order: idx };
              }),
            }
          : l
      ),
    }));
  }, []);

  const reorderItems = useCallback((listId: number, categoryId: number, newOrder: number[]) => {
    setState((prev) => ({
      ...prev,
      lists: prev.lists.map((l) => {
        if (l.id !== listId) return l;
        const items = l.items.map((item) =>
          item.categoryId === categoryId
            ? { ...item, order: newOrder.indexOf(item.id) }
            : item
        );
        return { ...l, items };
      }),
    }));
  }, []);

  // Move item between categories
  const moveItemToCategory = useCallback((listId: number, itemId: number, newCategoryId: number) => {
    setState((prev) => ({
      ...prev,
      lists: prev.lists.map((l) => {
        if (l.id !== listId) return l;
        // Find the cart category
        const cartCat = l.categories.find((c) => c.isShoppingCart);
        return {
          ...l,
          items: l.items.map((item) => {
            if (item.id !== itemId) return item;
            // Moving into the cart
            if (cartCat && newCategoryId === cartCat.id) {
              return {
                ...item,
                originalCategoryId: item.categoryId,
                categoryId: newCategoryId,
                inCart: true,
              };
            }
            // Moving out of the cart
            if (cartCat && item.categoryId === cartCat.id) {
              return {
                ...item,
                categoryId: newCategoryId,
                inCart: false,
                originalCategoryId: undefined,
              };
            }
            // Moving between user categories (not cart)
            return {
              ...item,
              categoryId: newCategoryId,
              originalCategoryId: newCategoryId,
            };
          }),
        };
      }),
    }));
  }, []);

  // List selection
  const selectList = useCallback((listId: number) => {
    setState((prev) => ({ ...prev, selectedListId: listId }));
  }, []);

  return {
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
  };
}
