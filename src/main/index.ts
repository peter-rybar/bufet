
import { http } from "./prest/http";
import { Signal } from "./prest/signal";
import { Widget, JsonMLs } from "./prest/jsonml";

import { MenuWidget } from "./widgets/menu/menu.widget";
import { ProductsWidget } from "./widgets/products/products.widget";
import { OrderWidget } from "./widgets/order/order.widget";
import { OrdersWidget } from "./widgets/orders/orders.widget";
import { OrdersStatsWidget } from "./widgets/orders-stats/orders-stats.widget";
import { AdminWidget } from "./widgets/admin/admin.widget";

import { User } from "./interfaces/user.interface";
import { Order } from "./interfaces/order.interface";

export const version: string = "@VERSION@";

class App extends Widget {

    private _menuWidget: MenuWidget;
    private _productsWidget: ProductsWidget;
    private _orderWidget: OrderWidget;
    private _ordersStatsWidget: OrdersStatsWidget;
    private _ordersWidget: OrdersWidget;
    private _adminWidget: AdminWidget;

    private _user: User;

    readonly sigUser = new Signal<User>();

    constructor() {
        super();
        this._initMenu();
        this._initProducts();
        this._initOrder();
        this._initOrdersStat();
        this._initOrders();
        this._initAdminWidget();
    }

    private get isUserAdmin(): boolean {
        return this._user && this._user.role === "admin";
    }

    render(): JsonMLs {
        return [
            ["div.ui.container",
                this._menuWidget
            ],
            ["div.ui.container",
                ["div.ui.basic.segment",
                    ["h1", "Produkty"],
                    this._productsWidget
                ]
            ],
            ["div.ui.container",
                ["div.ui.two.column.stackable.grid",
                    ["div.column",
                        ["div.ui.segment.basic",
                            ["h2", { id: "order" }, "Nákupný Košík"],
                            this._orderWidget
                        ]
                    ],
                    ["div.column",
                        ["div.ui.segment.basic",
                            ["h2", "Sumár"],
                            this._ordersStatsWidget
                        ]
                    ]
                ]
            ],
            ["div.ui.container",
                ["div.ui.segment.basic",
                    ["h2", { id: "orders" }, "Objednávky"],
                    this._ordersWidget
                ]
            ],
            this.isUserAdmin ? ["div.ui.container",
                ["div.ui.basic.segment",
                    ["h1", { id: "admin" }, "Administrácia"],
                    this._adminWidget
                ]
            ] : [""],
            ["div.ui.vertical.segment.footer",
                ["div.ui.container",
                    ["div.ui.segment.basic",
                        "Author: ",
                        ["a", { href: "http://prest-tech.appspot.com/peter-rybar"},
                            "Peter Rybár"
                        ],
                        " – Mail: ",
                        ["a", { href: "mailto:pr.rybar@gmail.com"},
                            "pr.rybar@gmail.com"
                        ]
                    ]
                ]
            ]
        ];
    }

    private _login(): void {
        http.get("/user")
            .onResponse(res => {
                const user = res.getJson().user as User;
                this._user = user;
                this.sigUser.emit(user);
                this.update();
            })
            .onError(err => console.error(err))
            .send();
    }

    private _initMenu(): void {
        this._menuWidget = new MenuWidget()
            .onSigLogin(() => this._login());
        this.sigUser.connect(user => this._menuWidget.setUser(user).update());
    }

    private _initProducts(): void {
        this._productsWidget = new ProductsWidget()
            .onSigOrderItem(order => {
                if (this._user) {
                    this._orderWidget.add(order).update();
                } else {
                    this._login();
                }
            });

        this._getProducts();
    }

    private _getProducts(): void {
        http.get("/products")
            .onResponse(res => {
                const products = res.getJson().products;
                this._productsWidget.setProducts(products).update();

                if (this._adminWidget) {
                    this._adminWidget.setProducts(products);
                }
            })
            .onError(err => console.error(err))
            .send();
    }

    private _updateOrdersStats(): void {
        http.get("/orders")
            .onResponse(res =>
                this._ordersStatsWidget.setOrders(res.getJson().orders).update())
            .onError(err => console.error(err))
            .send();
    }

    private _postOrder(order: Order): void {
        http.post("/order")
            .onResponse(res => {
                this._orderWidget.setMessage("Objednávka bola odoslaná").empty().update();
                this._updateOrdersStats();
                this._updateOrders();
            })
            .onError(err => {
                console.error(err);
                this._orderWidget
                    .setMessage("Chyba odoslania objednávky: " +
                        (err.currentTarget as XMLHttpRequest).status, "error")
                    .update();
            })
            .send(order);
    }

    private _initOrder(): void {
        this._orderWidget = new OrderWidget()
            .onSigOrder(order => this._postOrder(order));
        this.sigUser.connect(user => this._updateOrdersStats());
    }

    private _initOrdersStat(): void {
        this._ordersStatsWidget = new OrdersStatsWidget();
    }

    private _updateOrders(): void {
        http.get("/orders")
            .onResponse(res =>
                this._ordersWidget.setOrders(res.getJson().orders).update())
            .onError(err => console.error(err))
            .send();
    }

    private _initOrders(): void {
        this._ordersWidget = new OrdersWidget();
        this.sigUser.connect(user => this._updateOrders());
    }

    private _initAdminWidget(): void {
        this._adminWidget = new AdminWidget();
        this._adminWidget.sigNewProduct.connect(data => this._postNewProduct(data));
    }

    private _postNewProduct(data: any): void {
        console.log('save data', data);

        http.post("/product/new")
            .onResponse(res => {
                console.log('product new res', res);
                this._adminWidget.setNewProductFormLoadingState(false);

                if (res.getStatus() !== 200) {
                    this._adminWidget.setNewProductFormMessage("Chyba", "error");
                    return;
                }

                this._getProducts();
                this._adminWidget.setNewProductFormMessage("Ok", "success");
            })
            .onError(err => {
                console.log('product new err', err);

                this._adminWidget.setNewProductFormLoadingState(false);
                this._adminWidget.setNewProductFormMessage("Chyba", "error");
            })
            .send(data);

        this._adminWidget.setNewProductFormLoadingState(true);
    }
}



new App().mount(document.getElementById("app"));
