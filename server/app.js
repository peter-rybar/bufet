var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

var app = express();

// parse application/json
var jsonParser = bodyParser.json();
// app.use(jsonParser);

// parse application/x-www-form-urlencoded
// var urlencodedParser = bodyParser.urlencoded({ extended: false });
// app.use(urlencodedParser);

var products = [
    {
        id: 'keksik',
        title: 'Keksik',
        price: 7.3,
        count: 7
    },
    {
        id: 'keksik-1',
        title: 'Keksik 1',
        price: 2.3,
        count: 3
    }
];

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/../static/index.html'));
});

// app.get('/', function (req, res) {
//     console.log('req', req.params, req.query);
//     res.send('Hello World!')
// });

app.get('/products', function (req, res) {
    res.json({products: products});
});

app.get('/product/:id', function (req, res) {
    console.log('product get', req.params, req.query);
    p = products.filter(function (p) {
        return p.id === req.params.id;
    });
    if (p.length === 1) {
        res.json({product: p[0]});
    } else {
        res.sendStatus(404); // Not Found
    }
});

app.get('/order/:id', function (req, res) {
    console.log('order get', req.params, req.query);
    res.json({
        order: products
    });
});

var orderId = 0;
app.post('/order', jsonParser, function (req, res) {
    console.log('order post', req.params, req.query, req.body);
    const order = req.body;
    order.id = orderId++;
    res.json({
        order: order
    });
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

var server = app.listen(port, host, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('listening at http://%s:%s', host, port)
});
