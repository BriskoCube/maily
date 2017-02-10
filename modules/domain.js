/**
 * Created by quartierju on 02.02.2017.
 */
var db = require('./db');

/**
 * Return all domain avalible for the mail server
 * @param Callback
 * @constructor
 */
var List = function(Callback){
    db.Select(`SELECT * FROM domain WHERE domain <> 'ALL'`, function(result){
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
var Exist = function(domain, NotExistCallback, ExistCallback){
    db.Select(`SELECT * FROM domain WHERE domain = '${domain}'`, function(result){
        if(result.length == 0){
            NotExistCallback();
        }else{
            ExistCallback();
        }
    });
}

// Makes variables public
exports.Exist = Exist;
exports.List = List;
