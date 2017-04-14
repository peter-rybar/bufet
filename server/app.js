var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var basicAuth = require('express-basic-auth');
var db = require('diskdb');

var dbdir = __dirname + '/../db';
db = db.connect(dbdir, ['users', 'products', 'orders']);
if (!db.users.count()) {
    db.users.save([
        {
            login: 'peter',
            password: 'rybar',
            name: 'Peter Rybar'
        },
        {
            login: 'palo',
            password: 'sovis',
            name: 'Pavol Sovis'
        }
    ]);
}
if (!db.products.count()) {
    db.products.save([
        {
            id: 'keksik',
            title: 'Keksik',
            price: 7.3,
            count: 7
            },
        {
            id: 'kolacik',
            title: 'Kolacik',
            price: 2.3,
            count: 3
        }
    ]);
}
// var u = db.users.findOne({login: 'peter'});
// console.log(u);


var app = express();

// parse application/json
var jsonParser = bodyParser.json();
// app.use(jsonParser);

// parse application/x-www-form-urlencoded
// var urlencodedParser = bodyParser.urlencoded({ extended: false });
// app.use(urlencodedParser);

app.use(basicAuth({
    // users: {
    //     'admin': 'rybar'
    // },
    authorizer: function (username, password) {
        var user = db.users.findOne({login: username});
        var auth = user && user.password === password;
        console.log("auth: ", username, password, user);
        return auth;
    },
    challenge: true,
    realm: 'Imb4T3st4pp'
    // unauthorizedResponse: function (req) {
    //     return req.auth ?
    //         ('Credentials ' + req.auth.user + ':' + req.auth.password + ' rejected') :
    //         'No credentials provided'
    // }
}));


app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/../static/index.html'));
});

// app.get('/', function (req, res) {
//     console.log('req', req.params, req.query);
//     res.send('Hello World!')
// });

app.get('/products', function (req, res) {
    res.json({products: db.products.find()});
});

app.get('/user', function (req, res) {
    if (req.auth) {
        var user = db.users.findOne({login: req.auth.user})
        res.json({user: {login: user.login, name: user.name}});
    } else {
        res.sendStatus(404); // Not Found
    }
});

app.get('/product/:id', function (req, res) {
    console.log('product get', req.params, req.query);
    var product = db.products.findOne({id: req.params.id});
    if (product) {
        res.json({product: product});
    } else {
        res.sendStatus(404); // Not Found
    }
});

app.get('/order/:id', function (req, res) {
    console.log('order get', req.params, req.query);
    var order = db.products.findOne({id: req.params.id});
    if (order) {
        res.json({order: order});
    } else {
        res.sendStatus(404); // Not Found
    }
});

app.post('/order', jsonParser, function (req, res) {
    console.log('order post', req.params, req.query, req.body);
    var order = JSON.stringify(req.body);
    order = db.orders.save(order);
    if (order) {
        res.json({order: order});
    } else {
        res.sendStatus(404); // Not Found
    }
});


app.use(express.static(path.join(__dirname, '../static')));
app.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));

// console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
if (process.env.NODE_ENV == 'production') {
    console.log('env: production');
    app.use(express.static(path.join(__dirname, '../dist')));
} else {
    console.log('env: development');
    app.use(express.static(path.join(__dirname, '../build/main')));
    app.use('/src', express.static(path.join(__dirname, '../src')));
}


var port = 3000;
var host = 'localhost';
if (process.env.NODE_ENV == 'production') {
    port = 3000;
    host = '0.0.0.0';
}

var server = app.listen(port, host, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('listening at http://%s:%s', host, port)
});
