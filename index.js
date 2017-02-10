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


var app = null;
var port = 0;
var apiRouter = null;
var userRouter = null;

// Entry point
init();

/**
 *
 */
function init(){

    app = express();

    // configure app to use bodyParser()
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    //set server port
    port = process.env.PORT || config.server.port

    // Start mySQL connection
    db.Connect();

    apiRouter = express.Router();

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
        .get('/emails/:domain', GetEmails)
        // Domains
        .get('/domains', GetDomains);
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

    //Add email into db
    email.SetDomain(domain);
    email.Add(newEmailName, fullName, password, function(status){
        res.json(status);
    });
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

    //Delete email
    email.SetDomain(domain);
    email.Delete(emailToDelete, function(status){
        res.json(status);
    });
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

    dovetail.GetEmails(emailLocal, domain, function(mails){
        res.json(mails);
    });
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

    email.SetDomain(domain);

    email.List(function(mailAddress){
        res.json(mailAddress);
    });
}

//Url prepend
app.use('/api', apiRouter);

//app.use('/', userRouter);

app.use('/', express.static(__dirname + '/app/html'));
app.use('/css', express.static(__dirname + '/app/css'));
app.use('/js', express.static(__dirname + '/app/js'));

app.listen(port);