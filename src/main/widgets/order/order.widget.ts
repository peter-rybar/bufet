import { Widget, JsonMLs } from "../../prest/jsonml";
import { Signal } from "../../prest/signal";
import { OrderItem } from "../../interfaces/order-item.interface";
import { Order } from "../../interfaces/order.interface";


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
                            ["tr.order", { title: `code: ${orderItem.product.code}` },
                                ["td", orderItem.product.title],
                                ["td", orderItem.product.price.toFixed(2), "€"],
                                ["td.center.aligned", orderItem.count],
                                ["td.right.aligned", (orderItem.product.price * orderItem.count).toFixed(2), "€"],
                                ["td.center.aligned",
                                    ["button.ui.button.icon.tiny",
                                        { click: () => this.remove(orderItem).update() },
                                        ["i.icon.minus"]
                                    ],
                                    ["button.ui.button.icon.tiny",
                                        { click: () => this.add(orderItem).update() },
                                        ["i.icon.plus"]
                                    ]
                                ]
                            ]
                        );
                    })
                ],
                ["tfoot.full-width",
                    ["tr",
                        ["th", { colspan: 2 }],
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
                    ["i.close.icon", { click: () => this.setMessage().update() }],
                    ["div.header", this._message]
                    // ["p", "This is a special notification which you can dismiss if you're bored with it."]
                ] :
                [""])
        ];
    }

}