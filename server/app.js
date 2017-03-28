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


app.get('/', function (req, res) {
    console.log("req", req.params, req.query);
    res.send('Hello World!')
});

app.get('/products', function (req, res) {
    res.json({
        products: [
            {
                id: "keksik",
                title: "Keksik",
                price: 7.3,
                count: 7
            },
            {
                id: "keksik-1",
                title: "Keksik 1",
                price: 2.3,
                count: 3
            }
        ]
    });
});

app.get('/order/:id', function (req, res) {
    console.log("order get", req.params, req.query);
    res.json({
        order: [
            {
                id: "keksik",
                title: "Keksik",
                price: 7.3,
                count: 7
            },
            {
                id: "keksik-1",
                title: "Keksik 1",
                price: 2.3,
                count: 3
            }
        ]
    });
});
app.post('/order/:id', jsonParser, function (req, res) {
    console.log("order post", req.params, req.query, req.body);
    res.json({
        order: [
            {
                id: "keksik",
                title: "Keksik",
                price: 7.3,
                count: 7
            },
            {
                id: "keksik-1",
                title: "Keksik 1",
                price: 2.3,
                count: 3
            }
        ]
    });
});


app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../build/main')));
app.use(express.static(path.join(__dirname, '../dist')));
app.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));


var port = 3000;
var host = 'localhost';

var server = app.listen(port, host, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("listening at http://%s:%s", host, port)
});
