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

    //set server port
    port = process.env.PORT || config.server.port;

    // Start mySQL connection
    db.Connect();

    apiRouter = express.Router();
    httpRouter = express.Router();

    routes();
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
    })
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
            "message": "Petit fdp"
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

    if(IsDomain(domain) && IsLocal(emailToDelete)){
        //Delete email
        email.SetDomain(domain);
        email.Delete(emailToDelete, function(status){
            res.json(status);
        });

    } else {
        res.json({
            "message": {
                "str":"Petit fdp",
                "code": 666
            }
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

    if(IsDomain(domain) && IsLocal(emailLocal)) {
        dovetail.GetEmails(emailLocal, domain, function (mails) {
            res.json(mails);
        });
    } else {
        res.json({
            "message": {
                "str":"Petit fdp",
                "code": 666
            }
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

function GetEmails(req, res){
    var domain = req.params.domain;

    if(IsDomain(domain)) {
        email.SetDomain(domain);

        email.List(function (mailAddress) {
            res.json(mailAddress);
        });
    } else {
        res.json({
            "message": {
                "str":"Petit fdp",
                "code": 666
            }
        });
    }
}

function GetEmailMessage(req, res){
    //Get url parameters
    var emailLocal = req.params.email;
    var domain = req.params.domain;
    var file = req.params.file;

    if(IsDomain(domain) && IsLocal(emailLocal) && IsString(file)) {
        dovetail.GetEmail(emailLocal, domain, file,function(mails){
            res.json(mails);
        });
    } else {
        res.json({
            "message": {
                "str":"Petit fdp",
                "code": 666
            }
        });
    }
}


function IsString(string){
    return typeof string == "string";
}

function IsDomain(dom){

    return IsString(dom) && domainRegex.test(dom);
}

function  IsLocal(local){
    return IsString(local) && emailLocalRegex.test(local);
}

//Url prepend
app.use('/api', apiRouter);
appHttp.use('', httpRouter);

//app.use('/', userRouter);

app.use('/', express.static(__dirname + '/app/html'));
app.use('/css', express.static(__dirname + '/app/css'));
app.use('/js', express.static(__dirname + '/app/js'));
app.use('/img', express.static(__dirname + '/app/img'));

//app.listen(port);

var httpServer = http.createServer(appHttp);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(port - 1);
httpsServer.listen(port);