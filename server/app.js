var proxy = require('http-proxy').createProxyServer();
var express = require('express');

express()
    .all('*', function(req, res, next){
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Authorization");
        next();
    })
    .options('*', function(req, res){
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.send(200);
    })
    .all('*', function(req, res){
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        proxy.web(req, res, { target: 'https://www.creditagricolestore.fr' });
    })
    .listen(8080);

express()
    .use('/', express.static(__dirname + '/../www'))
    .listen(8081);