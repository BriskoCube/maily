/**
 * ETML
 * Auteur       : quartierju
 * DATE         : 03.02.2017
 * Description  : Interface between node and dovecot
 */

var fs = require('fs');
var config = require('./config');
var mimelib     = require("mimelib");



var formatterFindKeyRegex = /#{([a-z]{1,20})}/g;

/**
 * Return email form a specific user. Formatted in json
 * @param mailLocal Local part of the email. (Before the @)
 * @param domain The email's domain
 * @param Callback Call when finished
 * @constructor
 */
var GetEmails = function(mailLocal, domain, Callback){

    var returnJson = {};

    // Create email path string
    var emailsFolder = Formatter(config.dovetail.newMailPath, {
        domain: domain,
        user: mailLocal
    });

    // Make absolute path
    var emailFolder = config.dovetail.path + emailsFolder;

    // Lis les fichiers du dossier
    fs.readdir(emailFolder, (err, files) => {

        if(!!files && files.length > 0){

            var count = 0;
            var mails = [];

            // Loop through folder files
            files.forEach(file => {

                // Read file content
                fs.readFile(emailFolder + file, 'utf8', function (err,data) {

                    // Avoid hidden files
                    if(file.charAt(0) != '.')
                        mails.push(MailParser(data, file));

                    count ++;

                    // Once all mails have been processed
                    if(count == files.length)
                        Callback({
                            status: true,
                            data: mails
                        });

                });
            });
        } else {
            returnJson.status = false;
            returnJson.message = config.strings.dovetail.file.no;

            Callback(returnJson);
        }
    });
}

/**
 * Parse text email to json
 * @param mail The email's text
 */
var MailParser = function(mail, file){

    // Regex used to split header key and value
    var headerRegex = /(([a-zA-Z-]+): (.+)((\n\t(.+))*))/g;

    var timeStampRegex = /^[0-9]+/;

    // Split header and message
    var header = mail.substr(0,mail.indexOf("\n\n"));
    var temporyMessage = mail.substr(mail.indexOf("\n\n")+2); //may content mime informations


    var timeStamp = file.match(timeStampRegex);

    // Output json skeleton
    var matches, output = {
        id: parseInt(timeStamp[0]),
        headers:{},
        message: temporyMessage
    };

    // Browse through header regex matches
    while (matches = headerRegex.exec(header)) {

        mimeCleaner(matches[3]);

        output.headers[(matches[2]).replace(/[-]{1}/g, '_')] = mimeCleaner(matches[3]);//matches[3] /*mimelib.decodeMimeWord(matches[3])*/;
    }



    var message = Multipart(output.headers, temporyMessage);

    output.message = message;

    return output;

}

var Boundaries = function(headers){

    var boundary = false;

    if(headers.hasOwnProperty('Content_Type')){
        var regexResult = headers.Content_Type.match(/"(.+)"/)
        if(regexResult != null && regexResult.length > 1){
            boundary = regexResult[1];
        }
    }

    return boundary;
}

var Multipart = function(headers, message){
    var boundary = Boundaries(headers);



    if(boundary != false){
        return message.split(boundary)[2];
    }
}

/**
 * Format string by replacing #{<key>} vith values form associative array
 * @param string String to work with

 * @constructor
 * @param values New values
 * @constructor
 */
var Formatter = function(string, values){

    var matches, output = [];

    while (matches = formatterFindKeyRegex.exec(string)) {
        output.push(matches);
    }

    // Browse through regex matches
    for(var i = 0, len = output.length; i < len; i++){
        var toReplace = output[i][0];
        var key = output[i][1];

        // Replace value with key's value
        if(key in values){
            string = string.replace(toReplace, values[key]);
        }
    }

    return string;
}

/**
 * Remove mime encode
 * @param string
 * @returns {*}
 */
var mimeCleaner = function(string){

    var mimeRegex = /=\?UTF-8\?Q\?.+\?=/;

    var toDecode = string.match(mimeRegex);

    if(toDecode != null && toDecode.length > 0){
        var decoded = mimelib.decodeMimeWord(toDecode[0]);

        string = string.replace(mimeRegex, decoded)
    }

    return string;
}

// Makes variables public
exports.Formatter = Formatter;
exports.GetEmails = GetEmails;