///<reference path="../../node_modules/@types/jquery/index.d.ts"/>

import { HttpRequest } from "./prest/http";
import {
    Widget, html, select, jsonml, empty, remove, append
} from "./prest/dom";
import { Signal } from "./prest/signal";

export const version: string = "@VERSION@";

// model

interface User {
    login: string;
    name: number;
    role: string;
}

interface Product {
    code: string;
    title: string;
    description: string;
    price: number;
    count: number;
    sold: number;
}

interface OrderItem {
    count: number;
    product: Product;
}

interface Order {
    items: OrderItem[];
    count: number;
    price: number;
    timestamp?: string;
}

// UI

class ProductsWidget implements Widget {

    readonly sigOrderItem = new Signal<OrderItem>();

    private _element: HTMLElement;
    private _products: Product[] = [];

    setProducts(products: Product[]): this {
        this._products = products;
        this._update();
        return this;
    }

    onSigOrder(slot: (o: OrderItem) => void): this {
        this.sigOrderItem.connect(slot);
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
            // const el = jsonml(
            //     ["div.products.ui.divided.items",
            //         ...this._products.map(product => {
            //             return (
            //                 ["div.product.item", { title: `code: ${product.code}`},
            //                     // ["div.image", ["img", {src: "img.jpg"}]],
            //                     ["div.content",
            //                         ["div.header", product.title, " "],
            //                         ["div.meta", "novinka"],
            //                         ["div.description", product.description],
            //                         // ["strong.price", product.price, " € "],
            //                         // ["em.count", product.count, " ks "]
            //                         ["div.extra",
            //                             ["div.ui.right.floated.button.primary", {
            //                                 click: () => this.sigOrderItem.emit({ product: product, count: 1 }) },
            //                                 ["i.icon.add.to.cart"], "Do košíka"
            //                             ],
            //                             ["strong.price", product.price.toFixed(2), " € "],
            //                             ["span.count", product.count, " na sklade"]
            //                         ]
            //                     ]
            //                 ]
            //             );
            //         })
            //     ]);
            const el = jsonml(
                ["div.products.ui.cards",
                    ...this._products.map(product => {
                        return (
                            ["div.product.card", { title: `code: ${product.code}`},
                                // ["div.image", ["img", {src: "img.jpg"}]],
                                ["div.content",
                                    ["div.header", product.title, " "],
                                    // ["div.meta", "novinka"],
                                    ["div.description", product.description]
                                ],
                                ["div.extra",
                                    ["strong.price", product.price.toFixed(2), " € "],
                                    ["span.count.right.floated", product.count, " na sklade"]
                                ],
                                ["div.ui.bottom.attached.button", {
                                        click: () => this.sigOrderItem.emit({ product: product, count: 1 }) },
                                    ["i.icon.add.to.cart"], "Do košíka"
                                ]
                            ]
                        );
                    })
                ]);
            empty(this._element);
            append(this._element, el);
        }
    }

}

class OrderWidget implements Widget {

    private _element: HTMLElement;
    private _orderItems: OrderItem[] = [];

    readonly sigOrder = new Signal<Order>();

    orderDone(): this {
        this._orderItems.length = 0;
        this._update();
        return this;
    }

    message(): void {
        const e = jsonml(
            ["div.ui.message.info",
                ["i.close.icon", { click: () => remove(e) }],
                ["div.header", "Objednávka bola odoslaná"]
                // ["p", "This is a special notification which you can dismiss if you're bored with it."]
            ]);
        this._element.appendChild(e);
    }

    add(orderItem: OrderItem): this {
        const found = this._orderItems
            .find(o => o.product.code === orderItem.product.code);
        if (found) {
            found.count++;
        } else {
            this._orderItems.push(orderItem);
        }
        this._update();
        return this;
    }

    remove(orderItem: OrderItem): this {
        const found = this._orderItems
            .find(o => o.product.code === orderItem.product.code);
        if (found) {
            if (found.count > 1) {
                found.count--;
            } else {
                this._orderItems = this._orderItems
                    .filter(o => o.product.code !== orderItem.product.code);
            }
        }
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

    private _update(): void {
        if (this._element) {
            const price = this._orderItems.reduce(
                (sum, order) => sum + order.product.price * order.count,
                0);
            const count = this._orderItems.reduce(
                (count, order) => count + order.count,
                0);
            const el = jsonml(
                ["table.orders.ui.table.selectable.compact",
                    ["thead",
                        ["tr",
                            ["th", "Produkt"],
                            ["th", "Jedn. Cena"],
                            ["th.center.aligned", "Počet"],
                            ["th.center.aligned", "Cena"],
                            ["th"]
                        ]
                    ],
                    ["tbody",
                        ...this._orderItems.map(orderItem => {
                            return (
                                ["tr.order", { title: `code: ${orderItem.product.code}` },
                                    ["td", orderItem.product.title],
                                    ["td", `${orderItem.product.price.toFixed(2)} €`],
                                    ["td.center.aligned", orderItem.count],
                                    ["td.right.aligned", `${(orderItem.product.price * orderItem.count).toFixed(2)} €`],
                                    ["td.center.aligned",
                                        ["button.ui.button.icon.tiny",
                                            { click: () => this.remove(orderItem) },
                                            ["i.icon.minus"]
                                        ],
                                        ["button.ui.button.icon.tiny",
                                            { click: () => this.add(orderItem) },
                                            ["i.icon.plus"]
                                        ]
                                    ]
                                ]);
                        })
                    ],
                    ["tfoot.full-width",
                        ["tr",
                            ["th", { colspan: 2 }],
                            ["th.center.aligned", ["strong", "" + count]],
                            ["th.right.aligned", ["strong", "" + price.toFixed(2)], " €"],
                            ["th.center.aligned",
                                ["button.order.ui.button" + (price ? "" : ".disabled"),
                                    {
                                        click: (e: Event) => {
                                            (e.target as Element).classList.add("loading");
                                            this.sigOrder.emit(
                                                {
                                                    items: this._orderItems,
                                                    count: count,
                                                    price: +price.toFixed(2)
                                                });
                                        }
                                    },
                                    // ["i.icon.send"],
                                    "Objednať"
                                ]
                            ]
                        ]
                    ]
                ]);
            // ($(this._element) as any).tablesort();
            empty(this._element);
            append(this._element, el);
        }
    }

}


class OrdersStatsWidget implements Widget {

    private _element: HTMLElement;
    private _orders: Order[] = [];

    setOrders(orders: Order[]): this {
        this._orders = orders;
        this._update();
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
            const orders = this._orders;
            const sum = orders.map(o => o.price).reduce((sum, price) => sum + price, 0);
            const count = orders.map(o => o.count).reduce((sum, count) => sum + count, 0);
            const stat = `
                <div class="ui statistics small">
                    <div class="statistic blue">
                        <div class="value">${orders.length}</div>
                        <div class="label">Objednávky</div>
                    </div>
                    <div class="statistic green">
                        <div class="value">${count}</div>
                        <div class="label">Produkty</div>
                    </div>
                    <div class="statistic red">
                        <div class="value">${sum.toFixed(2)} €</div>
                        <div class="label">Celková cena</div>
                    </div>
                </div>`;
            this._element.innerHTML = stat;
        }
    }

}

// services

class Server {

    private baseUrl: string;

    constructor(baseUrl?: string) {
        this.baseUrl = baseUrl || "";
    }

    userGet(onUser: (u: User) => void, onError: (e: Event) => void) {
        new HttpRequest()
            .get(this.baseUrl + "/user")
            .onResponse(res => {
                console.log(res.getJson());
                const user: User = res.getJson().user;
                onUser && onUser(user);
            })
            .onError(err => {
                console.error(err);
                onError && onError(err);
            })
            .send();
    }

    productsGet(onProducts: (p: Product[]) => void, onError: (e: Event) => void) {
        new HttpRequest()
            .get(this.baseUrl + "/products")
            .onResponse(res => {
                console.log(res.getJson());
                const products: Product[] = res.getJson().products;
                onProducts && onProducts(products);
            })
            .onError(err => {
                console.error(err);
                onError && onError(err);
            })
            .send();
    }

    orderPost(order: Order,
              onOrder: (o: OrderItem) => void,
              onError: (e: Event) => void) {
        new HttpRequest()
            .post(this.baseUrl + "/order")
            .onResponse(res => {
                console.log(res.getJson());
                const order: OrderItem = res.getJson().order;
                onOrder && onOrder(order);
            })
            .onError(err => {
                console.error(err);
                onError && onError(err);
            })
            .send(order);
    }

    ordersGet(onOrders: (o: Order[]) => void, onError: (e: Event) => void) {
        new HttpRequest()
            .get(this.baseUrl + "/orders")
            .onResponse(res => {
                console.log(res.getJson());
                const orders: Order[] = res.getJson().orders;
                onOrders && onOrders(orders);
            })
            .onError(err => {
                console.error(err);
                onError && onError(err);
            })
            .send();
    }
}

// main

const server = new Server();


const productsWidget = new ProductsWidget()
    .onSigOrder(order => ordersWidget.add(order))
    .mount(select("products"));

const ordersWidget = new OrderWidget()
    .onSigOrder(order => {
        server.orderPost(order,
            order => {
                ordersWidget.orderDone();
                ordersWidget.message();
                server.ordersGet(
                    orders => ordersStatsWidget.setOrders(orders),
                    err => console.log(err)
                );
            },
            err => {
                console.log(err);
                ordersWidget.orderDone();
            }
        );
    })
    .mount(select("order"));

const ordersStatsWidget = new OrdersStatsWidget()
    .mount(select("orders"));


server.productsGet(
    products => {
        console.log("products", products);
        productsWidget.setProducts(products);
    },
    err => {
        console.log(err);
    }
);


select("#login").addEventListener("click", () => {
    server.userGet(
        user => {
            const e = select("#user");
            e.innerHTML = `
                <span title="login: ${user.login}">
                    ${user.name + (user.role === "admin" ? " (admin)" : "")}
                </span>`;
            server.ordersGet(
                orders => ordersStatsWidget.setOrders(orders),
                err => console.log(err)
            );
        },
        err => {
            console.log(err);
        }
    );
});
