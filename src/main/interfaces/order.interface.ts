import { OrderItem } from "./order-item.interface";

export interface Order {
    items: OrderItem[];
    count: number;
    price: number;
    timestamp?: string;
}
