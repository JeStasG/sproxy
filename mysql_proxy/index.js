var mysql = require('mysql');
var config = require('config');
var async = require('async');
var mysql_config = config.get('mysql');
var connection = mysql.createConnection(mysql_config);
connection.connect();
connection.on('error', function(err){
    console.log(err);
});
var exp = {
    loadList : function (res) {
                    async.series ({
                        /*connect : function (callback) {
                            connection.connect(function (err) {
                                console.log('connect');
                                callback(null, err)
                            });
                        },*/
                        data : function (callback) {
                            connection.query('SELECT * FROM proxy_list', function(err, rows, fields) {
                                if (err) throw err;
                                callback(null,rows);
                            })
                        }/*,
                        disconnect : function (callback) {
                            connection.end(function(err){
                                console.log('connect end');
                                callback(null, err)
                            })
                        }*/
                    },
                    function (err, results) {
                        res(results);
                    });
                },
    updateList : function (ipObj, res) {
        async.series({
            /*connect : function(callback){
                connection.connect(function (err) {
                    console.log('connect');
                     callback(null, err)
                });
            },*/
            fix : function(callback){
                connection.query('SELECT COUNT(*) AS count FROM proxy_list WHERE ip_address=? AND port=?', [ipObj.ip, ipObj.port], 
                    function(err, rows, fields){
                        console.log(err);
                        if (err) throw err;
                        callback(null, rows[0].count);
                        //console.log(rows[0].count);
                    }                 
                )
            }/*,
            disconnect : function(callback){
                connection.destroy(function(err){
                    console.log('connect end');
                    callback(null, err);
                })
            }*/
        },function (err, results){
                console.log(results);
                if (results.fix == 0){
                    connection.query('INSERT INTO proxy_list (ip_address, port) VALUES (?,?)', [ipObj.ip, ipObj.port],
                            function(err, result){
                                console.log(err);
                                //console.log(res.insertId);
                                //callback(res.insertId, err)
                                //res
                                connection.end();
                            })
                        }
                        else {
                            callback(null, err);
                        }
                res(results);
            })
    }
}
module.exports = exp;


/*if (rows[0].count == 0) {
                            connection.query('INSERT INTO proxy_list (ip_address, port) VALUES (?,?)', [ipObj.ip, ipObj.port],
                            function(err, res){
                                console.log(err);
                                //console.log(res.insertId);
                                callback(res.insertId, err)
                                connection.end();
                            })
                        }
                        else {
                            callback(null, err);
                        }*/