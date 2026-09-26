import { create } from "zustand";
import { persist } from "zustand/middleware";

// Saved items live on the device until a server-side wishlist exists.
interface WishlistState {
  ids: string[];
  toggle: (id: string) => boolean;
  has: (id: string) => boolean;
}

const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const saved = get().ids.includes(id);
        set({ ids: saved ? get().ids.filter((x) => x !== id) : [id, ...get().ids] });
        return !saved;
      },
      has: (id) => get().ids.includes(id),
    }),
    { name: "wishlist" }
  )
);

export default useWishlist;
