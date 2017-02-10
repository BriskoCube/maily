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
    newMailPath:'#{domain}/#{user}/Maildir/cur/'

}

var strings = {
    email: {
        add:{
            created:'New email correctly created',
            alreadyExist:'This email address already exist'
        },
        'delete':{
            ok:'Email correctly deleted',
            error:'Error while deleting email',
        },
        format:{
            ok:'',
            error:'Email name doesn\'t match the correct format'
        }
    },
    dovetail:{
        file:{
            no:'No email found'
        }
    }
}

var emailHeader = [
    'A-IM','Accept','Accept-Additions','Accept-Charset','Accept-Datetime','Accept-Encoding','Accept-Features','Accept-Language','Accept-Language','Accept-Patch','Accept-Ranges','Age','Allow','ALPN','Also-Control','Alt-Svc','Alt-Used','Alternate-Recipient','Alternates','Apply-To-Redirect-Ref','Approved','Archive','Archived-At','Archived-At','Article-Names','Article-Updates','Authentication-Control','Authentication-Info','Authentication-Results','Authorization','Auto-Submitted','Autoforwarded','Autosubmitted','Base','Bcc','Body','C-Ext','C-Man','C-Opt','C-PEP','C-PEP-Info','Cache-Control','CalDAV-Timezones','Cc','Close','Comments','Comments','Connection','Content-Alternative','Content-Base','Content-Base','Content-Description','Content-Disposition','Content-Disposition','Content-Duration','Content-Encoding','Content-features','Content-ID','Content-ID','Content-Identifier','Content-Language','Content-Language','Content-Length','Content-Location','Content-Location','Content-MD5','Content-MD5','Content-Range','Content-Return','Content-Script-Type','Content-Style-Type','Content-Transfer-Encoding','Content-Type','Content-Type','Content-Version','Control','Conversion','Conversion-With-Loss','Cookie','Cookie2','DASL','DAV','DL-Expansion-History','Date','Date','Date','Date-Received','Default-Style','Deferred-Delivery','Delivery-Date','Delta-Base','Depth','Derived-From','Destination','Differential-ID','Digest','Discarded-X400-IPMS-Extensions','Discarded-X400-MTS-Extensions','Disclose-Recipients','Disposition-Notification-Options','Disposition-Notification-To','Distribution','DKIM-Signature','Downgraded-Bcc','Downgraded-Cc','Downgraded-Disposition-Notification-To','Downgraded-Final-Recipient','Downgraded-From','Downgraded-In-Reply-To','Downgraded-Mail-From','Downgraded-Message-Id','Downgraded-Original-Recipient','Downgraded-Rcpt-To','Downgraded-References','Downgraded-Reply-To','Downgraded-Resent-Bcc','Downgraded-Resent-Cc','Downgraded-Resent-From','Downgraded-Resent-Reply-To','Downgraded-Resent-Sender','Downgraded-Resent-To','Downgraded-Return-Path','Downgraded-Sender','Downgraded-To','Encoding','Encrypted','ETag','Expect','Expires','Expires','Expires','Expiry-Date','Ext','Followup-To','Forwarded','From','From','From','Generate-Delivery-Report','GetProfile','Hobareg','Host','HTTP2-Settings','IM','If','If-Match','If-Modified-Since','If-None-Match','If-Range','If-Schedule-Tag-Match','If-Unmodified-Since','Importance','In-Reply-To','Incomplete-Copy','Injection-Date','Injection-Info','Keep-Alive','Keywords','Keywords','Label','Language','Last-Modified','Latest-Delivery-Time','Lines','Link','List-Archive','List-Help','List-ID','List-Owner','List-Post','List-Subscribe','List-Unsubscribe','List-Unsubscribe-Post','Location','Lock-Token','Man','Max-Forwards','Memento-Datetime','Message-Context','Message-ID','Message-ID','Message-Type','Meter','MIME-Version','MIME-Version','MMHS-Exempted-Address','MMHS-Extended-Authorisation-Info','MMHS-Subject-Indicator-Codes','MMHS-Handling-Instructions','MMHS-Message-Instructions','MMHS-Codress-Message-Indicator','MMHS-Originator-Reference','MMHS-Primary-Precedence','MMHS-Copy-Precedence','MMHS-Message-Type','MMHS-Other-Recipients-Indicator-To','MMHS-Other-Recipients-Indicator-CC','MMHS-Acp127-Message-Identifier','MMHS-Originator-PLAD','MT-Priority','Negotiate','Newsgroups','NNTP-Posting-Date','NNTP-Posting-Host','Obsoletes','Opt','Optional-WWW-Authenticate','Ordering-Type','Organization','Organization','Origin','Original-Encoded-Information-Types','Original-From','Original-Message-ID','Original-Recipient','Original-Sender','Originator-Return-Address','Original-Subject','Overwrite','P3P','Path','PEP','PICS-Label','PICS-Label','Pep-Info','Position','Posting-Version','Pragma','Prefer','Preference-Applied','Prevent-NonDelivery-Report','Priority','ProfileObject','Protocol','Protocol-Info','Protocol-Query','Protocol-Request','Proxy-Authenticate','Proxy-Authentication-Info','Proxy-Authorization','Proxy-Features','Proxy-Instruction','Public','Public-Key-Pins','Public-Key-Pins-Report-Only','Range','Received','Received-SPF','Redirect-Ref','References','References','Referer','Relay-Version','Reply-By','Reply-To','Reply-To','Require-Recipient-Valid-Since','Resent-Bcc','Resent-Cc','Resent-Date','Resent-From','Resent-Message-ID','Resent-Reply-To','Resent-Sender','Resent-To','Retry-After','Return-Path','Safe','Schedule-Reply','Schedule-Tag','Sec-WebSocket-Accept','Sec-WebSocket-Extensions','Sec-WebSocket-Key','Sec-WebSocket-Protocol','Sec-WebSocket-Version','Security-Scheme','See-Also','Sender','Sender','Sensitivity','Server','Set-Cookie','Set-Cookie2','SetProfile','SLUG','SoapAction','Solicitation','Status-URI','Strict-Transport-Security','Subject','Subject','Summary','Supersedes','Supersedes','Surrogate-Capability','Surrogate-Control','TCN','TE','Timeout','To','Topic','Trailer','Transfer-Encoding','TTL','Urgency','URI','Upgrade','User-Agent','User-Agent','Variant-Vary','Vary','VBR-Info','Via','WWW-Authenticate','Want-Digest','Warning','X400-Content-Identifier','X400-Content-Return','X400-Content-Type','X400-MTS-Identifier','X400-Originator','X400-Received','X400-Recipients','X400-Trace','X-Frame-Options','Xref'
]

// Makes variables public
exports.mysql = mysql;
exports.server = server;
exports.strings = strings;
exports.dovetail = dovetail;
exports.emailHeader = emailHeader;