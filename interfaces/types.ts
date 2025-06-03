import { z } from "zod";
import { CartSchema, OrderItemsSchema } from "./validator/validator";

// Order
export type Orderitem = z.infer<typeof OrderItemsSchema>;

export type Cart = z.infer<typeof CartSchema>;
