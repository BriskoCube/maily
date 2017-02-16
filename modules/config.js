/**
 * Created by quartierju on 02.02.2017.
 */

var mysql = {
    host: 'localhost',
    user: 'nodeapi',
    password: 'zLyGDCgOBPUFaBOW',
    database: 'postfixadmin'
};

var server = {
    port: 6580
};

var dovetail = {
    path:'/var/vmail/',
    mailPaths:[
        '#{domain}/#{user}/Maildir/cur/',
        '#{domain}/#{user}/Maildir/new/',
    ]

}

var strings = {
    email: {
        add:{
            created:{
                "str": 'New email correctly created',
                "code": 10
            },
            alreadyExist:{
                "str": 'This email address already exist',
                "code": 11
            }
        },
        'delete':{
            ok:{
                "str": 'Email correctly deleted',
                "code": 20
            },
            error:{
                "str": 'Error while deleting email',
                "code": 21
            },
        },
        format:{
            ok:{
                "str": '',
                "code": 30
            },
            error:{
                "str": 'Email name doesn\'t match the correct format',
                "code": 31
            }
        }
    },
    dovetail:{
        file:{
            no:{
                "str": 'No email found',
                "code": 40
            }
        }
    }
}

var codes = {
    email: {
        add:{
            created:10,
            alreadyExist:11
        },
        'delete':{
            ok:20,
            error:21,
        },
        format:{
            ok:30,
            error:31
        }
    },
    dovetail:{
        file:{
            no:40
        }
    }
}

var emailHeader = [
    'A-IM','Accept','Accept-Additions','Accept-Charset','Accept-Datetime','Accept-Encoding','Accept-Features','Accept-Language','Accept-Language','Accept-Patch','Accept-Ranges','Age','Allow','ALPN','Also-Control','Alt-Svc','Alt-Used','Alternate-Recipient','Alternates','Apply-To-Redirect-Ref','Approved','Archive','Archived-At','Archived-At','Article-Names','Article-Updates','Authentication-Control','Authentication-Info','Authentication-Results','Authorization','Auto-Submitted','Autoforwarded','Autosubmitted','Base','Bcc','Body','C-Ext','C-Man','C-Opt','C-PEP','C-PEP-Info','Cache-Control','CalDAV-Timezones','Cc','Close','Comments','Comments','Connection','Content-Alternative','Content-Base','Content-Base','Content-Description','Content-Disposition','Content-Disposition','Content-Duration','Content-Encoding','Content-features','Content-ID','Content-ID','Content-Identifier','Content-Language','Content-Language','Content-Length','Content-Location','Content-Location','Content-MD5','Content-MD5','Content-Range','Content-Return','Content-Script-Type','Content-Style-Type','Content-Transfer-Encoding','Content-Type','Content-Type','Content-Version','Control','Conversion','Conversion-With-Loss','Cookie','Cookie2','DASL','DAV','DL-Expansion-History','Date','Date','Date','Date-Received','Default-Style','Deferred-Delivery','Delivery-Date','Delta-Base','Depth','Derived-From','Destination','Differential-ID','Digest','Discarded-X400-IPMS-Extensions','Discarded-X400-MTS-Extensions','Disclose-Recipients','Disposition-Notification-Options','Disposition-Notification-To','Distribution','DKIM-Signature','Downgraded-Bcc','Downgraded-Cc','Downgraded-Disposition-Notification-To','Downgraded-Final-Recipient','Downgraded-From','Downgraded-In-Reply-To','Downgraded-Mail-From','Downgraded-Message-Id','Downgraded-Original-Recipient','Downgraded-Rcpt-To','Downgraded-References','Downgraded-Reply-To','Downgraded-Resent-Bcc','Downgraded-Resent-Cc','Downgraded-Resent-From','Downgraded-Resent-Reply-To','Downgraded-Resent-Sender','Downgraded-Resent-To','Downgraded-Return-Path','Downgraded-Sender','Downgraded-To','Encoding','Encrypted','ETag','Expect','Expires','Expires','Expires','Expiry-Date','Ext','Followup-To','Forwarded','From','From','From','Generate-Delivery-Report','GetProfile','Hobareg','Host','HTTP2-Settings','IM','If','If-Match','If-Modified-Since','If-None-Match','If-Range','If-Schedule-Tag-Match','If-Unmodified-Since','Importance','In-Reply-To','Incomplete-Copy','Injection-Date','Injection-Info','Keep-Alive','Keywords','Keywords','Label','Language','Last-Modified','Latest-Delivery-Time','Lines','Link','List-Archive','List-Help','List-ID','List-Owner','List-Post','List-Subscribe','List-Unsubscribe','List-Unsubscribe-Post','Location','Lock-Token','Man','Max-Forwards','Memento-Datetime','Message-Context','Message-ID','Message-ID','Message-Type','Meter','MIME-Version','MIME-Version','MMHS-Exempted-Address','MMHS-Extended-Authorisation-Info','MMHS-Subject-Indicator-Codes','MMHS-Handling-Instructions','MMHS-Message-Instructions','MMHS-Codress-Message-Indicator','MMHS-Originator-Reference','MMHS-Primary-Precedence','MMHS-Copy-Precedence','MMHS-Message-Type','MMHS-Other-Recipients-Indicator-To','MMHS-Other-Recipients-Indicator-CC','MMHS-Acp127-Message-Identifier','MMHS-Originator-PLAD','MT-Priority','Negotiate','Newsgroups','NNTP-Posting-Date','NNTP-Posting-Host','Obsoletes','Opt','Optional-WWW-Authenticate','Ordering-Type','Organization','Organization','Origin','Original-Encoded-Information-Types','Original-From','Original-Message-ID','Original-Recipient','Original-Sender','Originator-Return-Address','Original-Subject','Overwrite','P3P','Path','PEP','PICS-Label','PICS-Label','Pep-Info','Position','Posting-Version','Pragma','Prefer','Preference-Applied','Prevent-NonDelivery-Report','Priority','ProfileObject','Protocol','Protocol-Info','Protocol-Query','Protocol-Request','Proxy-Authenticate','Proxy-Authentication-Info','Proxy-Authorization','Proxy-Features','Proxy-Instruction','Public','Public-Key-Pins','Public-Key-Pins-Report-Only','Range','Received','Received-SPF','Redirect-Ref','References','References','Referer','Relay-Version','Reply-By','Reply-To','Reply-To','Require-Recipient-Valid-Since','Resent-Bcc','Resent-Cc','Resent-Date','Resent-From','Resent-Message-ID','Resent-Reply-To','Resent-Sender','Resent-To','Retry-After','Return-Path','Safe','Schedule-Reply','Schedule-Tag','Sec-WebSocket-Accept','Sec-WebSocket-Extensions','Sec-WebSocket-Key','Sec-WebSocket-Protocol','Sec-WebSocket-Version','Security-Scheme','See-Also','Sender','Sender','Sensitivity','Server','Set-Cookie','Set-Cookie2','SetProfile','SLUG','SoapAction','Solicitation','Status-URI','Strict-Transport-Security','Subject','Subject','Summary','Supersedes','Supersedes','Surrogate-Capability','Surrogate-Control','TCN','TE','Timeout','To','Topic','Trailer','Transfer-Encoding','TTL','Urgency','URI','Upgrade','User-Agent','User-Agent','Variant-Vary','Vary','VBR-Info','Via','WWW-Authenticate','Want-Digest','Warning','X400-Content-Identifier','X400-Content-Return','X400-Content-Type','X400-MTS-Identifier','X400-Originator','X400-Received','X400-Recipients','X400-Trace','X-Frame-Options','Xref'
]

var utf8 = {
    "00":"",
    "01":"",
    "02":"",
    "03":"",
    "04":"",
    "05":"",
    "06":"",
    "07":"",
    "08":"",
    "09":"\t",
    "0a":"",
    "0b":"",
    "0c":"",
    "0d":"",
    "0e":"",
    "0f":"",
    "10":"",
    "11":"",
    "12":"",
    "13":"",
    "14":"",
    "15":"",
    "16":"",
    "17":"",
    "18":"",
    "19":"",
    "1a":"",
    "1b":"",
    "1c":"",
    "1d":"",
    "1e":"",
    "1f":"",
    "20":"",
    "21":"!",
    "22":"\"",
    "23":"#",
    "24":"$",
    "25":"%",
    "26":"&",
    "27":"'",
    "28":"(",
    "29":")",
    "2a":"*",
    "2b":"+",
    "2c":",",
    "2d":"-",
    "2e":".",
    "2f":"/",
    "30":"0",
    "31":"1",
    "32":"2",
    "33":"3",
    "34":"4",
    "35":"5",
    "36":"6",
    "37":"7",
    "38":"8",
    "39":"9",
    "3a":":",
    "3b":";",
    "3c":"<",
    "3d":"=",
    "3e":">",
    "3f":"?",
    "40":"@",
    "41":"A",
    "42":"B",
    "43":"C",
    "44":"D",
    "45":"E",
    "46":"F",
    "47":"G",
    "48":"H",
    "49":"I",
    "4a":"J",
    "4b":"K",
    "4c":"L",
    "4d":"M",
    "4e":"N",
    "4f":"O",
    "50":"P",
    "51":"Q",
    "52":"R",
    "53":"S",
    "54":"T",
    "55":"U",
    "56":"V",
    "57":"W",
    "58":"X",
    "59":"Y",
    "5a":"Z",
    "5b":"[",
    "5c":"\\",
    "5d":"]",
    "5e":"^",
    "5f":"_",
    "60":"`",
    "61":"a",
    "62":"b",
    "63":"c",
    "64":"d",
    "65":"e",
    "66":"f",
    "67":"g",
    "68":"h",
    "69":"i",
    "6a":"j",
    "6b":"k",
    "6c":"l",
    "6d":"m",
    "6e":"n",
    "6f":"o",
    "70":"p",
    "71":"q",
    "72":"r",
    "73":"s",
    "74":"t",
    "75":"u",
    "76":"v",
    "77":"w",
    "78":"x",
    "79":"y",
    "7a":"z",
    "7b":"{",
    "7c":"|",
    "7d":"}",
    "7e":"~",
    "7f":"",
    "c2":{
        "80":'',
        "81":'',
        "82":'',
        "83":'',
        "84":'',
        "85":'',
        "86":'',
        "87":'',
        "88":'',
        "89":'',
        "8a":'',
        "8b":'',
        "8c":'',
        "8d":'',
        "8e":'',
        "8f":'',
        "90":'',
        "91":'',
        "92":'',
        "93":'',
        "94":'',
        "95":'',
        "96":'',
        "97":'',
        "98":'',
        "99":'',
        "9a":'',
        "9b":'',
        "9c":'',
        "9d":'',
        "9e":'',
        "9f":'',
        "a0":'',
        "a1":'¡',
        "a2":'¢',
        "a3":'£',
        "a4":'¤',
        "a5":'¥',
        "a6":'¦',
        "a7":'§',
        "a8":'¨',
        "a9":'©',
        "aa":'ª',
        "ab":'«',
        "ac":'¬',
        "ad":'',
        "ae":'®',
        "af":'¯',
        "b0":'°',
        "b1":'±',
        "b2":'²',
        "b3":'³',
        "b4":'´',
        "b5":'µ',
        "b6":'¶',
        "b7":'·',
        "b8":'¸',
        "b9":'¹',
        "ba":'º',
        "bb":'»',
        "bc":'¼',
        "bd":'½',
        "be":'¾',
        "bf":'¿'
    },
    "c3":{
        "80":'À',
        "81":'Á',
        "82":'Â',
        "83":'Ã',
        "84":'Ä',
        "85":'Å',
        "86":'Æ',
        "87":'Ç',
        "88":'È',
        "89":'É',
        "8a":'Ê',
        "8b":'Ë',
        "8c":'Ì',
        "8d":'Í',
        "8e":'Î',
        "8f":'Ï',
        "90":'Ð',
        "91":'Ñ',
        "92":'Ò',
        "93":'Ó',
        "94":'Ô',
        "95":'Õ',
        "96":'Ö',
        "97":'×',
        "98":'Ø',
        "99":'Ù',
        "9a":'Ú',
        "9b":'Û',
        "9c":'Ü',
        "9d":'Ý',
        "9e":'Þ',
        "9f":'ß',
        "a0":'à',
        "a1":'á',
        "a2":'â',
        "a3":'ã',
        "a4":'ä',
        "a5":'å',
        "a6":'æ',
        "a7":'ç',
        "a8":'è',
        "a9":'é',
        "aa":'ê',
        "ab":'ë',
        "ac":'ì',
        "ad":'í',
        "ae":'î',
        "af":'ï',
        "b0":'ð',
        "b1":'ñ',
        "b2":'ò',
        "b3":'ó',
        "b4":'ô',
        "b5":'õ',
        "b6":'ö',
        "b7":'÷',
        "b8":'ø',
        "b9":'ù',
        "ba":'ú',
        "bb":'û',
        "bc":'ü',
        "bd":'ý',
        "be":'þ',
        "bf":'ÿ'
    }
}

// Makes variables public

exports.mysql = mysql;
exports.server = server;
exports.strings = strings;
exports.codes = codes;
exports.dovetail = dovetail;
exports.emailHeader = emailHeader;
exports.utf8 = utf8;
