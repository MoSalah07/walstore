import { create } from "zustand";
import { persist } from "zustand/middleware";

type ProductBrowsingHistory = {
  id: string;
  category: string;
};

interface BrowsingHistoryState {
  products: ProductBrowsingHistory[];
  addItem: (product: ProductBrowsingHistory) => void;
  clear: () => void;
}

const useBrowsingHistoryStore = create<BrowsingHistoryState>()(
  persist(
    (set, get) => ({
      products: [],
      addItem: (product: ProductBrowsingHistory) => {
        const existingProducts = get().products.filter(
          (p) => p.id !== product.id
        );
        const updatedProducts = [product, ...existingProducts.slice(0, 10)];
        set({ products: updatedProducts });
      },
      clear: () => set({ products: [] }),
    }),
    {
      name: "browsing-history",
    }
  )
);

export default useBrowsingHistoryStore;
