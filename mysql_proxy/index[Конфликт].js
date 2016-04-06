var mysql = require('mysql');
var config = require('config');
var async = require('async');
var mysql_config = config.get('mysql');
//console.log(mysql_config);
var connection = mysql.createConnection(mysql_config);
var exp = {
    loadList : function (res) {
                    async.series ({
                        connect : function (callback) {
                            connection.connect(function (err) {
                                console.log(err);
                                callback(null, err)
                            });
                        },
                        data : function (callback) {
                            connection.query('SELECT * FROM proxy_list', function(err, rows, fields) {
                                //console.log(err);
                            if (err) throw err;
                                callback(null,rows);
                            })
                        },
                        disconnect : function (callback) {
                            connection.end(function(err){
                                callback(null, err)
                            })
                        }
                    },
                    function (err, results) {
                        res(results);
                    });
                },
    updateList : function () {
        
    }
}
module.exports = exp;
