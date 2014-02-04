var proxy = require('http-proxy').createProxyServer();
var express = require('express');

var PROXY_SERVER_PORT = 8080;
var STATIC_SERVER_PORT = 8081;

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
    .listen(PROXY_SERVER_PORT);

console.log('Proxy server running on port ' + PROXY_SERVER_PORT);

express()
    .use('/', express.static(__dirname + '/../www'))
    .listen(8081);

console.log('Static server running on port ' + STATIC_SERVER_PORT);