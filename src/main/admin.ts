import {http} from "./prest/http";
import {Signal} from "./prest/signal";
import {Widget, JsonMLs} from "./prest/jsonml";
import {User} from "./prest/interfaces";
import {AdminMenuWidget, ProductsTable, ProductsPurchaseForm} from "./prest/widgets";

export const version: string = "@VERSION@";


window.onerror = function (message, source, lineno, colno, error) {
    http.post("jserr")
        .send({
            source: source,
            message: message,
            lineno: lineno,
            colno: colno,
            error: error,
            error_stack: (<any>error).stack
        });
};


class Admin extends Widget {

    private _menuWidget: AdminMenuWidget;
    private _productsWidget: ProductsTable;
    private _purchaseForm: ProductsPurchaseForm;

    private _user: User;
    readonly sigUser = new Signal<User>();

    constructor() {
        super();
        this._initMenu();
        this._initPurchaseForm();
        this._initProducts();
        this._login();
    }

    render(): JsonMLs {
        return [
            [
                "div.ui.container",
                this._menuWidget
            ],
            [
                "div.ui.container",
                ["div.ui.basic.segment.column",
                    ["h1", "Products"],
                    this._productsWidget
                ]
            ],
            [
                "div.ui.container.four.column.grid",
                ["div.ui.basic.segment",
                    ["h1", "New purchase"],
                    this._purchaseForm
                ]
            ],
            ["div.ui.vertical.segment.footer",
                ["div.ui.container",
                    ["div.ui.segment.basic",
                        "Author: ",
                        ["a", {href: "http://prest-tech.appspot.com/peter-rybar"},
                            "Peter Rybár"
                        ],
                        " – Mail: ",
                        ["a", {href: "mailto:pr.rybar@gmail.com"},
                            "pr.rybar@gmail.com"
                        ]
                    ]
                ]
            ]
        ];
    }

    private _login(): void {
        http.get("/admin/user")
            .onResponse(res => {
                const user = res.getJson().user as User;
                this._user = user;
                this._getProducts();
                this.sigUser.emit(user);
            })
            .onError(err => console.error(err))
            .send();
    }

    private _initMenu(): void {
        this._menuWidget = new AdminMenuWidget();
        this.sigUser.connect(user => this._menuWidget.setUser(user).update());
    }

    private _initPurchaseForm(): void {
        this._purchaseForm = new ProductsPurchaseForm();
    }

    private _initProducts(): void {
        this._productsWidget = new ProductsTable();
    }

    private _getProducts(): void {
        http.get("/products")
            .onResponse(res => {
                this._purchaseForm.setProducts(res.getJson().products).update();
                this._productsWidget.setProducts(res.getJson().products).update();
            })
            .onError(err => console.error(err))
            .send();
    }

}
new Admin().mount(document.getElementById("admin"));