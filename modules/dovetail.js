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

        var emailFolder = makeEmailFolder(domain, mailLocal);

        // Lis les fichiers du dossier
        fs.readdir(emailFolder, (err, files) => {

            if (!!files && files.length > 0) {

                var count = 0;
                var mails = [];

                // Loop through folder files
                files.forEach(file => {

                    // Read file content
                    fs.readFile(emailFolder + file, 'utf8', function (err, data) {

                        // Avoid hidden files
                        if (file.charAt(0) != '.')
                            mails.push(MailParser(data, file, 50));

                        count++;

                        // Once all mails have been processed
                        if (count == files.length)
                            Callback({
                                status: true,
                                data: mails
                            });

                    });
                });
            } else {
                //error
                returnJson.status = false;
                returnJson.message = config.strings.dovetail.file.no;

                Callback(returnJson);
            }
        });
};

/**
 *
 * @param mailLocal
 * @param domain
 * @param file
 * @param Callback
 * @constructor
 */
var GetEmail = function(mailLocal, domain, file, Callback){

    //return email messages folder from domain and maillocal
    var emailFolder = makeEmailFolder(domain, mailLocal);

    fs.readFile(emailFolder + file, 'utf8', function (err, data) {

        var mail  =MailParser(data, file);


            Callback({
                status: true,
                data: mail
            });

    });
};

var CountEmail = function(mailLocal, domain, Callback){
    var emailFolder = makeEmailFolder(domain, mailLocal);

    var count = 0;

    // Lis les fichiers du dossier
    fs.readdir(emailFolder, (err, files) => {

        if(typeof  files != "undefined")
           count = files.length;

        Callback(count);

    });


}

/**
 * Parse text email to json
 * @param mail The email's text
 */
var MailParser = function(mail, file, maxLength){

    // Regex used to split header key and value
    var headerRegex = /(([a-zA-Z-]+): (.+)((\n\t(.+))*))/g;

    var timeStampRegex = /^[0-9]+/;

    if(typeof mail != 'string')
        mail = "";

    // Split header and message
    var header = mail.substr(0,mail.indexOf("\n\n"));
    var temporyMessage = mail.substr(mail.indexOf("\n\n")+2); //may content mime informations

    var timeStamp = file.match(timeStampRegex);

    // Output json skeleton
    var output = {
        id: parseInt(timeStamp[0]),
        file: file,
        headers:{},
        message: temporyMessage
    };

    var mimeHeader = mimelib.parseHeaders(header);

    Object.keys(mimeHeader).forEach(function (element) {
        let value = mimeHeader[element];

        var tmpHeader = "";

        for(var i = 0, len = value.length; i < len; i++){
            tmpHeader += value[i];
        }

        output.headers[element.replace(/[-]{1}/g, '_')] = tmpHeader;
    });

    var message = Multipart(output.headers, temporyMessage);

    message = Utf8Decoder(message);

    if(typeof maxLength != 'undefined' && message.length > maxLength){
        message = message.split(0, maxLength);
    }

    output.message = message;

    return output;
};

var Boundaries = function(headers){

    var boundary = false;

    if(headers.hasOwnProperty('content_type')){
        var regexResult = headers.content_type.match(/"(.+)"/)
        if(regexResult != null && regexResult.length > 1){
            boundary = regexResult[1];
        }
    }

    return boundary;
};

var Utf8Decoder = function(string){
    var utf8Regex = /=(((C2|C3)=([0-9a-f]{2}))|([0-9a-f]{2}))/gi;

    var matches;

    string = string.replace(utf8Regex, function (match, p1, p2, p3, p4, p5) {

        if(typeof p3 != 'undefined' && typeof p4 != 'undefined'){
            return (config.utf8[p3.toLowerCase()][p4.toLowerCase()]);
        } else {
            return (config.utf8[p5.toLowerCase()]);
        }
    });

    string = string.replace(/=\n/gi, '');


    /*while(matches = utf8Regex.exec(string)){

        if(typeof matches[3] != 'undefined' && typeof matches[4] != 'undefined'){
            console.log(config.utf8[matches[3].toLowerCase()][matches[4].toLowerCase()]);
        } else {
            console.log(config.utf8[matches[5].toLowerCase()]);
        }
    }*/

    return string;

}

var Multipart = function(headers, message){
    var boundary = Boundaries(headers);

    if(boundary != false){

        var headerRegex = /(.{1,}:.{1,}\n)+[\n\r]{1,}/;

        var regexDocType = /.{0,}:.{0,}(text\/(.+))[;]/;

        var splittedMessage = message.split(boundary)[2];


        var docType = splittedMessage.match(regexDocType);



        if(docType && docType.length > 1){
            headers.docType = docType[1];
        }

        return splittedMessage.replace(headerRegex, '').replace(/[-]+$/, '');
    }

    headers.docType = 'unknow';

    return message;
};

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
};

//Delete email folder
var DeleteFolder = function(domain, mailLocal){
    var path = makeEmailFolder(domain, mailLocal);

    fs.rmdirSync(path);
}

var makeEmailFolder = function(domain, mailLocal){
    // Create email path string
    var emailsFolder = Formatter(config.dovetail.mailPaths[0], {
        domain: domain,
        user: mailLocal
    });

    // Make absolute path
    return config.dovetail.path + emailsFolder;
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
};

// Makes variables public
exports.Formatter = Formatter;
exports.GetEmails = GetEmails;
exports.GetEmail = GetEmail;
exports.CountEmail = CountEmail;
exports.DeleteFolder = DeleteFolder;