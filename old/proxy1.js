var http = require('http')
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
}).listen(8080)
