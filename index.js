/**
 * ETML
 * Auteur       : Julien Quartier
 * DATE         : 02.02.2017
 * Description  : Main file. It can be called "the server".
 *                - Manage all the api.
 *                - Handle routes.
 *                - Init database
 */


//Needed modules
var config      = require('./modules/config');  // Maily config
var express     = require('express');           // Routes
var bodyParser  = require('body-parser');       // Manage post parameters
var db          = require('./modules/db');      // Maily Database
var email       = require('./modules/email');   // Maily Emails
var domain      = require('./modules/domain');  // Maily Domains
var dovetail    = require('./modules/dovetail');// Maily Dovetails
var http        = require('http');
var https       = require('https');
var fs          = require('fs');
var schedule    = require('node-schedule');

//SSl configuration
var privateKey  = fs.readFileSync('sslcert/privkey.pem');
var certificate = fs.readFileSync('sslcert/cert.pem');
var chain = fs.readFileSync('sslcert/chain.pem');
var credentials = {key: privateKey, cert: certificate, ca:[chain]};

//App objects
var app = null;
var appHttp = null;
var apiRouter = null;
var httpRouter = null;

var emailLocalRegex = /^[a-z][a-z0-9._-]+[a-z0-9]$/i;
var domainRegex = /^[a-z][a-z0-9.-_]+[.][a-z]{2,10}$/i;

// Entry point
init();

/**
 * Initialize the Nodejs app
 */
function init(){

    //Init express router. app for https and appHttp for the redirect to https
    app = express();
    appHttp = express();

    // configure app to use bodyParser()
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    // Start mySQL connection
    db.connect();

    apiRouter = express.Router();
    httpRouter = express.Router();

    routes();
    crons();
}

/**
 * Create crons. Call a function every 5 minutes, every hours, or what you want. Feel free.
 */
function crons(){

    // Execute cron every 5 minutes
    var deleteMail = schedule.scheduleJob('*/5 * * * *', function(){

        title("Start deleting");

        email.setDomain('maily.ovh');
        email.list(function(emails){

            for(var i = 0, len = emails.data.length; i < len; i++){
                //Email address informations
                var data = emails.data[i];

                //Number of days since created
                var oneDay = 24*60*60*1000;
                var d = new Date(data.created);
                var deltaDays = Math.round((Date.now() - d)/oneDay);

                //If days before delete has been reached and the name is in the allowed names
                if(deltaDays > config.main.daysBeforeDelete.address
                    && isInArray(data.name, config.main.nameToDelete)){

                    //Allow to use data in callback. self-executing anonymous function;
                    (function(actData) {
                        mailFolderEmpty(actData.local_part, actData.domain, function(isEmpty){
                            if(isEmpty){
                                console.log(hourPrefixer(actData.username));

                                email.remove(actData.local_part, function(){
                                    //TODO implement delete
                                });
                            }
                        });
                    })(data);
                }
            }
        });
    });
}

/**
 * Define routes and callbackfunction
 */
function routes(){
    // Use for all requests
    apiRouter.use(function(req, res, next) {
        next();
    });

    apiRouter
        // Home route
        .get('/', getHomePage)
        // Email address
        .post('/email', postEmailAddress)
        .delete('/email/:domain/:email', deleteEmailAddress)
        // Email messages
        .get('/email/:domain/:email', getEmailMessages)
        .get('/email/:domain/:email/:file', getEmailMessage)
        .get('/emails/:domain', getEmails)
        // Domains
        .get('/domains', getDomains);

    httpRouter.get('*',function(req,res){
        res.redirect('https://maily.ovh:6580'+req.url)
    });
}

/**
 * Home page controller
 * @param req
 * @param res
 * @constructor
 */
function getHomePage(req, res){
    res.json({ message: 'Welcome to Maily API!' });
}

/**
 * Add a new email address inside db
 * @param req
 * @param res
 * @constructor
 */
function postEmailAddress(req, res){
    //Get post parameters
    var newEmailName = req.body.email;
    var fullName = req.body.full_name;
    var domain = req.body.domain;
    var password = req.body.password;

    if(isString(fullName) && isString(password) && isDomain(domain) && isLocal(newEmailName)){
        //Add email into db
        email.setDomain(domain);
        email.add(newEmailName, fullName, password, function(status){
            res.json(status);
        });
    } else {
        res.json({
            message: config.strings.global.format.error
        });
    }
}

/**
 * Delete email address form db
 * @param req
 * @param res
 * @constructor
 */
function deleteEmailAddress(req, res){
    //Get url parameters
    var emailToDelete = req.params.email;
    var domain = req.params.domain;

    //If all request param are ok. Continue
    if(isDomain(domain)
        && isLocal(emailToDelete)){

        //Delete email
        email.setDomain(domain);
        email.remove(emailToDelete, function(status){
            //Return delete status
            res.json(status);
        });

    } else {
        //Return error
        res.json({
            message: config.strings.global.format.error
        });
    }

}

/**
 * Get email messages from dovetails
 * @param req
 * @param res
 * @constructor
 */
function getEmailMessages(req, res){
    //Get url parameters
    var emailLocal = req.params.email;
    var domain = req.params.domain;

    //If all request param are ok. Continue
    if(isDomain(domain)
        && isLocal(emailLocal)) {

        //Return email messages
        dovetail.getEmails(emailLocal, domain, function (mails) {
            res.json(mails);
        });
    } else {
        //return error
        res.json({
            message: config.strings.global.format.error
        });
    }
}

/**
 * Get available domains
 * @param req
 * @param res
 * @constructor
 */
function getDomains(req, res){
    domain.list(function(domains){
        res.json(domains);
    });
}

/**
 * Get all emails form an address
 * @param req
 * @param res
 * @constructor
 */
function getEmails(req, res){
    // Get domain in url
    var domain = req.params.domain;

    // If the domain is valid
    if(isDomain(domain)) {
        email.setDomain(domain);

        //Return email Addresses
        email.list(function (mailAddress) {
            res.json(mailAddress);
        });
    } else {
        //return error
        res.json({
            message: config.strings.global.format.error
        });
    }
}

/**
 * Get a specific email
 * @param req
 * @param res
 * @constructor
 */
function getEmailMessage(req, res){
    //Get url parameters
    var emailLocal = req.params.email;
    var domain = req.params.domain;
    var file = req.params.file;

    //If all request param are ok. Continue
    if(isDomain(domain)
        && isLocal(emailLocal)
        && isString(file)) {

        //Get mails for a specific address
        dovetail.getEmail(emailLocal, domain, file,function(mails){
            //Return mails
            res.json(mails);
        });
    } else {

        res.json({
            message: config.strings.global.format.error
        });
    }
}

/**
 * Add hours and minutes before a string. Mainly for logging
 * @param string
 * @returns {*}
 * @constructor
 */
function hourPrefixer(string){
    var date = new Date();
    return `[${date.getHours()}:${date.getMinutes()}] ${string}`;
}

/**
 * Log title with style
 * @param string
 * @constructor
 */
function title(string){
    console.log();
    console.log();
    console.log(hourPrefixer(`►▬▬▬▬ ${string} ▬▬▬▬◄`));
}

/**
 * Is string
 * @param string String to check
 * @returns {boolean}
 * @constructor
 */
function isString(string){
    return typeof string == "string";
}


/**
 * Check if domain is valid
 * @param dom Domain to check
 * @returns {boolean}
 * @constructor
 */
function isDomain(dom){
    return isString(dom) && domainRegex.test(dom);
}

/**
 * Check if local part is valid
 * @param local Local part to check
 * @returns {boolean}
 * @constructor
 */
function  isLocal(local){
    return isString(local) && emailLocalRegex.test(local);
}

/**
 * If value is in array
 * @param value
 * @param array
 * @returns {boolean}
 * @constructor
 */
function isInArray(value, array){
    if(array.indexOf(value) != -1)
        return true;

    return false;
}

/**
 * Determine address email folder is empty
 * @param localPart
 * @param domain
 * @param Callback
 * @constructor
 */
function mailFolderEmpty(localPart, domain, Callback){

    //Count emails
    dovetail.countEmail(localPart, domain, function(count){
        if(count != 0)
            Callback(false);
        else
            Callback(true);

    });


}

//Url prepend
app.use('/api', apiRouter);

appHttp.use('', httpRouter);

// Configure static routes
app.use('/', express.static(__dirname + '/app/html'));
app.use('/css', express.static(__dirname + '/app/css'));
app.use('/js', express.static(__dirname + '/app/js'));
app.use('/img', express.static(__dirname + '/app/img'));


//Create servers
var httpServer = http.createServer(appHttp);
var httpsServer = https.createServer(credentials, app);

//set servers port
httpServer.listen(config.server.port.http);
httpsServer.listen(config.server.port.https);