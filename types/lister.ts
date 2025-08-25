// Lister data types for shopping list feature

export interface ListerItem {
  id: number;
  name: string;
  categoryId: number | null; // null means 'Other'
  inCart: boolean;
  originalCategoryId?: number | null; // for restoring from cart
  order: number;
}

export interface ListerCategory {
  id: number;
  name: string;
  order: number;
  isSpecial?: boolean; // legacy, can be used for general special status
  isOther?: boolean; // true for 'Other' category
  isShoppingCart?: boolean; // true for 'In shopping cart' category
}

export interface ListerList {
  id: number;
  name: string;
  color: string; // hex color for the list
  categories: ListerCategory[];
  items: ListerItem[];
}

export interface ListerState {
  lists: ListerList[];
  lastId: number; // for incrementing unique IDs
  selectedListId: number | null;
}
