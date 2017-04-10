
import { HttpRequest } from "./prest/http";
import { Widget, html, select, jsonml } from "./prest/dom";
import { Signal } from "./prest/signal";

export const version: string = "@VERSION@";


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

class ProductWidget implements Widget {

    readonly name: string;

    readonly sigOrder = new Signal<Order>();

    private _element: HTMLElement;
    private _product: Product;

    constructor(name: string = "") {
        this.name = name;
    }

    setProduct(p: Product): this {
        this._product = p;
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
            this._element.innerHTML = "";
            const p = this._product;
            // const el = html(`
            //     <div class="product" title="id: ${p.id}">
            //         ${p.title}
            //         <strong>${p.price} €</strong>
            //         <em>${p.count} ks</em>
            //         <input type="number" value="1" min="1" max="${p.count}" step="1"/>
            //         <button type="button">roder</button>
            //     </div>`);
            // const i = select("input", el) as HTMLInputElement;
            // select("button", el).addEventListener("click", () => {
            //     this.sigOrder.emit({
            //         product: this._product,
            //         count: +i.value
            //     });
            // });
            const el = jsonml(
                ["div.product", { title: `id: ${p.id}`},
                    p.title, " ",
                    ["strong", p.price, " €"], " ",
                    ["em", p.count, " ks"], " ",
                    ["input", { type: "number", value: 1, min: 1, max: p.count, step: 1 }], " ",
                    ["button", { type: "button",
                            click: () => {
                                const i = select("input", el) as HTMLInputElement;
                                this.sigOrder.emit({
                                    product: this._product,
                                    count: +i.value
                                });
                            }
                        },
                        "roder"]]);
            this._element.appendChild(el);
        }
    }

}

class Server {

    private baseUrl: string;

    constructor(baseUrl?: string) {
        this.baseUrl = baseUrl || "";
    }

    productsGet(onProducts: (p: Product[]) => void) {
        new HttpRequest()
            .get(this.baseUrl + "/products")
            .onResponse(res => {
                // console.log(res.getJson());
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
                // console.log(res.getJson());
                const order: Order = res.getJson().order;
                onOrder && onOrder(order);
            })
            .onError(err => {
                console.error(err);
            })
            .send(o);
    }
}

function main() {
    const server = new Server();

    const productsElement = select("#products");
    const ordersElement = select("#orders");

    server.productsGet(products => {
        console.log("products", products);
        products.forEach(p => {
            const pw = new ProductWidget()
                .setProduct(p)
                .onSigOrder(order => {
                    console.log("order", order);
                    server.orderPost(order, o => {
                        console.log("order accepted", o);
                        // ordersElement.appendChild(html(`
                        //     <div class="order" title="id: ${o.id}">
                        //         ${p.title}: ${o.count} &times; ${o.product.price} € =
                        //         <strong>${o.product.price * o.count} €</strong>
                        //     </div>`));
                        ordersElement.appendChild(jsonml(
                            ["div.order", { title: `id: ${o.id}` },
                                `${p.title}: ${o.count} &times; ${o.product.price} € = `,
                                ["strong", `${o.product.price * o.count} €`]]));
                    });
                });
            productsElement.appendChild(pw.element());
        });
    });
}

main();
