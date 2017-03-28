import { element } from "./prest/widgets";
import { HttpRequest } from "./prest/http";

export const version: string = "@VERSION@";

interface Product {
    id: string;
    title: string;
    price: number;
    count: number;
}

const productsEl = document.getElementById("products");

new HttpRequest()
    .get("products")
    .onResponse(res => {
        console.log(res.getJson());
        const products: Product[] = res.getJson().products;
        products.forEach(p => {
            productsEl.appendChild(element(`
                <div>
                    <span title="${p.id}">
                        ${p.title}
                        <strong>${p.price} €</strong>
                        <em>${p.count} ks</em>
                    </span>
                </div>`));
        });
    })
    .onError(err => {
        console.error(err);
    })
    .send();
