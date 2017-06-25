import { Widget, JsonMLs } from "../../prest/jsonml";
import { Signal } from "../../prest/signal";
import { Product } from "../../interfaces/product.interface";
import { OrderItem } from "../../interfaces/order-item.interface";

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
                        ["div.product.card", { title: `code: ${product.code}`},
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
                                click: () => this.sigOrderItem.emit({ product: product, count: 1 }) },
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