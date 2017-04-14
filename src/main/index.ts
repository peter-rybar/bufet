
import { HttpRequest } from "./prest/http";
import { Widget, html, select, jsonml, empty } from "./prest/dom";
import { Signal } from "./prest/signal";

export const version: string = "@VERSION@";

// model

interface User {
    login: string;
    name: number;
}

interface Product {
    id?: string;
    title: string;
    price: number;
    count: number;
}

interface Order {
    id?: string;
    count: number;
    product: Product;
}

// UI

class ProductsWidget implements Widget {

    readonly name: string;

    readonly sigOrder = new Signal<Order>();

    private _element: HTMLElement;
    private _products: Product[] = [];

    constructor(name: string = "") {
        this.name = name;
    }

    setProducts(products: Product[]): this {
        this._products = products;
        this._update();
        return this;
    }

    onSigOrder(slot: (o: Order) => void): this {
        this.sigOrder.connect(slot);
        return this;
    }

    mount(e: HTMLElement): this {
        this._element = e;
        this._update();
        return this;
    }

    umount(): this {
        return this;
    }

    element(): HTMLElement {
        if (!this._element) {
            this._element = html(`<div></div>`);
        }
        this._update();
        return this._element;
    }

    private _update(): void {
        if (this._element) {
            const el = jsonml(
                ["div.products",
                    ...this._products.map(product => {
                        return (
                            ["div.product", { title: `id: ${product.id}`},
                                product.title, " ",
                                ["strong", product.price, " €"], " ",
                                ["em", product.count, " ks"], " ",
                                ["button.ui.button.icon", {
                                    click: () => this.sigOrder.emit({ product: product, count: 1 }) },
                                    ["i.icon.plus"]]
                            ]
                        );
                    })
                ]);
            empty(this._element);
            this._element.appendChild(el);
        }
    }

}

class OrdersWidget implements Widget {

    readonly name: string;

    private _element: HTMLElement;
    private _orders: Order[] = [];

    readonly sigOrders = new Signal<Order[]>();

    constructor(name: string = "") {
        this.name = name;
    }

    addOrder(order: Order): this {
        const found = this._orders.find(o => o.product.id === order.product.id);
        if (found) {
            found.count++;
        } else {
            this._orders.push(order);
        }
        this._update();
        return this;
    }

    removeOrder(order: Order): this {
        const found = this._orders.find(o => o.product.id === order.product.id);
        if (found) {
            if (found.count > 1) {
                found.count--;
            } else {
                this._orders = this._orders.filter(o => o.product.id !== order.product.id);
            }
        }
        this._update();
        return this;
    }

    onSigOrders(slot: (o: Order[]) => void): this {
        this.sigOrders.connect(slot);
        return this;
    }

    mount(e: HTMLElement): this {
        this._element = e;
        this._update();
        return this;
    }

    umount(): this {
        return this;
    }

    private _update(): void {
        if (this._element) {
            const sum = this._orders.reduce(
                (sum, order) => sum + order.product.price * order.count,
                0);
            const el = jsonml(
                ["div.orders",
                    ...this._orders.map(order => {
                        return (
                            ["div.order", { title: `product id: ${order.product.id}` },
                                `${order.product.title}: ${order.count} &times; ${order.product.price} € = `,
                                ["strong", `${order.product.price * order.count} € `],
                                ["button.ui.button.icon", {
                                    click: () => this.removeOrder(order) },
                                    ["i.icon.minus"]]]);
                    }),
                    sum ? [...
                        ["strong", `Sum: ${sum} € `],
                        ["button.ui.button", {
                            click: () => this.sigOrders.emit(this._orders) },
                            "submit"]
                    ] : "",
                ]);
            empty(this._element);
            this._element.appendChild(el);
        }
    }

}

// services

class Server {

    private baseUrl: string;

    constructor(baseUrl?: string) {
        this.baseUrl = baseUrl || "";
    }

    userGet(onUser: (u: User) => void) {
        new HttpRequest()
            .get(this.baseUrl + "/user")
            .onResponse(res => {
                console.log(res.getJson());
                const user: User = res.getJson().user;
                onUser && onUser(user);
            })
            .onError(err => {
                console.error(err);
            })
            .send();
    }

    productsGet(onProducts: (p: Product[]) => void) {
        new HttpRequest()
            .get(this.baseUrl + "/products")
            .onResponse(res => {
                console.log(res.getJson());
                const products: Product[] = res.getJson().products;
                onProducts && onProducts(products);
            })
            .onError(err => {
                console.error(err);
            })
            .send();
    }

    orderPost(o: Order, onOrder: (o: Order) => void) {
        new HttpRequest()
            .post(this.baseUrl + "/order")
            .onResponse(res => {
                console.log(res.getJson());
                const order: Order = res.getJson().order;
                onOrder && onOrder(order);
            })
            .onError(err => {
                console.error(err);
            })
            .send(o);
    }
}

// main

const server = new Server();


const productsWidget = new ProductsWidget()
    .onSigOrder(order => {
        console.log("order", order);
        ordersWidget.addOrder(order);
    })
    .mount(select("products"));

const ordersWidget = new OrdersWidget()
    .onSigOrders(orders => {
        console.log(orders);
    })
    .mount(select("orders"));


server.productsGet(products => {
    console.log("products", products);
    productsWidget.setProducts(products);
});

server.userGet(user =>
    select("#user").innerText = `${user.name} (${user.login})`);
