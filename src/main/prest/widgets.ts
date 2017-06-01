import {Signal} from "../prest/signal";
import {User, Order, OrderItem, Product} from "interfaces";
import {Widget, FormWidget, JsonMLs} from "../prest/jsonml";
import {Form} from "../prest/form";


export class ProductsTable extends FormWidget {
    readonly sigPurchase = new Signal<Product>();
    private _products: Product[] = [];
    private t_expenses: number = 0;
    private t_takings: number = 0;
    private t_diff: number = 0;
    private t_profit: number = 0;
    private _forms: boolean[] = [];

    attachForms(): void {
        let forms = this.dom.getElementsByTagName("form");
        if (forms.length > 0) {
            for (let i = 0; i < forms.length; i++) {
                if (!this._forms[i]) {
                    /**
                     * assume that products and thus rows in the table are always in the same order, so we are attaching the Form object just for new rows
                     */
                    let f = new Form(<HTMLFormElement> forms[i]);
                    f.onSubmit(this.save_form.bind(this));
                    this._forms[i] = true;
                }
            }
        }
        return;
    }

    onSigPurchase(slot: (o: Product) => void): this {
        this.sigPurchase.connect(slot);
        return this;
    }

    save_form(form: Form): void {
        this.sigPurchase.emit(form.getValues());
        return;
    }

    getExpenses(product: Product): number {
        return (product.sold + product.count) * product.price_purchase;
    }

    getTakings(product: Product): number {
        return product.sold * product.price;
    }

    getDiff(takings: number, expenses: number): number {
        return (takings - expenses);
    }

    getProfit(takings: number, product: Product): number {
        return takings - (product.sold * product.price_purchase);
    }

    setProducts(products: Product[]): this {
        this.t_expenses = 0;
        this.t_takings = 0;
        this.t_diff = 0;
        this.t_profit = 0;
        for (let product of products) {
            let takings = this.getTakings(product);
            this.t_expenses += this.getExpenses(product);
            this.t_takings += takings;
            this.t_profit += this.getProfit(takings, product);
        }
        this.t_diff = this.getDiff(this.t_takings, this.t_expenses);
        this._products = products;
        this.update();
        return this;
    }

    render(): JsonMLs {
        return [["table.products.ui.celled.table",
            ["thead",
                ["tr",
                    ["th", "Product"],
                    ["th", "Items on stock"],
                    ["th", "Items sold"],
                    ["th", "Purchase unit price"],
                    ["th", "Sell unit price"],
                    ["th", "Expenses"],
                    ["th", "Takings"],
                    ["th", "Expenses vs Takings"],
                    ["th", "Profit"],
                    ["th", "Here be dragons (quick add form)"]
                ]
            ],
            ["tbody",
                ...this._products.map(product => {
                    let _row_class = (product.count === 0 ? ".error" : product.count <= product.alert_low ? ".warning" : "");
                    let expenses = this.getExpenses(product);
                    let takings = this.getTakings(product);
                    let diff = this.getDiff(takings, expenses);
                    let profit = this.getProfit(takings, product);
                    return (["tr" + _row_class,
                        ["td", product.title],
                        ["td", product.count],
                        ["td", product.sold],
                        ["td", product.price_purchase.toFixed(2)],
                        ["td", product.price.toFixed(2)],
                        ["td", expenses.toFixed(2)],
                        ["td", takings.toFixed(2)],
                        ["td", diff.toFixed(2)],
                        ["td", profit.toFixed(2)],
                        ["td", ["form.new_product.ui.form",
                            ["input", {"type": "hidden", "name": "code", "value": product.code}],
                            ["input", {"type": "number", "name": "count", "value": 5, "required": true}],
                            ["button.ui.button.primary", {"type": "submit"}, "add"]
                        ]]
                    ]);
                })],
            ["tfoot",
                ["tr",
                    ["th", ["strong", "Summary"]],
                    ["th", " "],
                    ["th", " "],
                    ["th", " "],
                    ["th", " "],
                    ["th", ["strong", this.t_expenses.toFixed(2)]],
                    ["th", ["strong", this.t_takings.toFixed(2)]],
                    ["th", ["strong", this.t_diff.toFixed(2)]],
                    ["th", ["strong", this.t_profit.toFixed(2)]],
                    ["th", " "]
                ]
            ]
        ]]
            ;
    }
}
export class ProductsPurchaseForm extends FormWidget {
    readonly sigPurchase = new Signal<Product>();
    private _products: Product[] = [];
    private _form: boolean = false;

    attachForms(): void {
        if (!this._form) {
            let f = new Form(<HTMLFormElement> this.dom.firstChild);
            f.onSubmit(this.save_form.bind(this));
            this._form = true;
        }
        return;
    }

    save_form(form: Form): void {
        this.sigPurchase.emit(form.getValues());
        return;
    }

    constructor() {
        super();
    }

    setProducts(products: Product[]): this {
        this._products = products;
        this.update();
        return this;
    }

    onSigPurchase(slot: (o: Product) => void): this {
        this.sigPurchase.connect(slot);
        return this;
    }

    render(): JsonMLs {
        return [["form.new_product.ui.form",
            ["div.field",
                ["label", "Item code"],
                ["input", {"type": "text", "name": "code", "placeholder": "some_code", "required": true}]
            ],
            ["div.field",
                ["label", "Item name"],
                ["input", {"type": "text", "name": "title", "placeholder": "some title", "required": true}]
            ],
            ["div.field",
                ["label", "Item description"],
                ["input", {"type": "text", "name": "description", "placeholder": "some description", "required": true}]
            ],
            ["div.field",
                ["label", "Purchased items"],
                ["input", {"type": "number", "name": "count", "value": 0, "required": true}]
            ],
            ["div.field",
                ["label", "Unit purchase price"],
                ["input", {"type": "number", "name": "price_purchase", "value": 0, "required": true}]
            ],
            ["div.field",
                ["label", "Unit selling price"],
                ["input", {"type": "number", "name": "price", "value": 0, "required": true}]
            ],
            ["div.field",
                ["label", "Alert for min pieces"],
                ["input", {"type": "number", "name": "alert_low", "value": 5, "required": true}]
            ],
            ["button.ui.button.primary", {"type": "submit"}, "Save"],
            ["button.ui.button", {"type": "reset"}, "Reset"]
        ]];
    }
}


export class AdminMenuWidget extends Widget {

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
                    ["a.item.active", "Admin"],
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
                            ["div.content",
                                ["div.header", product.title, " "],
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