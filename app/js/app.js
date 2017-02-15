/**
 * ETML
 * Auteur       : quartierju
 * DATE         : 08.02.2017
 * Description  :
 */

var mailyApp = angular.module('Maily', ["ngRoute", 'ngSanitize']);

var apiUrl = "https://maily.ovh:6580/api/";

var domain = "maily.ovh";
var local = "";

var emailLocalRegex = /^[a-z]{1}[a-z0-9.-_]{3,}$/i;

var emailRegex = /^[a-z]{1}[a-z0-9.-_]{3,}@[a-z]{1}[a-z0-9.-_]+[.][a-z]{2,10}$/i

/**
 * Angular on load config
 */
mailyApp.config(function($routeProvider) {
    $routeProvider
        .when("/", {
            templateUrl : "views/home.html",
            controller: "MailyHomeController"
        })
        .when("/webmail/:email", {
            templateUrl : "views/webmail.html",
            controller: "MailyListController"
        });
});

/**
 * MaillyListController functions
 */
mailyApp.controller('MailyListController', function MailyListController($scope, $http, $routeParams) {

    var email = $routeParams.email;

    $scope.subjectKey = "Subject";
    $scope.fromKey = "From";
    $scope.toKey = "To";


    if(emailRegex.test(email)) {

        var emailParts = email.split('@');

        if(emailParts.length > 1){
            local = emailParts[0];
            domain = emailParts[1];
        }

        //Load avalible domains
        getDomains($scope, $http);

        //Domain changer event listener
        $scope.domainChanged = function () {
            getMailAddress($scope, $http);
        };

        // Email changed event listener
        $scope.emailAddressChanged = function () {
            getMails($scope, $http);
        };

        $scope.selectedDomain = domain;
        $scope.selectedLocalPart = local;
        getMails($scope, $http);

        // Show email details. Message, from, to,...
        $scope.showDetail = function (mailObject) {

            //Remove "active" class from all mail elements
            var mails = document.getElementsByClassName("mail");
            for (var i = 0, len = mails.length; i < len; i++) {
                var mail = angular.element(mails[i]);
                mail.removeClass('active');
            }

            // Add "active" class to the selected element
            var clicked = angular.element(document.getElementById("mail_" + mailObject.id));
            clicked.addClass('active');


            // Update message details
            $scope.from = mailObject.headers.from;
            $scope.subject = mailObject.headers.subject;
            $scope.to = mailObject.headers.to;

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

    // Store all mail objects
    $scope.mails = [
    ];


});


mailyApp.controller('MailyHomeController', function MailyHomeController($scope, $http, $location) {

    $scope.popupShow = false;

    // Year for copyrights
    var d = new Date();
    var n = d.getFullYear();
    $scope.year = n;

    $scope.domain = domain;

    $scope.submit = function(){
        var localPart = $scope.localPart;

        if(emailLocalRegex.test(localPart)){
            addMail(localPart, $scope, $http);
            $scope.mailInvalid = "";
        } else {
            $scope.mailInvalid = "error";
        }
    };

    function addMail(localpart){

        var data = {
            "email": localpart,
            "full_name": "Trash User",
            "domain": domain,
            "password": "trash_user"
        };

        $http.post(apiUrl + 'email', data).then(function(response) {
            switch (response.data.message.code){
                case 10:
                    popupShow(response.data.message.str, 1);
                    break;
                case 11:
                    popupShow(response.data.message.str, 2);
                    break;
            }

            local = localpart;

            $location.path(`/webmail/${localpart}@${domain}`);


        });
    }

    function popupShow(message, type, buttonText, buttonFunction){

        $scope.popupShow = true;
        $scope.popupMessage = message;

        $scope.buttonShow = false;

        if(typeof buttonText != 'undefined'){
            $scope.buttonShow = true;
            $scope.buttonText = buttonText;
            $scope.buttonFunction = buttonFunction;
        }

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
 * Get emails form api
 * @param scope
 * @param http
 */
function getMails(scope, http){
    http.get(apiUrl + 'email/' + scope.selectedDomain + '/' + scope.selectedLocalPart).then(function(response) {
        if(response.data.status == true){
            scope.mails = response.data.data;
        } else {
            scope.mails = [];
        }
    });
}

/**
 *
 * From : http://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
 * @param inputText
 * @returns {XML|string|*}
 */
function makeLinks(inputText){
    var replacedText, replacePattern1, replacePattern2, replacePattern3;

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
}

/**
 * Get emails address for a domain
 * @param scope
 * @param http
 */
function getMailAddress(scope, http){
    http.get(apiUrl + 'emails/maily.ovh').then(function(response) {
        if(response.data.status == true){
            scope.mailAddresses = response.data.data;
        } else {
            scope.mailAddresses = [];
        }
    });
}

/**
 * Get server domain
 * @param scope
 * @param http
 */
function getDomains(scope, http){
    http.get(apiUrl + 'domains').then(function(response) {
        if(response.data.status == true){
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
