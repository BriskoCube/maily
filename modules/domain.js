/**
 * ETML
 * Auteur       : Julien Quartier
 * DATE         : 02.02.2017
 * Description  : Databse helper. Basic db functions
 */

var db = require('./db');

/**
 * Return all domain avalible for the mail server
 * @param Callback
 * @constructor
 */
var list = function(Callback){
    db.select(`SELECT * FROM domain WHERE domain <> 'ALL'`, function(result){
        Callback({
            status: true,
            data: result
        });
    });
}

/**
 * Allow to know if a domain exist
 * @param domain Domain to check. (example.com)
 * @param NotExistCallback Callback if the domain doesn't exist
 * @param ExistCallback Callback if the domain exist
 * @constructor
 */
var exist = function(domain, NotExistCallback, ExistCallback){
    db.select(`SELECT * FROM domain WHERE domain = '${domain}'`, function(result){
        if(result.length == 0){
            NotExistCallback();
        }else{
            ExistCallback();
        }
    });
}

// Makes variables public
exports.exist = exist;
exports.list = list;
