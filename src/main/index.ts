import { HttpRequest } from "./prest/http";

new HttpRequest()
    .get("products")
    .onResponse(res => {
        console.log(res.getJson());
    })
    .onError(err => {
        console.error(err);
    })
    .send();
