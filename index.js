/**
 * ETML
 * Auteur       : Julien Quartier
 * DATE         : 02.02.2017
 * Description  : Main file. He can be called "the server".
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

var privateKey  = fs.readFileSync('sslcert/privkey.pem');
var certificate = fs.readFileSync('sslcert/cert.pem');
var chain = fs.readFileSync('sslcert/chain.pem');
var credentials = {key: privateKey, cert: certificate, ca:[chain]};


var app = null;
var appHttp = null;
var port = 0;
var apiRouter = null;
var httpRouter = null;

var emailLocalRegex = /^[a-z]{1}[a-z0-9._-]{1,}[a-z0-9]{1}$/i;
var domainRegex = /^[a-z]{1}[a-z0-9.-_]+[.][a-z]{2,10}$/i;

// Entry point
init();

/**
 *
 */
function init(){

    app = express();
    appHttp = express();

    // configure app to use bodyParser()
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    // Start mySQL connection
    db.Connect();

    apiRouter = express.Router();
    httpRouter = express.Router();

    Routes();

    Crons();
}

function Crons(){

    // Execute cron every 5 minutes
    var deleteMail = schedule.scheduleJob('*/5 * * * * *', function(){

        Title("Start deleting");

        email.SetDomain('maily.ovh');
        email.List(function(emails){

            for(var i = 0, len = emails.data.length; i < len; i++){
                //Email address informations
                var data = emails.data[i];

                //Number of days since created
                var oneDay = 24*60*60*1000;
                var d = new Date(data.created);
                var deltaDays = Math.round((Date.now() - d)/oneDay);

                //If days before delete has been reached and the name is in the allowed names
                if(deltaDays > config.main.daysBeforeDelete.address
                    && IsInArray(data.name, config.main.nameToDelete)){

                    //Allow to use data in callback. self-executing anonymous function;
                    (function(actData) {
                        MailFolderEmpty(actData.local_part, actData.domain, function(isEmpty){
                            if(isEmpty){
                                console.log(HourPrefixer(actData.username));

                                email.Delete(actData.local_part, function(){
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
function Routes(){
    // Use for all requests
    apiRouter.use(function(req, res, next) {
        next();
    });

    apiRouter
        // Home route
        .get('/', GetHomePage)
        // Email address
        .post('/email', PostEmailAddress)
        .delete('/email/:domain/:email', DeleteEmailAddress)
        // Email messages
        .get('/email/:domain/:email', GetEmailMessages)
        .get('/email/:domain/:email/:file', GetEmailMessage)
        .get('/emails/:domain', GetEmails)
        // Domains
        .get('/domains', GetDomains);

    httpRouter.get('*',function(req,res){
        res.redirect('https://maily.ovh:6580'+req.url)
    });
}

/**
 *
 * @param req
 * @param res
 * @constructor
 */
function GetHomePage(req, res){
    res.json({ message: 'Welcome to Maily API!' });
}

/**
 *
 * @param req
 * @param res
 * @constructor
 */
function PostEmailAddress(req, res){
    //Get post parameters
    var newEmailName = req.body.email;
    var fullName = req.body.full_name;
    var domain = req.body.domain;
    var password = req.body.password;

    if(IsString(fullName) && IsString(password) && IsDomain(domain) && IsLocal(newEmailName)){
        //Add email into db
        email.SetDomain(domain);
        email.Add(newEmailName, fullName, password, function(status){
            res.json(status);
        });
    } else {
        res.json({
            message: config.strings.global.format.error
        });
    }
}

/**
 *
 * @param req
 * @param res
 * @constructor
 */
function DeleteEmailAddress(req, res){
    //Get url parameters
    var emailToDelete = req.params.email;
    var domain = req.params.domain;

    //If all request param are ok. Continue
    if(IsDomain(domain)
        && IsLocal(emailToDelete)){

        //Delete email
        email.SetDomain(domain);
        email.Delete(emailToDelete, function(status){
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
 *
 * @param req
 * @param res
 * @constructor
 */
function GetEmailMessages(req, res){
    //Get url parameters
    var emailLocal = req.params.email;
    var domain = req.params.domain;

    //If all request param are ok. Continue
    if(IsDomain(domain)
        && IsLocal(emailLocal)) {

        //Return email messages
        dovetail.GetEmails(emailLocal, domain, function (mails) {
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
 *
 * @param req
 * @param res
 * @constructor
 */
function GetDomains(req, res){
    domain.List(function(domains){
        res.json(domains);
    });
}

/**
 * Get all emails form an address
 * @param req
 * @param res
 * @constructor
 */
function GetEmails(req, res){
    // Get domain in url
    var domain = req.params.domain;

    // If the domain is valid
    if(IsDomain(domain)) {
        email.SetDomain(domain);

        //Return email Addresses
        email.List(function (mailAddress) {
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
function GetEmailMessage(req, res){
    //Get url parameters
    var emailLocal = req.params.email;
    var domain = req.params.domain;
    var file = req.params.file;

    //If all request param are ok. Continue
    if(IsDomain(domain)
        && IsLocal(emailLocal)
        && IsString(file)) {

        //Get mails for a specific address
        dovetail.GetEmail(emailLocal, domain, file,function(mails){
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
function HourPrefixer(string){
    var date = new Date();
    return `[${date.getHours()}:${date.getMinutes()}] ${string}`;
}

/**
 * Log title with style
 * @param string
 * @constructor
 */
function Title(string){
    console.log();
    console.log();
    console.log(HourPrefixer(`►▬▬▬▬ ${string} ▬▬▬▬◄`));
}

/**
 * Is string
 * @param string String to check
 * @returns {boolean}
 * @constructor
 */
function IsString(string){
    return typeof string == "string";
}


/**
 * Check if domain is valid
 * @param dom Domain to check
 * @returns {boolean}
 * @constructor
 */
function IsDomain(dom){
    return IsString(dom) && domainRegex.test(dom);
}

/**
 * Check if local part is valid
 * @param local Local part to check
 * @returns {boolean}
 * @constructor
 */
function  IsLocal(local){
    return IsString(local) && emailLocalRegex.test(local);
}

/**
 * If value is in array
 * @param value
 * @param array
 * @returns {boolean}
 * @constructor
 */
function IsInArray(value, array){
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
function MailFolderEmpty(localPart, domain, Callback){

    //Count emails
    dovetail.CountEmail(localPart, domain, function(count){
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