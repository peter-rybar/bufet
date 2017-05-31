export interface User {
    login: string;
    name: number;
    role: string;
}
/**
 * added purchase price of an item
 */

export interface OrderItem {
    count: number;
    product: Product;
}

export interface Order {
    items: OrderItem[];
    count: number;
    price: number;
    timestamp?: string;
}


export interface Product {
    code: string;
    title: string;
    description: string;
    price: number;
    price_purchase: number;
    count: number;
    sold: number;
}
/**
 * Store the history of purchased for tracking the prices etc
 * product_code - reference to product
 * date - purchase date
 * count - number of purchases items
 * supplier_code - reference to supplier
 */

export interface PurchasesLog {
    product_code: string;
    date: number;
    count: number;
    supplier_code: string;
}

/**
 * Suppliers
 */

export interface Suppliers {
    code: string;
    name: string;
}