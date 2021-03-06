/**
 * ETML
 * Auteur       : quartierju
 * DATE         : 08.02.2017
 * Description  :
 */

//Declare angular app. Include ngRoute for routing and ngSanitize for cleaning HTML
var mailyApp = angular.module('Maily', ["ngRoute", 'ngSanitize']);

//Web api path. Needs to be on the same domain
var apiUrl = "https://maily.ovh:6580/api/";

//Emails address' domain
var domain = "maily.ovh";
var local = "";

var emailLocalRegex = /^[a-z][a-z0-9._-]+[a-z0-9]$/i;
var emailRegex = /^[a-z][a-z0-9._-]+[a-z0-9]@[a-z][a-z0-9.-_]+[.][a-z]{2,10}$/i;

var mailReloader;

/**
 * Angular on load config
 */
mailyApp.config(function($routeProvider) {
    $routeProvider
        //main route. Display home page
        .when("/", {
            templateUrl : "views/home.html",
            controller: "MailyHomeController"
        })
        //Display webmail. Accordingly to the email in parameter(:email).
        .when("/webmail/:email", {
            templateUrl : "views/webmail.html",
            controller: "MailyListController"
        });

});

//Configure maily controller
mailyApp.controller('MailyListController', function MailyListController($scope, $http, $routeParams, $interval) {

    var email = $routeParams.email;

    //Define used mime header key
    $scope.subjectKey = "Subject";
    $scope.fromKey = "From";
    $scope.toKey = "To";

    // Store all mail objects
    $scope.mails = [
    ];

    // If email match regex
    if(emailRegex.test(email)) {

        // Change displayed email
        $scope.email = email;

        //split domain and local
        var emailParts = email.split('@');
        if(emailParts.length > 1){
            local = emailParts[0];
            domain = emailParts[1];
        }

        //Load available domains
        getDomains($scope, $http);

        // On domain changed load domain's addresses
        $scope.domainChanged = function () {
            getMailAddress($scope, $http);
        };

        // Load mails on address changed
        $scope.emailAddressChanged = function () {
            getMails($scope, $http);
        };

        $scope.selectedDomain = domain;
        $scope.selectedLocalPart = local;

        //Get emails and display them
        getMails();

        //Kill mailReloader. Before recalling
        if(mailReloader != null){
            $interval.cancel(mailReloader);
            mailReloader = null;
        }

        // Get mails from server every 10 sec
        mailReloader = $interval(function() {
            getMails();
        }, 10000);

        // Show email details. Message, from, to,...
        $scope.showDetail = function (mailObject) {

            //Remove "active" class from all mail elements
            var mails = document.getElementsByClassName("mail");
            for (var i = 0, len = mails.length; i < len; i++) {
                var mail = angular.element(mails[i]);
                mail.removeClass('active');
            }

            // Set active email id.
            $scope.activeId = mailObject.id;

            // Update message details
            $scope.from = mailObject.headers.from;
            $scope.to = mailObject.headers.to;
            $scope.timestamp = mailObject.id;
            $scope.subject = mailObject.headers.subject;

            // Load mail body from server
            $http.get(apiUrl + `email/${domain}/${local}/${mailObject.file}`).then(function(response) {
                if(response.data.status == true){
                    var data = response.data.data;

                    //Get detailled message container
                    var messageDiv = angular.element(document.getElementById('message'));

                    // Specific functions for each document type(html, plain text, ...)
                    switch (data.headers.docType) {
                        case 'text/html':
                            messageDiv.html(data.message);
                            break;
                        default:
                            messageDiv.html(makeLinks(Ln2br(data.message)));
                            break;
                    }
                } else {
                }
            });
        };
    }

    /**
     * Get emails form api
     */
    function getMails(){
        $http.get(apiUrl + 'email/' + $scope.selectedDomain + '/' + $scope.selectedLocalPart).then(function(response) {
            if(response.data.status == true){

                var loadedMails = response.data.data;

                if( $scope.mails.length < loadedMails.length){
                    if($scope.mails.length != 0){
                        var dif = loadedMails.length - $scope.mails.length;

                        ShowNotification(dif + " new mails", "", "/img/maily-logo-m.png");
                    }
                    $scope.mails = loadedMails;
                }
            } else {
                $scope.mails = [];
            }
        });
    }

});

/**
 * Home page controller.
 * Used to declare MailyHomeController variables and functions.
 * $scope : access to the
 */
mailyApp.controller('MailyHomeController', function MailyHomeController($scope, $http, $location) {

    $scope.popupShow = false;

    // Year for copyrights
    var d = new Date();
    $scope.year = d.getFullYear();

    $scope.domain = domain;

    /**
     * Validate and send new email
     */
    $scope.submit = function(){
        var localPart = $scope.localPart;

        //Email format match the regex
        if(emailLocalRegex.test(localPart)){
            addMail(localPart, $scope, $http);
        }
    };

    /**
     * Send new or existing email address to the server
     * @param localpart
     */
    function addMail(localpart){

        var data = {
            "email": localpart,
            "full_name": "Trash User",
            "domain": domain,
            "password": "trash_user"
        };

        // Send email url
        $http.post(apiUrl + 'email', data).then(function(response) {
            switch (response.data.message.code){
                case 10: //Email created
                    popupShow(response.data.message.str, 1);
                    break;
                case 11: //Email exist
                    popupShow(response.data.message.str, 2);
                    break;
                default:
                    break;
            }

            // Redirect if email has been created or aleady exist
            if(IsInArray(response.data.message.code, [10, 11])){
                local = localpart;

                //redirect to webmail
                $location.path(`/webmail/${localpart}@${domain}`)
            }
        });
    }

    /**
     * Display info popup
     * @param message Text inside the popup
     * @param type Popup design. 1: valid, 2: error
     * @param buttonText Texte for the buttton
     * @param buttonFunction Function called on button click
     */
    function popupShow(message, type, buttonText, buttonFunction){

        $scope.popupShow = true; //show popup
        $scope.popupMessage = message; //set message
        $scope.buttonShow = false; //Hide button. by default

        //if buttonText defined show button
        if(typeof buttonText != 'undefined'){
            $scope.buttonShow = true;
            $scope.buttonText = buttonText;
            $scope.buttonFunction = buttonFunction;
        }

        // Set popup style
        switch (type){
            case 1:
                $scope.popupStyle = "ok";
                break;
            case 2:
                $scope.popupStyle = "error";
                break;
        }
    }
});



/**
 * Make link clickable inside string
 * From : http://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
 * @param inputText
 * @returns {XML|string|*}
 */
function makeLinks(inputText){
    var replacedText, httpFtpPattern, wwwPattern, mailtoPattern;

    // URLs starting with http://, https://, or ftp://
    httpFtpPattern = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(httpFtpPattern, '<a href="$1" target="_blank">$1</a>');

    // URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    wwwPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(wwwPattern, '$1<a href="http://$2" target="_blank">$2</a>');

    // Change email addresses to mailto:: links.
    mailtoPattern = /(([a-zA-Z0-9_.-])+@[a-zA-Z_]+?(\.[a-zA-Z]{2,6})+)/gim;
    replacedText = replacedText.replace(mailtoPattern, '<a href="mailto:$1">$1</a>');

    return replacedText;
}

/**
 * Get emails address for a domain
 * @param scope
 * @param http
 */
function getMailAddress(scope, http){
    http.get(apiUrl + 'emails/' + domain).then(function(response) {
        if(response.data.status == true){
            scope.mailAddresses = response.data.data;
        } else {
            scope.mailAddresses = [];
        }
    });
}

/**
 * Get available domains on server
 * @param scope
 * @param http
 */
function getDomains(scope, http){
    // Request to api
    http.get(apiUrl + 'domains').then(function(response) {
        if(response.data.status == false){
            scope.domains = response.data.data;
        } else {
            scope.domains = [];
        }
    });
}


/**
 * Convert line breaks into html
 * @param input
 * @returns {XML|string|void}
 * @constructor
 */
function Ln2br(input){
    return input.replace(/\n/g, '<br>');
}

/**
 * Check if value is in array
 * @param value
 * @param array
 * @returns {boolean}
 * @constructor
 */
function IsInArray(value, array){
    // If it can find index the value is in array
    if(array.indexOf(value) != -1)
        return true;

    return false;
}

/**
 * Display notification if possible
 * @param title
 * @param message
 * @param icon
 * @constructor
 */
function ShowNotification(title, message, icon){

    // Check if browser support notifications. If not exit
    if(! ('Notification' in window) ){
        console.log('Web Notification not supported');
        return;
    }

    // Ask user for permission.
    Notification.requestPermission(function(){
        // Config notification content and display it.
        var notification = new Notification(title,{
            body:message,
            icon:icon,
            dir:'auto'
        });

        // Set time before closing notif
        setTimeout(function(){
            notification.close();
        },3000);
    });
}

/**
 * No more used
 */
mailyApp.filter("getHeader", function(){
    return function(input, headerKey){

        for(var i = 0, len = input.length; i < len; i ++){
            if(input[i].key == headerKey)
                return input[i].data;
        }
    }
});

/**
 * Replace \n with <br>
 */
mailyApp.filter("ln2br", function(){
    return function(input){
        return Ln2br(input);
    }
});

/**
 * Remove spaces before and after
 */
mailyApp.filter('trim', function () {
    return function(string) {
        if (!angular.isString(string)) {
            return string;
        }
        return string.replace(/[\s]/g, '');
    };
});

/**
 * turn a multiple lines string into a single line string
 */
mailyApp.filter('oneLine', function() {
    return function(string) {
        if (!angular.isString(string)) {
            return string;
        }
        return string.replace(/[ ]{2,}/g, ' ').replace(/\n/g, ' ');
    };
});

/**
 * Remove html
 */
mailyApp.filter('strip', function() {
    return function(html) {
        var tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };
});

/**
 * Remove html
 */
mailyApp.filter('noEmpty', function() {
    return function(value, placeholder) {
        if(typeof value != "string"){
            return placeholder;
        } else {
            return value;
        }
    };
});

/**
 * Check if email local match regex
 */
mailyApp.filter('validLocal', function() {
    return function(value) {
        return !(emailLocalRegex.test(value));
    };
});

