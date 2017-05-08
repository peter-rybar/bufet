
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var basicAuth = require('express-basic-auth');


var tingodb = require('tingodb')();
var dbdir = __dirname + '/../db';
var db = new tingodb.Db(dbdir, {});

var usersCollection = db.collection("users");
usersCollection.remove({},
    function(err, res) {
        if (err) throw err;
        console.log("users remove", res);
    });
usersCollection.insert(require('./data/users'),
    function (err, res) {
        if (err) throw err;
        console.log("users insert", res);
    });

var productsCollection = db.collection("products");
productsCollection.remove({},
    function(err, res) {
        if (err) throw err;
        console.log("products remove", res);
    });
productsCollection.insert(require('./data/products'),
    function (err, res) {
        if (err) throw err;
        console.log("products insert", res);
    });


var app = express();

// parse application/json
var jsonParser = bodyParser.json();
// app.use(jsonParser);

// parse application/x-www-form-urlencoded
// var urlencodedParser = bodyParser.urlencoded({ extended: false });
// app.use(urlencodedParser);

// var textParser = bodyParser.text();
// app.use(textParser);

var authBasic = basicAuth({
    authorizeAsync: true,
    authorizer: function (username, password, cb) {
        db.collection("users").findOne({login: username},
            function (err, user) {
                if (err) {
                    console.error(err);
                    cb(null, false);
                } else {
                    var auth = user && user.password === password;
                    console.log("auth: ", username, password, user);
                    cb(null, auth);
                }
            });
    },
    challenge: true,
    realm: 'Imb4T3st4pp'
});
// app.use(authBasic);


app.get('/', function (req, res) {
    console.log('get', req.params, req.query);
    res.sendFile(path.join(__dirname + '/../static/index.html'));
});

// app.get('/', function (req, res) {
//     console.log('req', req.params, req.query);
//     res.send('Hello World!')
// });

app.get('/products', function (req, res, next) {
    console.log('products get', req.params, req.query);
    db.collection("products").find()/*.sort({price: 1})*/.toArray(
        function (err, products) {
            if (err) return next(err);
            res.json({products: products});
        });
});

app.get('/product/:code', function (req, res, next) {
    console.log('product get', req.params, req.query);
    db.collection("products").findOne({code: req.params.code},
        function (err, product) {
            if (err) return next(err);
            if (product) {
                res.json({product: product});
            } else {
                res.sendStatus(404); // Not Found
            }
        });
});

app.get('/user', authBasic, function (req, res, next) {
    console.log('user get', req.params, req.query);
    if (req.auth) {
        db.collection("users").findOne({login: req.auth.user},
            function (err, user) {
                if (err) return next(err);
                if (user) {
                    res.json({
                        user: {
                            login: user.login,
                            name: user.name,
                            role: user.role
                        }
                    });
                } else {
                    res.sendStatus(404); // Not Found
                }
            });
    } else {
        res.sendStatus(404); // Not Found
    }
});

app.get('/orders', authBasic, function (req, res, next) {
    console.log('orders get', req.params, req.query, req.body);
    var userOrdersCollection = 'orders_' + req.auth.user;
    db.collection(userOrdersCollection).find().toArray(
        function (err, orders) {
            if (err) return next(err);
            res.json({orders: orders});
        });
});

app.get('/orders/:login', authBasic, function (req, res, next) {
    console.log('orders get', req.params, req.query, req.body);
    db.collection("users").findOne({login: req.auth.user},
        function (err, user) {
            if (err) return next(err);
            if (req.params.login && user.role === "admin") {
                var userOrdersCollection = 'orders_' + req.params.login;
                db.collection(userOrdersCollection).find().toArray(
                    function (err, orders) {
                        if (err) return next(err);
                        console.log(userOrdersCollection, orders);
                        const sum = orders
                            .map(function (o) {
                                return o.price;
                            })
                            .reduce(function (sum, price) {
                                return sum + price;
                            }, 0);
                        const count = orders
                            .map(function (o) {
                                return o.count;
                            })
                            .reduce(function (sum, count) {
                                return sum + count;
                            }, 0);
                        var sumar = sum.toFixed(2) + ' € ' + count + '\n\n';
                        sumar += orders
                            .map(function (o) {
                                return '\n' + o.price.toFixed(2) + ' €\t' +
                                    o.count + '\t' +
                                    o.timestamp + '\n' +
                                    o.items
                                        .map(function (i) {
                                            return i.product.price.toFixed(2) + ' €\t' +
                                                i.count + '\t' + i.product.code;
                                        })
                                        .join('\n');
                            })
                            .join('\n');
                        res.contentType("text/plain");
                        res.send(sumar);
                        // res.send(JSON.stringify({
                        //     sum: sum,
                        //     count: count,
                        //     orders: orders}, null, 4));
                    });
            } else {
                res.sendStatus(404); // Not Found
            }
        });
});

app.post('/order', authBasic, jsonParser, function (req, res, next) {
    console.log('order post', req.params, req.query, req.body);
    var order = req.body;
    order.timestamp = new Date().toISOString();
    var userOrdersCollection = 'orders_' + req.auth.user;
    var collection = db.collection(userOrdersCollection);
    collection.insert([order],
        function (err, orders) {
            if (err) return next(err);
            console.log(userOrdersCollection, orders);
            collection.find().toArray(
                function (err, orders) {
                    if (err) {
                        console.log(err);
                        res.sendStatus(404); // Not Found
                    } else {
                        console.log(userOrdersCollection, orders);
                        res.json({orders: orders});
                    }
                });
        });
});

app.get('/order/:id', authBasic, function (req, res, next) {
    console.log('order get', req.params, req.query);
    var userOrdersCollection = 'orders_' + req.auth.user;
    db.collection(userOrdersCollection).findOne({_id: req.params.id},
        function (err, order) {
            if (err) return next(err);
            res.json({order: order});
        });
});

app.post('/jserr', jsonParser, function (req, res) {
    console.log('jserr post', req.params, req.query);
    for (var k in req.body) {
        if (req.body.hasOwnProperty(k)) {
            console.log("\t", k, req.body[k]);
        }
    }
    res.send("");
});


app.use(express.static(path.join(__dirname, '../static')));
app.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));

// console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
if (process.env.NODE_ENV === 'production') {
    console.log('env: production');
    app.use(express.static(path.join(__dirname, '../dist')));
} else {
    console.log('env: development');
    app.use(express.static(path.join(__dirname, '../build/main')));
    app.use('/src', express.static(path.join(__dirname, '../src')));
}


var port = 3000;
var host = 'localhost';
if (process.env.NODE_ENV === 'production') {
    port = 3000;
    host = '0.0.0.0';
}

var server = app.listen(port, host, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('process %s listening at http://%s:%s', process.pid, host, port);
});
