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
                        data : function (callback) {
                            connection.query('SELECT * FROM proxy_list', function(err, rows, fields) {
                                if (err) throw err;
                                callback(null,rows);
                            })
                        }
                    },
                    function (err, results) {
                        res(results);
                    });
                },
    updateList : function (ipObj, res) {
        async.series({
            fix : function(callback){
                connection.query('SELECT COUNT(*) AS count FROM proxy_list WHERE ip_address=? AND port=?', [ipObj.ip, ipObj.port],
                    function(err, rows, fields){
                        if (err) throw err;
                        callback(null, rows[0].count);
                    }
                )
            }
        },function (err, results){
                if (results.fix == 0){
                    connection.query('INSERT INTO proxy_list (ip_address, port) VALUES (?,?)', [ipObj.ip, ipObj.port],
                            function(err, result){
                                console.log('inserted: '+result.insertId);
                                res(result);
                            })
                        }
                        else {
                            res(results);
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
