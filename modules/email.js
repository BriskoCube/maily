/**
 * ETML
 * Auteur       : Julien Quartier
 * DATE         : 02.02.2017
 * Description  : Manage email database. Add, remove, delete, etc
 */

var db = require('./db');
var config = require('./config');

var emailRegex = /^[a-z1-9]{1,30}(\.[a-z1-9]{1,30}){0,10}$/;

var domain;

/**
 * Add an email in db
 * @param emailLocal Local part of the email. (Before the @)
 * @param fullName
 * @param statusCallback
 * @returns {{}}
 * @constructor
 */
var Add = function(emailLocal, fullName, password, statusCallback){
    var returnJson = {};

    // Verify email validity
    var emailValidity = emailRegex.test(emailLocal);

    if(emailValidity){

        //Check if email exist
        Exist(emailLocal, function(){

            //Build email address
            var newEmail = `${emailLocal}@${domain}`;

            // Values to insert inside alias table
            var aliasValues = {
                address: newEmail,
                goto: newEmail,
                domain: domain,
                created: MySqlNow(),
                modified: MySqlNow(),
                active: 1
            };

            // Insert the alias
            db.Insert('alias', aliasValues, function(){

                // Values to insert inside mailbox table
                var mailboxValues = {
                    username: newEmail,
                    password: Md5(password) /*'$1$5810ec76$u7K9h9y8R.qvdOXDs.WoQ1'*/,
                    name: fullName,
                    maildir: newEmail+'/',
                    quota: 0,
                    local_part: emailLocal,
                    domain: domain,
                    created: MySqlNow(),
                    modified: MySqlNow(),
                    active: 1
                };

                // Insert the mailbox
                db.Insert('mailbox', mailboxValues, function(){
                    returnJson.status = true;
                    returnJson.message = config.strings.email.add.created;

                    statusCallback(returnJson);
                });

            });

        }, function(){

            returnJson.status = false;
            returnJson.message = config.strings.email.add.alreadyExist;

            statusCallback(returnJson);
        });
    } else {

        returnJson.status = false;
        returnJson.message = config.strings.email.format.error;

        statusCallback(returnJson);
    }

    return returnJson;
}

/**
 * Update email locale
 * @param oldEmailLocal
 * @param newEmailLocal
 * @constructor
 */
var Update = function(oldEmailLocal,newEmailLocal){

}

/**
 * Delete an email
 * @param emailLocal
 * @constructor
 */
var Delete = function(emailLocal, Callback){
    var returnJson = {};

    //Test email format
    var emailValidity = emailRegex.test(emailLocal);

    if(emailValidity) {
        //Build email address
        var emailAddress = `${emailLocal}@${domain}`;

        //Delete the mailbox from db
        db.Delete(`DELETE FROM mailbox WHERE username = '${emailAddress}';`, function (result) {
            if (result.affectedRows > 0) {

                //Delete aliases and relative aliases
                db.Delete(`DELETE FROM alias WHERE address = '${emailAddress}' OR goto = '${emailAddress}';`, function (resultAlias) {
                    if (resultAlias.affectedRows > 0) {
                        returnJson.status = true;
                        returnJson.message = config.strings.email.delete.ok;
                    } else {
                        returnJson.status = true;
                        returnJson.message = config.strings.email.delete.error;
                    }

                    Callback(returnJson);
                });
            } else {
                returnJson.status = true;
                returnJson.message = config.strings.email.delete.error;

                Callback(returnJson);
            }
        });
    } else {
        returnJson.status = true;
        returnJson.message = config.strings.email.format.error;

        Callback(returnJson);
    }

}

/**
 * An email exist or not ?
 * @param emailLocal
 * @param NotExistCallback
 * @param ExistCallback
 * @constructor
 */
var Exist = function(emailLocal, NotExistCallback, ExistCallback){

    db.Select(`SELECT * FROM alias WHERE address = '${emailLocal}@${domain}'`, function(result){
        if(result.length == 0){
            NotExistCallback();
        }else{
            ExistCallback();
        }

    })
}

/**
 * Set the curent domain
 * @param newDomain
 * @constructor
 */
var SetDomain = function(newDomain){
    domain = newDomain;
}

/**
 * Liste les email
 * @param Callback
 * @constructor
 */
var List = function(Callback){
    db.Select(`SELECT * FROM mailbox WHERE domain = '${domain}'`, function(result){

        Callback({
            status: true,
            data: result
        });
    });
}

/**
 * Return Current date time for mysql
 * @returns {string}
 * @constructor
 */
var MySqlNow = function(){
    return (new Date()).toISOString().substring(0, 19).replace('T', ' ');
}

var Md5 = function(password){
    var crypto = require('crypto');
    var md5 = crypto.createHash('md5').update(password).digest("hex");

    return md5;
}

// Makes variables public
exports.Add = Add;
exports.Update = Update;
exports.Delete = Delete;
exports.Exist = Exist;
exports.List = List;
exports.SetDomain = SetDomain;
