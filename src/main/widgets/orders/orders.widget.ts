import { Widget, JsonMLs } from "../../prest/jsonml";
import { Order } from '../../interfaces/order.interface';

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
                                ["td", { colspan: 4 },
                                    ["strong", new Date(order.timestamp).toUTCString()]]
                            ],
                            ...order.items.map(orderItem => {
                                return (
                                    ["tr.order", { title: `code: ${orderItem.product.code}` },
                                        ["td", orderItem.product.title],
                                        ["td", orderItem.product.price.toFixed(2), "€"],
                                        ["td.center.aligned", orderItem.count],
                                        ["td.right.aligned", (orderItem.product.price * orderItem.count).toFixed(2), "€"]
                                    ]
                                );
                            }),
                            ["tr.sumar",
                                ["td", { colspan: 2 }],
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