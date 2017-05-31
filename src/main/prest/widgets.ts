import {Signal} from "signal";
import {User, Order, OrderItem, Product} from "interfaces";
import {Widget, JsonMLs} from "jsonml";
export class MenuWidget extends Widget {

    private _user: User;

    readonly sigLogin = new Signal<void>();

    constructor() {
        super();
    }

    setUser(user: User): this {
        this._user = user;
        return this;
    }

    onSigLogin(slot: () => void): this {
        this.sigLogin.connect(slot);
        return this;
    }

    render(): JsonMLs {
        return [
            ["div.ui.segment.basic",
                ["div.ui.secondary.pointing.menu",
                    ["a.item.active", "Bufet"],
                    ["a.item", {href: "#order"}, "Nákupný Košík"],
                    ["a.item", {href: "#orders"}, "Objednávky"],
                    ["div.right.menu",
                        ["a.ui.item",
                            ["span", {click: (e: Event) => this.sigLogin.emit()},
                                this._user ?
                                    ["span", {title: `login: ${this._user.login}`},
                                        this._user.name + (this._user.role === "admin" ? " (admin)" : "")
                                    ] :
                                    ["span", {id: "login"}, "Login"]
                            ]
                        ]
                    ]
                ]
            ]
        ];
    }

}
export class ProductsWidget extends Widget {

    private _products: Product[] = [];

    readonly sigOrderItem = new Signal<OrderItem>();

    setProducts(products: Product[]): this {
        this._products = products;
        this.update();
        return this;
    }

    onSigOrderItem(slot: (o: OrderItem) => void): this {
        this.sigOrderItem.connect(slot);
        return this;
    }

    render(): JsonMLs {
        return [
            ["div.products.ui.cards",
                ...this._products.map(product => {
                    return (
                        ["div.product.card", {title: `code: ${product.code}`},
                            // ["div.image", ["img", {src: "img.jpg"}]],
                            ["div.content",
                                ["div.header", product.title, " "],
                                // ["div.meta", "novinka"],
                                ["div.description", product.description]
                            ],
                            ["div.extra",
                                ["strong.price", product.price.toFixed(2), "€ "],
                                ["span.count.right.floated", product.count, " na sklade"]
                            ],
                            ["div.ui.bottom.attached.button", {
                                click: () => this.sigOrderItem.emit({product: product, count: 1})
                            },
                                ["i.icon.add.to.cart"],
                                "Do košíka"
                            ]
                        ]
                    );
                })
            ]
        ];
    }

}
export class OrderWidget extends Widget {

    private _orderItems: OrderItem[] = [];
    private _message: string;
    private _messageType: "info" | "error";

    readonly sigOrder = new Signal<Order>();

    setMessage(message = "", type: "info" | "error" = "info"): this {
        this._message = message;
        this._messageType = type;
        return this;
    }

    empty(): this {
        this._orderItems.length = 0;
        return this;
    }

    add(orderItem: OrderItem): this {
        const found = this._orderItems
            .filter(o => o.product.code === orderItem.product.code);
        if (found.length) {
            found[0].count++;
        } else {
            this._orderItems.push(orderItem);
        }
        return this;
    }

    remove(orderItem: OrderItem): this {
        const found = this._orderItems
            .filter(o => o.product.code === orderItem.product.code);
        if (found.length) {
            if (found[0].count > 1) {
                found[0].count--;
            } else {
                this._orderItems = this._orderItems
                    .filter(o => o.product.code !== orderItem.product.code);
            }
        }
        return this;
    }

    onSigOrder(slot: (o: Order) => void): this {
        this.sigOrder.connect(slot);
        return this;
    }

    render(): JsonMLs {
        const price = this._orderItems.reduce(
            (sum, order) => sum + order.product.price * order.count,
            0);
        const count = this._orderItems.reduce(
            (count, order) => count + order.count,
            0);
        return [
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
                            ["tr.order", {title: `code: ${orderItem.product.code}`},
                                ["td", orderItem.product.title],
                                ["td", orderItem.product.price.toFixed(2), "€"],
                                ["td.center.aligned", orderItem.count],
                                ["td.right.aligned", (orderItem.product.price * orderItem.count).toFixed(2), "€"],
                                ["td.center.aligned",
                                    ["button.ui.button.icon.tiny",
                                        {click: () => this.remove(orderItem).update()},
                                        ["i.icon.minus"]
                                    ],
                                    ["button.ui.button.icon.tiny",
                                        {click: () => this.add(orderItem).update()},
                                        ["i.icon.plus"]
                                    ]
                                ]
                            ]
                        );
                    })
                ],
                ["tfoot.full-width",
                    ["tr",
                        ["th", {colspan: 2}],
                        ["th.center.aligned", ["strong", "" + count]],
                        ["th.right.aligned", ["strong", price.toFixed(2)], "€"],
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
                                "Objednať"]
                        ]
                    ]
                ]
            ],
            (this._message ?
                ["div.ui.message." + this._messageType,
                    ["i.close.icon", {click: () => this.setMessage().update()}],
                    ["div.header", this._message]
                    // ["p", "This is a special notification which you can dismiss if you're bored with it."]
                ] :
                [""])
        ];
    }

}
export class OrdersStatsWidget extends Widget {

    private _orders: Order[] = [];

    setOrders(orders: Order[]): this {
        this._orders = orders;
        this.update();
        return this;
    }

    render(): JsonMLs {
        const orders = this._orders;
        const sum = orders.map(o => o.price).reduce((sum, price) => sum + price, 0);
        const count = orders.map(o => o.count).reduce((sum, count) => sum + count, 0);
        return [
            ["div.ui.statistics.small",
                ["div.statistic.blue",
                    ["div.value", orders.length],
                    ["div.label", "Objednávky"]
                ],
                ["div.statistic.green",
                    ["div.value", count],
                    ["div.label", "Produkty"]
                ],
                ["div.statistic.red",
                    ["div.value", sum.toFixed(2), "€"],
                    ["div.label", "Celková cena"]
                ]
            ]
        ];
    }

}
export class OrdersWidget extends Widget {

    private _orders: Order[] = [];

    empty(): this {
        this._orders.length = 0;
        return this;
    }

    getOrders(): Order[] {
        return this._orders;
    }

    setOrders(orders: Order[]): this {
        this._orders = orders;
        return this;
    }

    render(): JsonMLs {
        return [
            ["table.orders.ui.table.selectable.compact",
                ["thead",
                    ["tr",
                        ["th", "Produkt"],
                        ["th", "Jedn. Cena"],
                        ["th.center.aligned", "Počet"],
                        ["th.center.aligned", "Cena"]
                    ]
                ],
                ...this._orders
                    .map(order => {
                        return [
                            ["tr.orders",
                                ["td", {colspan: 4},
                                    ["strong", new Date(order.timestamp).toUTCString()]]
                            ],
                            ...order.items.map(orderItem => {
                                return (
                                    ["tr.order", {title: `code: ${orderItem.product.code}`},
                                        ["td", orderItem.product.title],
                                        ["td", orderItem.product.price.toFixed(2), "€"],
                                        ["td.center.aligned", orderItem.count],
                                        ["td.right.aligned", (orderItem.product.price * orderItem.count).toFixed(2), "€"]
                                    ]
                                );
                            }),
                            ["tr.sumar",
                                ["td", {colspan: 2}],
                                ["td.center.aligned", ["strong", "" + order.count]],
                                ["td.right.aligned", ["strong", order.price.toFixed(2)], "€"]
                            ]
                        ];
                    })
                    .reduce((a, i) => a.concat(i), [])
            ]
        ];
    }

}