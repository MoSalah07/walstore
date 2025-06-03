import { Cart, Orderitem } from "@/interfaces/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const initialState: Cart = {
  items: [],
};

interface CartState {
  cart: Cart;
  addItem: (item: Orderitem, quantity: number) => string;
  removeItem: (item: Orderitem) => void;
  updateItem: (item: Orderitem, quantity: number) => void;
  // clear: () => void;
}

const useCartStore = create(
  persist<CartState>(
    (set, get) => ({
      cart: initialState,

      addItem: (item: Orderitem, quantity: number) => {
        const cart = get().cart;
        const { items } = cart;
        const matchItem = (x: Orderitem) =>
          x.product === item.product &&
          x.size === item.size &&
          x.color === item.color;

        const existing = items.find(matchItem);

        const newQuantity = existing ? existing.quantity + quantity : quantity;

        const stockAvailable = item.countInStock >= newQuantity;

        if (!stockAvailable) {
          throw new Error("Not enough items in stock");
        }

        const updatedItems = existing
          ? items.map((x) =>
              matchItem(x) ? { ...x, quantity: newQuantity } : x
            )
          : [...items, { ...item, quantity }];

        set({
          cart: {
            ...cart,
            items: updatedItems,
          },
        });

        const foundItem = updatedItems.find(matchItem);
        if (!foundItem) {
          throw new Error("Item not found in cart");
        }
        return foundItem.clientId;
      },
      removeItem: (item: Orderitem) => {
        const cart = get().cart;
        const { items } = cart;
        const updatedItems = items.filter(
          (x) =>
            x.product !== item.product ||
            x.size !== item.size ||
            x.color !== item.color
        );
        set({
          cart: {
            ...cart,
            items: updatedItems,
          },
        });
      },
      updateItem: (item: Orderitem, quantity: number) => {
        const cart = get().cart;
        const { items } = cart;
        const matchItem = (x: Orderitem) =>
          x.product === item.product &&
          x.size === item.size &&
          x.color === item.color;
        const existing = items.find(matchItem);
        if (!existing) return;
        const updatedItems = existing
          ? items.map((x) => (matchItem(x) ? { ...x, quantity: quantity } : x))
          : [...items, { ...item, quantity }];

        set({
          cart: {
            ...cart,
            items: updatedItems,
          },
        });
      },
    }),
    {
      name: "cart-store",
    }
  )
);

export default useCartStore;
