import { Widget, JsonMLs } from "../../prest/jsonml";
import { Signal } from "../../prest/signal";
import { User } from "../../interfaces/user.interface";

export class MenuWidget extends Widget {

    private _user: User;

    readonly sigLogin = new Signal<void>();
    readonly sigAdmin = new Signal<any>();

    constructor() {
        super();
    }

    get isUserAdmin(): boolean {
        if (!this._user) {
            return false;
        }

        return this._user.role === "admin";
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
                    ["div.right.menu",
                        this.isUserAdmin ? ["a.ui.item",
                            ["span", "Administration", { click: (e: Event) => this.sigAdmin.emit() }]
                        ] : "",
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