var assert = require('assert')
var gateway = 'proxy://login:passwd@10.20.30.40:3128/' // Прокси для редиректа
if(process.env.gateway) gateway = process.env.gateway
var http = require('http')
var net = require('net')
var url = require('url')
var server = http.createServer(function(request, response) {
    console.log(request.url)
    var ph = url.parse(request.url)
    var gw = url.parse(gateway)
    var options = {
        port: parseInt(gw.port),
        hostname: gw.hostname,
        method: request.method,
        path: request.url,
        headers: request.headers || {}
    }
    if(gw.auth)
        options.headers['Proxy-Authorization'] = 'Basic ' + new Buffer(gw.auth).toString('base64')
    // console.log(options)
    var gatewayRequest = http.request(options)
    gatewayRequest.on('error', function(err) { console.log('[error] ' + err) ; response.end() })
    gatewayRequest.on('response', function(gatewayResponse) {
        if(gatewayResponse.statusCode === 407) {
            console.log('[error] AUTH REQUIRED')
            process.exit()
        }
        gatewayResponse.on('data', function(chunk) {
            response.write(chunk, 'binary')
        })
        gatewayResponse.on('end', function() { response.end() })
        response.writeHead(gatewayResponse.statusCode, gatewayResponse.headers)
    })
    request.on('data', function(chunk) {
        gatewayRequest.write(chunk, 'binary')
    })
    request.on('end', function() { gatewayRequest.end() })
    gatewayRequest.end()
}).on('connect', function(request, socketRequest, head) {
    console.log(request.url)
    var ph = url.parse('http://' + request.url)
    var gw = url.parse(gateway)
    var options = {
        port: gw.port,
        hostname: gw.hostname,
        method: 'CONNECT',
        path: ph.hostname + ':' + (ph.port || 80),
        headers: request.headers || {}
    }
    if(gw.auth)
        options.headers['Proxy-Authorization'] = 'Basic ' + new Buffer(gw.auth).toString('base64')
    // console.log(options)
    var gatewayRequest = http.request(options)
    gatewayRequest.on('error', function(err) { console.log('[error] ' + err) ; process.exit() })
    gatewayRequest.on('connect', function(res, socket, head) {
        assert.equal(res.statusCode, 200)
        assert.equal(head.length, 0)
        socketRequest.write("HTTP/" + request.httpVersion + " 200 Connection established\r\n\r\n")
        // Туннелирование к хосту
        socket.on('data', function(chunk) { socketRequest.write(chunk, 'binary') })
        socket.on('end', function() { socketRequest.end() })
        socket.on('error', function() {
            // Сказать клиенту, что произошла ошибка
            socketRequest.write("HTTP/" + request.httpVersion + " 500 Connection error\r\n\r\n")
            socketRequest.end()
        })
        // Туннелирование к клиенту
        socketRequest.on('data', function(chunk) { socket.write(chunk, 'binary') })
        socketRequest.on('end', function() { socket.end() })
        socketRequest.on('error', function() { socket.end() })
    }).end()
}).listen(8080, '127.0.0.1')
