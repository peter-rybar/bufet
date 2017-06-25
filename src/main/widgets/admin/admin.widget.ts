import { Widget, JsonMLs } from "../../prest/jsonml";
import { Signal } from "../../prest/signal";
import { Product } from "../../interfaces/product.interface";

// https://github.com/Microsoft/TypeScript/issues/14537
// interface FormData {
//     keys(): String[]
// }

interface NewProductData {
    name: string;
    imageUrl?: string;
    cost: number;
    price: number;
    count: number;
}

class NewProductWidget extends Widget {
    private _heading: string;
    private _isLoading: boolean = false;
    private _message: string;
    private _messageType: string;
    public readonly sigNewProduct = new Signal<NewProductData>();

    constructor(heading: string) {
        super();

        this._heading = heading;
    }

    domAttach() {
        this._formEl.addEventListener("submit", this._onNewProductSubmit.bind(this));
    }

    domDetach() {
        this._formEl.removeEventListener("submit");
    }

    setLoadingState(isLoading: boolean) {
        this._isLoading = isLoading;
        this.update();
    }

    setMessage(message = "", type: "info" | "success" | "error" = "info"): this {
        if (type === "success") {
            this.resetForm();
        }

        this._message = message;
        this._messageType = type;
        return this;
    }

    private resetForm(): void {
        this._formEl.reset();
        this._message = null;
        this._messageType = null;
    }

    private get _formEl(): HTMLFormElement {
        return this.refs["formEl"] as HTMLFormElement;
    }

    private get _formData(): NewProductData {
        const inputs = this._formEl.elements;
        const data = {} as NewProductData;

        if ("name" in inputs) {
            const nameInput = inputs.namedItem("name") as HTMLInputElement;

            data.name = nameInput.value;
        }

        if ("imageUrl" in inputs) {
            const imageUrlInput = inputs.namedItem("imageUrl") as HTMLInputElement;

            data.imageUrl = imageUrlInput.value;
        }

        if ("cost" in inputs) {
            const costInput = inputs.namedItem("cost") as HTMLInputElement;

            data.cost = +costInput.value;
        }

        if ("price" in inputs) {
            const priceInput = inputs.namedItem("price") as HTMLInputElement;

            data.price = +priceInput.value;
        }

        if ("count" in inputs) {
            const countInput = inputs.namedItem("count") as HTMLInputElement;

            data.count = +countInput.value;
        }

        return data;
    }

    private get _loadingClass(): string {
        return this._isLoading ? ".loading" : "";
    }

    private get _messageClass(): string {
        return this._messageType ? "." + this._messageType : "";
    }

    private _onNewProductSubmit(e: Event): void {
        e.preventDefault();

        this.sigNewProduct.emit(this._formData);
    }

    render(): JsonMLs {
        return [
            ["h2", this._heading],
            [`form.ui${this._loadingClass}${this._messageClass}.form~formEl`, { name: "newProduct" },
                ["div.required.field",
                    ["label", "Meno"],
                    ["input~nameEl", { type: "text", name: "name", required: true }]
                ],
                ["div.field",
                    ["label", "Fotka (linka)"],
                    ["input~imageUrlEl", { type: "url", name: "imageUrl", pattern: "https?:\/\/.+" }]
                ],
                ["div.required.field",
                    ["label", "Cena (nákup)"],
                    ["input~costEl", { type: "text", name: "cost", required: true }]
                ],
                ["div.required.field",
                    ["label", "Cena (predaj)"],
                    ["input~priceEl", { type: "text", name: "price", required: true }]
                ],
                ["div.required.field",
                    ["label", "Počet"],
                    ["input~countEl", { type: "number", name: "count", required: true, value: "1", min: "1" }]
                ],
                (this._message ?
                    ["div.ui.message." + this._messageType,
                        ["i.close.icon", { click: () => this.setMessage().update() }],
                        ["div.header", this._message]
                    ] : [""]
                ),
                ["button.ui.primary.button", { type: "submit" }, "Ulož"],
                ["button.ui.button", { type: "reset" }, "Reset"],
            ]
        ]
    }
}

class InventoryWidget extends Widget {
    private _products: Product[] = [];
    private _heading: string;

    constructor(heading: string) {
        super();

        this._heading = heading;
    }

    setProducts(products: Product[]): this {
        this._products = products;
        this.update();
        return this;
    }

    render(): JsonMLs {
        return [
            ["h2", this._heading],
            ["table.ui.very.compact.table", 
                ["thead",
                    ["tr",
                        ["th", "Meno produktu"],
                        ["th", "Stav na sklade"]
                    ]
                ],
                ["tbody",
                    ...this._products.map(product => {
                        return (["tr", { title: product.title },
                            ["td", product.description],
                            ["td", product.count]
                        ])
                    })
                ]
            ],
        ]
    }
}

export class AdminWidget extends Widget {
    private _newProductWidget: NewProductWidget;
    private _inventoryWidget: InventoryWidget;

    constructor() {
        super();

        this._inventoryWidget = new InventoryWidget("Stav skladu");
        this._newProductWidget = new NewProductWidget("Nový produkt");
    }

    public get sigNewProduct(): Signal<NewProductData> {
        return this._newProductWidget.sigNewProduct;
    };

    setProducts(products: Product[]) {
        this._inventoryWidget.setProducts(products);
    }

    setNewProductFormLoadingState(isLoading: boolean) {
        this._newProductWidget.setLoadingState(isLoading);
    }

    setNewProductFormMessage(message: string, type: "info" | "success" | "error" = "info") {
        this._newProductWidget.setMessage(message, type).update();
    }

    render(): JsonMLs {
        return [
            ["div.ui.segment", this._inventoryWidget],
            ["div.ui.segment", this._newProductWidget]
        ]
    }
}