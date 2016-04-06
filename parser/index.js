var toEnc = 'utf-8';
var charset = require('charset');
var async = require('async');
var phantom = require("phantom-jquery");

var arr = [];
var ip_regex = /(\d+)\.(\d+)\.(\d+)\.(\d+)(?:\.(\d+))?(?::(\d+))?/;

var parse_ip_address = function(ip_string){

    // Use Regex to get the parts of the ip address
    var ip_parts = ip_regex.exec(ip_string);
    //console.log(ip_parts);
    // Set ip address if the regex executed successfully
    if( ip_parts && ip_parts.length > 6 ){
        // Set up address object to elements in the list
        var ip_address = {
            'A':     ip_parts[1],
            'B':     ip_parts[2],
            'C':     ip_parts[3],
            'D':     ip_parts[4],
            'E':     ip_parts[5],
            'port':  ip_parts[6]
        }
        // Would rather not fiddle with 'undefined' value
        if( typeof ip_parts[5] != 'undefined') {
            ip_address[5] = null;
        }
    }

    // Return object
    return ip_parts;
};

var parseSite = function(url, numPage, callback){
    var arr = {};
    numPage++;
    phantom.open(url+numPage, function(err, $, page, ph){
            $(".proxy").each(function(currentLink, index, next){
                currentLink.text(function(text){
                    var tmp = parse_ip_address(text);
                    if (tmp){ 
                        arr[index] = {ip:tmp[1]+'.'+tmp[2]+'.'+tmp[3]+'.'+tmp[4], port:tmp[6]};
                    }
                    next();
                })
            },function(){
                ph.exit()
                callback(null, {[numPage]: arr});
            });
        });
}
var exp ={
    parseList: function(res){
        async.times(1, 
            function (n, next){
                parseSite('http://proxy-list.org/russian/search.php?search=transparent&country=any&type=transparent&port=any&ssl=any&p=', n, function(err, page){
                    next(err, page);
                })
            },
            function(err, results){
                var arr = [];
                results.forEach(function(item, i, resarr){
                    for (key in item){
                        for (subkey in item[key]){
                            arr.push(item[key][subkey]);
                        }
                    }
                })                
                /*var i = 1;
                async.each(arr, 
                    function(val, callback){
                        console.log(i+' : '+JSON.stringify(val));
                        i++;
                        callback();            
                    }, function(err){
                    console.log('end');
                })*/
                res(arr);
            }
        )
    }
}

module.exports = exp;




/*var proxy = {
    proxyList : {}, 
    loadUrl : function(url, res){
        async.series({
            load: function(callback){
                request({
                    url : url,
                    encoding:null
                },
                function(err,res){
                    callback(null,res);
                })
            }
        },
        function(err,results){
            res('',results.load);
            //console.log(results.load);
        })
    },
    pager : function(url, maxPage){
        var proxyList = {};
        for (i=1;i <= maxPage;i++){
            this.loadUrl(url+i, function(url, res){
                proxy.parseHtml(res.headers, res.body)
            })
        }
    },
    parseHtml : function (headers, html) {
        enc = charset(headers, html);
        html = Iconv(enc,toEnc).convert(html);
        $ = cheerio.load(html);
        var prox = [];
        data = $('.table.container>div.row.tr.hover').children('.col-md-2.td')
        $('.table.container>div.row.tr.hover').each(function(i, elem){
            prox.push({
                ip : $(elem).children('.td').eq(0).text(),
                port : $(elem).children('.td').eq(5).text()
            })
        });
        //console.log(prox);       
        return prox;
    }
} 
module.exports = proxy;*/
//proxy.pager('http://www.freeproxy-list.ru/proxy-list/',5);

/*page.injectJs('//ajax.googleapis.com/ajax/libs/jquery/1.12.2/jquery.min.js')
                .then(function (params) {
                    console.log(params);
                })*/