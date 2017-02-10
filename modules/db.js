/**
 * ETML
 * Auteur       : Julien Quartier
 * DATE         : 02.02.2017
 * Description  : Databse helper. Basic db functions
 */

var mysql       = require('mysql');
var config      = require('./config');
var connection  = null;
var selectRegex = /^(SELECT){1}.+(FROM){1}.+/;

/**
 * Connect to mysql
 * @constructor
 */
var Connect = function() {

    connection = mysql.createConnection(
        config.mysql
    );

    connection.connect();
};

/**
 * Select from database
 * @param query The select request in String
 * @param Callback Called once request finished.
 * @constructor
 */
var Select = function(query, Callback) {
    //Verifie la structure du select
    if(selectRegex.test(query)){
        connection.query(query, function (err, rows, fields) {
            if (!err) {
                Callback(rows);
            }
            else {
                Callback(false);
            }
        });
    }
};

/**
 * Insert int database.
 * @param table The table name
 * @param values Values formatted as an json object
 * @param Callback Called once values inserted
 * @constructor
 */
var Insert = function(table, values, Callback) {
    connection.query('INSERT INTO '+table+' SET ?', values, function(err, result) {
        // Neat!
        Callback();
    });
};

/**
 * Delete from database.
 * @param query The delete request in String
 * @param Callback Called once delete is finished.
 * @constructor
 */
var Delete = function(query, Callback){
    connection.query(query, function(err, result) {
        Callback(result);
    });
}

// Makes variables public
exports.Connect = Connect;
exports.Select = Select;
exports.Insert = Insert;
exports.Delete = Delete;