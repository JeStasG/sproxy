var http = require('http')
var net = require('net')
var url = require('url')
var server = http.createServer(function(request, response) {
    console.log(request.url)
    var ph = url.parse(request.url)
    var options = {
        port: ph.port,
        hostname: ph.hostname,
        method: request.method,
        path: ph.path,
        headers: request.headers
    }
    var proxyRequest = http.request(options)
    proxyRequest.on('response', function(proxyResponse) {
        proxyResponse.on('data', function(chunk) {
            response.write(chunk, 'binary')
        })
        proxyResponse.on('end', function() { response.end() })
        response.writeHead(proxyResponse.statusCode, proxyResponse.headers)
    })
    request.on('data', function(chunk) {
        proxyRequest.write(chunk, 'binary')
    })
    request.on('end', function() { proxyRequest.end() })
}).on('connect', function(request, socketRequest, head) {
    console.log(request.url)
    var ph = url.parse('http://' + request.url)
    var socket = net.connect(ph.port, ph.hostname, function() {
        socket.write(head)
        // Сказать клиенту, что соединение установлено
        socketRequest.write("HTTP/" + request.httpVersion + " 200 Connection established\r\n\r\n")
    })
    // Туннелирование к хосту
    socket.on('data', function(chunk) { socketRequest.write(chunk) })
    socket.on('end', function() { socketRequest.end() })
    socket.on('error', function() {
        // Сказать клиенту, что произошла ошибка
        socketRequest.write("HTTP/" + request.httpVersion + " 500 Connection error\r\n\r\n")
        socketRequest.end()
    })
    // Туннелирование к клиенту
    socketRequest.on('data', function(chunk) { socket.write(chunk) })
    socketRequest.on('end', function() { socket.end() })
    socketRequest.on('error', function() { socket.end() })
}).listen(8080)
