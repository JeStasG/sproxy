var http = require('http');
var net = require('net');
var url = require('url');
var util = require('util');
var colors =require('colors');
var async = require('async');
var parser = require('./parser');
var mysql_proxy = require('./mysql_proxy');
//console.log(mysql_proxy);
mysql_proxy.loadList(
    function (res) {
        console.log('ip in base: '+res.data.length);
    }
);
parser.parseList(
    function(res){
        console.log('ip count: '+res.length);
        var count = 0;
        async.whilst(
            function(){return count < res.length},
            function(callback){
                mysql_proxy.updateList(res[count], function(result){
                    count++;
                    callback(null, count);
                })
            },
            function(err, results){
                //console.log(results);
            }
        )
    }
);



    /*var secc = 1000;
    function sec() {
        util.puts('Секунда'.blue+' '+secc);
        if (secc > 600) secc = secc-70;
    }
    setInterval(sec, secc);
    function min() {
        util.puts('Аще секунда'.green+' '+secc);
        //console.log(secc);
    }
    setInterval(min,1543);
    function smin() {
        util.puts('B ваще секунда'.yellow+' '+secc);
        secc = secc+100;
    }
    setInterval(smin,1777);*/

var server = http.createServer(function(request, response) {
    console.log(request.url);
    var ph = url.parse(request.url);
    var options = {
        port: ph.port,
        hostname: ph.hostname,
        method: request.method,
        path: ph.path,
        headers: request.headers
    };
    //util.puts('http server '.blue + 'started '.green.bold + 'on port '.blue + '9006 '.yellow);
    //console.log(JSON.stringify(options));
}).listen(8080);
