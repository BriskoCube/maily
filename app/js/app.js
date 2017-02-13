/**
 * ETML
 * Auteur       : quartierju
 * DATE         : 08.02.2017
 * Description  :
 */

var mailyApp = angular.module('Maily', ['ngSanitize']);

var apiUrl = "http://maily.ovh:6580/api/";

mailyApp.controller('MaillyListController', function MaillyListController($scope, $http, $interval) {

    $scope.subjectKey = "Subject";
    $scope.fromKey = "From";
    $scope.toKey = "To";

    getDomains($scope, $http);

    $scope.domainChanged = function(){
        getMailAddress($scope, $http);
    }

    $scope.emailAddressChanged = function(){
        getMails($scope, $http);
    }

    $scope.showDetail = function(mailObject){

        var mails = document.getElementsByClassName("mail");

        for(var i = 0, len = mails.length; i < len; i++){
            var mail = angular.element(mails[i]);

            mail.removeClass('active');
        }

        var clicked = angular.element(document.getElementById("mail_" + mailObject.id));
        clicked.addClass('active');

        var messageDiv = angular.element(document.getElementById('message'));

        console.log(mailObject);

        $scope.from = mailObject.headers.from;
        $scope.subject = mailObject.headers.subject;
        $scope.to = mailObject.headers.to;

        console.log($scope);

        switch (mailObject.headers.docType){
            case 'text/html':
                messageDiv.html(mailObject.message);
                break;
            default:
                messageDiv.html(makeLinks(Ln2br(mailObject.message)));
                break;
        }



    }

    $scope.mails = [
    ];
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


function Ln2br(input){
    return input.replace(/\n/g, '<br>');
}

function getScope(){
    var controllerElement = document.querySelector('body');
    return angular.element(controllerElement).scope();
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

mailyApp.filter('oneLine', function() {
    return function(string) {
        if (!angular.isString(string)) {
            return string;
        }
        return string.replace(/[ ]{2,}/g, ' ').replace(/\n/g, ' ');
    };
});

mailyApp.filter('strip', function() {
    return function(html) {
        var tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };
});
