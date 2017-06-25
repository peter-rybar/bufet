import { Widget, JsonMLs } from "../../prest/jsonml";
import { Order } from "../../interfaces/order.interface";

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