import { Widget, JsonMLs } from "../../prest/jsonml";
import { Signal } from "../../prest/signal";
import { User } from "../../interfaces/user.interface";

export class MenuWidget extends Widget {

    private _user: User;

    readonly sigLogin = new Signal<void>();

    constructor() {
        super();
    }

    private get isUserAdmin(): boolean {
        return this._user && this._user.role === "admin";
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
                    ["a.item", { href: "#order" }, "Nákupný Košík"],
                    ["a.item", { href: "#orders" }, "Objednávky"],
                    this.isUserAdmin ? ["a.item", { href: "#admin" }, "Administrácia"] : "",
                    ["div.right.menu",
                        ["a.ui.item",
                            ["span", { click: (e: Event) => this.sigLogin.emit() },
                                this._user ?
                                    ["span", { title: `login: ${this._user.login}` },
                                        this._user.name + (this.isUserAdmin ? " (admin)" : "")
                                    ] :
                                    ["span", { id: "login" }, "Login"]
                            ]
                        ]
                    ]
                ]
            ]
        ];
    }

}