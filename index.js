var http = require('http');
var net = require('net');
var url = require('url');
var util = require('util');
var colors =require('colors');
var async = require('async');
var parser = require('./parser');
var mysql_proxy = require('./mysql_proxy');
//console.log(mysql_proxy);
var load_and_check = function(){mysql_proxy.loadList(
                              function (res) {
                                  console.log(colors.blue('ip in base: '+res.data.length));
                                  var index = 0;
                                  var active_proxy = 0;
                                  async.whilst(
                                    function(){
                                      if (index == res.data.length) console.log('end ip`s'.red);
                                      return index < res.data.length
                                    },
                                    function(callback){
                                      console.log(colors.cyan(index+' > '+res.data[index].ip_address+':'+res.data[index].port));
                                      parser.checkProxy(res.data[index].ip_address,res.data[index].port,{url:'http://ya.ru'},
                                      function(host,port,status,check_result){
                                        if (status) {
                                          mysql_proxy.updateProxy({ip:host,port:port,active:1},function(res){
                                            console.log(colors.yellow('host: '+host+' port: '+port+' status:'+status+' result: '+check_result));
                                            callback(null, active_proxy);
                                            active_proxy++;
                                          })
                                        }
                                        else {
                                          mysql_proxy.updateProxy({ip:host,port:port,active:0},function(res){
                                            console.log(colors.red('host: '+host+' port: '+port+' status :'+status+' result: '+check_result));
                                            callback(null, active_proxy);
                                          })
                                        }
                                        index++;
                                        //if (status) {active_proxy++}
                                      });
                                    },
                                    function(err, results){
                                        console.log(colors.blue('active proxy: '+results))
                                        parse_list();
                                    }
                                  )
                              }
                          )};
var parse_list = function(){parser.parseList(
    function(res){
        console.log('ip count: '+res.length);
        var count = 0;
        var count_inserted =0;
        async.whilst(
            function(){return count < res.length},
            function(callback){
                mysql_proxy.updateList(res[count], function(result){
                    count++;
                    if (result.insertId) count_inserted++;
                    callback(null, count);
                })
            },
            function(err, results){
                console.log(colors.magenta('ip inserted: '+count_inserted));
                load_and_check();
            }
        )
    }
)};

parse_list();


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
