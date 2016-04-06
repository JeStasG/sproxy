var httpProxy = require('http-proxy');
 
var server = httpProxy.createServer(function (req, res, proxy) {
  var buffer = httpProxy.buffer(req);
 
  proxy.proxyRequest(req, res, {
    host: '127.0.0.1',
    port: 9000,
    buffer: buffer
  });
  /*proxy.on('end', function () {
    console.log("The request was proxied.");
  });*/
});
 
/*server.proxy.on('end', function () {
  console.log("The request was proxied.");
});*/
//console.log(server);
 
server.listen(8000);