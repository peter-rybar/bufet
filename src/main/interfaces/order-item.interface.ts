import { Product } from "./product.interface";

export interface OrderItem {
    count: number;
    product: Product;
}