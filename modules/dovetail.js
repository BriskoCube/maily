/**
 * ETML
 * Auteur       : quartierju
 * DATE         : 03.02.2017
 * Description  : Interface between node and dovecot
 */

var fs = require('fs');
var config = require('./config');
var mimelib = require("mimelib");

var formatterFindKeyRegex = /#{([a-z]{1,20})}/g;

/**
 * Return email form a specific user. Formatted in json
 * @param mailLocal Local part of the email. (Before the @)
 * @param domain The email's domain
 * @param Callback Call when finished
 * @constructor
 */
var getEmails = function(mailLocal, domain, Callback){

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
                            mails.push(mailParser(data, file, 50));

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
}; //END getEmails

/**
 * Read mail content from file and return the parsed mail
 * @param mailLocal
 * @param domain
 * @param file
 * @param Callback
 * @constructor
 */
var getEmail = function(mailLocal, domain, file, Callback){

    //return email messages folder from domain and maillocal
    var emailFolder = makeEmailFolder(domain, mailLocal);

    //Read file content
    fs.readFile(emailFolder + file, 'utf8', function (err, data) {

        //Parse file content into json
        var mail = mailParser(data, file);

        // Return result
        Callback({
            status: true,
            data: mail
        });
    });
};

/**
 * Number of mails inside a folder
 * @param mailLocal
 * @param domain
 * @param Callback
 */
var countEmail = function(mailLocal, domain, Callback){
    var emailFolder = makeEmailFolder(domain, mailLocal);

    var count = 0;

    // Lis les fichiers du dossier
    fs.readdir(emailFolder, (err, files) => {

        // Prevent crashes if folder is empty
        if(typeof files != "undefined")
           count = files.length;

        Callback(count);

    });
};

/**
 * Parse text email to json
 * @param mail The email's text
 */
var mailParser = function(mail, file, maxLength){

    // Regex used to split header key and value
    var headerRegex = /(([a-zA-Z-]+): (.+)((\n\t(.+))*))/g;

    var timeStampRegex = /^[0-9]+/;

    // Generally empty mails are null
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

    // Parse email mime header.
    var mimeHeader = mimelib.parseHeaders(header);

    // Change mime object format to key -> value
    Object.keys(mimeHeader).forEach(function (element) {
        let value = mimeHeader[element];

        var tmpHeader = "";

        // concat multiple header line
        for(var i = 0, len = value.length; i < len; i++){
            tmpHeader += value[i];
        }

        // replace "-" whith "_" inside header name.
        output.headers[element.replace(/[-]{1}/g, '_')] = tmpHeader;
    });

    // Manage multipart email
    var message = multipart(output.headers, temporyMessage);

    message = utf8Decoder(message);

    // If maxLength is set limit message length
    if(typeof maxLength != 'undefined' && message.length > maxLength){
        message = message.split(0, maxLength);
    }

    output.message = message;

    return output;
}; //END mailParser

/**
 * Get part boundaries from headers
 * @param headers
 * @returns {boolean}
 */
var boundaries = function(headers){

    var boundary = false;

    // Key exist
    if(headers.hasOwnProperty('content_type')){

        //Get only quoted string
        var regexResult = headers.content_type.match(/"(.+)"/);

        // If something is found add it to boundary
        if(regexResult != null && regexResult.length > 1){
            boundary = regexResult[1];
        }
    }

    return boundary;
};

/**
 *
 * @param string
 * @returns {XML|*}
 */
var utf8Decoder = function(string){

    // Regex used to select paterns =c2=xx or =xx
    var utf8Regex = /=(((C2|C3)=([0-9a-f]{2}))|([0-9a-f]{2}))/gi;

    // Function call foreach replace.
    string = string.replace(utf8Regex, function (match, p1, p2, p3, p4, p5) {
        // patern match =c2=xx
        if(typeof p3 != 'undefined' && typeof p4 != 'undefined'){
            return (config.utf8[p3.toLowerCase()][p4.toLowerCase()]);
        } // patern match =xx
        else {
            return (config.utf8[p5.toLowerCase()]);
        }
    });

    // remove line breaks
    string = string.replace(/=\n/gi, '');

    return string;
};

/**
 * Split message between each arts
 * @param headers
 * @param message
 * @returns {*}
 * @constructor
 */
var multipart = function(headers, message){
    var boundary = boundaries(headers);

    if(boundary != false){

        var headerRegex = /(.{1,}:.{1,}\n)+[\n\r]{1,}/;
        var regexDocType = /.{0,}:.{0,}(text\/(.+))[;]/;

        var splittedMessages = message.split(boundary);
        var splittedMessage = splittedMessages[2];

        // Find part's headers
        var docType = splittedMessage.match(regexDocType);

        if(docType && docType.length > 1){
            headers.docType = docType[1];
        }

        // Remove part's header and "-"
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
var formatter = function(string, values){

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

/**
 * Delete email folder
 * @param domain
 * @param mailLocal
 * @constructor
 */
var deleteFolder = function(domain, mailLocal){
    var path = makeEmailFolder(domain, mailLocal);

    fs.rmdirSync(path);
};

/**
 * Build email path string
 * @param domain
 * @param mailLocal
 * @returns {string}
 */
var makeEmailFolder = function(domain, mailLocal){
    // Create email path string
    var emailsFolder = formatter(config.dovetail.mailPaths[1], {
        domain: domain,
        user: mailLocal
    });

    // Make absolute path
    return config.dovetail.path + emailsFolder;
};

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
exports.formatter = formatter;
exports.getEmails = getEmails;
exports.getEmail = getEmail;
exports.countEmail = countEmail;
exports.deleteFolder = deleteFolder;