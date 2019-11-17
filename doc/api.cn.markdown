SIP.js API
==========

sip.js 是一个简单的SIP协议工具

它的特征:

* SIP 消息解析
* 基于 UDP, TCP 和 TLS 的数据传输
* 事务
* Digest 摘要认证

例子
--------------------


将所有SIP请求重定向到backup.somewhere.net

    var sip = require('sip');
  
    sip.start({}, function(request) {
      var response = sip.makeResponse(request, 302, 'Moved Temporarily');

      var uri = sip.parseUri(request.uri);
      uri.host = 'backup.somewhere.net'; 
      response.headers.contact = [{uri: uri}];
    
      sip.send(response);
    });

消息
---------

把SIP消息解析为一个javascript对象

    INVITE sip:service@172.16.2.2:5060 SIP/2.0
    Via: SIP/2.0/UDP 127.0.1.1:5060;branch=z9hG4bK-1075-1-0
    From: sipp <sip:sipp@127.0.1.1:5060>;tag=1075SIPpTag001
    To: sut <sip:service@172.16.2.2:5060>
    Call-ID: 1-1075@127.0.1.1
    CSeq: 1 INVITE
    Contact: sip:sipp@127.0.1.1:5060
    Max-Forwards: 70
    Subject: Performance Test
    Content-Type: application/sdp
    Content-Length:   127

    v=0
    o=user1 53655765 2353687637 IN IP4 127.0.1.1
    s=-
    c=IN IP4 127.0.1.1
    t=0 0
    m=audio 6000 RTP/AVP 0
    a=rtpmap:0 PCMU/8000
    
消息被解析成下列对象

    { method: 'INVITE'
    , uri: 'sip:service@172.16.2.2:5060'
    , version: '2.0'
    , headers: 
       { via: 
          [ { version: '2.0'
            , protocol: 'UDP'
            , host: '127.0.1.1'
            , port: 5060
            , params: { branch: 'z9hG4bK-1075-1-0' }
            }
          ]
       , from: 
          { name: 'sipp'
          , uri: 'sip:sipp@127.0.1.1:5060'
          , params: { tag: '1075SIPpTag001' }
          }
       , to: 
          { name: 'sut'
          , uri: 'sip:service@172.16.2.2:5060'
          , params: {}
          }
       , 'call-id': '1-1075@127.0.1.1'
       , cseq: { seq: 1, method: 'INVITE' }
       , contact: 
          [ { name: undefined
            , uri: 'sip:sipp@127.0.1.1:5060'
            , params: {}
            }
          ]
       , 'max-forwards': '70'
       , subject: 'Performance Test'
       , 'content-type': 'application/sdp'
       , 'content-length': 127
       }
    , content: 'v=0\r\no=user1 53655765 2353687637 IN IP4 127.0.1.1\r\ns=-\r\nc=IN IP4 127.0.1.1\r\nt=0 0\r\nm=audio 6000 RTP/AVP 0\r\na=rtpmap:0 PCMU/8000'
    }    

SIP请求（Request）有 `method` 和 `uri` 属性字段，与之相反的 SIP应答（Response）有 `status` 和 `reason` 属性字段。

## 高级别 API

### sip.start(options, onRequest)

开启SIP协议

`options` - 是一个可选项包含以下字段属性. 

* `port` - 用于UDP和TCP数据传输的端口，默认端口号为5060端口。
* `address` - 用于监听的接口地址。 默认sip.js监听所有的接口地址。
* `udp` - 启用UDP数据传输。默认启用。
* `tcp` - 启用TCP数据传输。默认启用。
* `tls` - TLS数据传输选项对象。 这个对象将被传给 nodejs APIs 的 `tls.createServer` 和 `tls.connect` node.js APIs. 详见 [node.js API 文档里的描述](http://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener)。
  如果tls是ommited(什么鬼)，则将禁用TLS数据传输。
* `tls_port` - TLS数据传输监听端口，默认端口5061端口。
* `publicAddress`, `hostname` - 这两个字段用在sip.js生成本地URI和VIA头域， sip.js将优先使用已被定义的`options.publicAddress`，然后使用被定义的`options.hostname`，两个值如果都没有定义就使用 node.js的 `os.hostname()` API得返回值.
* `ws_port` - 用于定义WebSockets数据传输的端口并且启用WebSockets数据传输。 如果使用WebSocket，这个字段是必须的，不提供默认值。
* `maxBytesHeaders` - (针对于 TCP 和 TLS ) 最大允许的SIP头部长度（不包括内容部分）; 默认值60480.
* `maxContentLength` - (针对于 TCP 和 TLS ) 最大允许的SIP内容长度; 默认值604800.


`onRequest` - 新的请求来了这个回调就会被调用。 回调是一个预期有两个参数的函数。
`function (request, remote) {}`. 第一个参数`request` 是接收到的请求， 第二个参数`remote`是一个对象，它包含发送这个请求的socket的协议、地址和端口，例如 `{ protocol: 'TCP', address: '192.168.135.11', port: 50231 }`

### sip.stop

停止SIP协议

### sip.send(message[, callback])

以事务方式发送SIP消息。

If `message` is an non-`'ACK'` request then client transaction is created. Non-`'ACK'` requests are passed directy to transport layer.

If `message` is a response then server transaction is looked up and passed the message. There is no special handling of success
responses to `'INVITE'` requests. It is not necessary because in sip.js `'INVITE'` server transactions are not destroyed on 2xx responses 
but kept around for another 32 seconds (as per RFC 6026). Applications still need to resend success `'INVITE'` responses. 

## Helper Functions

### sip.makeResponse(request, status[, reason])

returns SIP response object for `request` with `status` and `reason` fields set.

### sip.parseUri(uri)

解析一个URI

### sip.stringifyUri(uri)

URI对象生成字符串

### sip.parse(message)

parses SIP message.

### sip.stringify(message)

stringfies SIP message.

### sip.copyMessage(message[, deep])

copies SIP message. If parameter `deep` is false or omitted it copies only `method`, `uri`, `status`, `reason`, `headers`, `content` 
fields of root object and `headers.via` array. If deep is true it performs full recursive copy of message object.

## Digest Authentication

sip.js implements digest authentication as described in RFC 2617. Module can be accessed by calling `require('sip/digest');`

### Server-side API

#### digest.challenge(session, response)

inserts digest challenge ('WWW-Authethicate' or 'Proxy-Authenticate' headers) into response and returns it. `session` parameter
is a javascript object containing at least `realm` property. On return it will contain session parameters (nonce, nonce-count etc)
and should be passed to subsequent `authenticateRequest` calls. It is a plain object containing only numbers and strings and can be
'jsoned' and saved to database if required.

#### digest.authenticateRequest(session, request[, credentials])

returns `true` if request is signed using supplied challenge and credentials. `credentials` required only on first call to generate `ha1` value 
which is cached in `session` object. `credentials` is an object containing following properties:

* `user` - user's account name
* `realm` - protection realm name. optinal, should match realm passed in corresponding `challenge` call.
* `password` - user's password. optional if `hash` property is present.
* `hash` - hash of user's name, password and protection realm. Optional if `password` is present. Can be obtained by calling 
  `digest.calculateUserRealmPasswordHash` and used if you don't want to store passwords as clear text.

#### digest.signResponse(session, response)

inserts 'Authentication-Info' header into response. Used for mutual client-server authentication.

### Client-side API

### digest.signRequest(session, request[, response, credentials])

inserts 'Authorization' or 'Proxy-Authorization' headers into request and returns it. To initialize the session after server challenge reception,
supply `response` (must be 401 or 407 response containing server challenge) and `credentials`. `credentials` parameter described in 
`digest.authenticateRequest` description.

### digest.authenticateResponse(session, response)

checks server signature in 'Authentication-Info' parameter. Returns `true` if signature is valid, `false` if invalid and `undefined` if no 'Authentication-Info'
header present or it lacks `rspauth` parameter. If server supplied `nextnonce` parameter reinitializes `session`. 

### Low level functions

#### digest.calculateDigest(arguments)

calculates digest as described in RFC 2617. `arguments` is an object with following properties

* `ha1`
* `nonce`
* `nc`
* `cnonce`
* `qop`
* `method`
* `uri`
* `entity`

#### digest.calculateHA1(arguments)

calculates H(A1) value as described if RFC 2617. `arguments` is an object with followin properties

* `userhash` - hash of user's name, realm and password. Optional if `user`, `realm` and `password` properties are present
* `user` - user's name. Optional if `userhash` is present.
* `realm` - realm name. Optional if `userhash` is present.
* `password` - user's password in realm. Optional if `userhash` is present.
* `algorithm` - authentication algorithm. Optional, by default used value `md5`.
* `nonce` - server's nonce parameter. Optional if `algorithm` is _not_ equal to `md5-sess`
* `cnonce` - client's nonce. Optional if `algorithm` is _not_ equal to `md5-sess`

#### digest.calculateUserRealmPasswordHash(user, realm, password)

calculates hash of 'user:realm:password'

## Proxy Module

sip.js includes proxy module to simplify proxy server development. It can be accessed via `require('sip/proxy');`
Usage example:

    var sip = require('sip');
    var proxy = require('sip/proxy');
    var db = require('userdb');

    proxy.start({}, function(rq) {
      var user = sip.parseUri(rq.uri).user;

      if(user) {
        rq.uri = db.getContact(user);

        proxy.send(rq);
      }
      else
        proxy.send(sip.makeResponse(rq, 404, 'Not Found')); 
    });


### proxy.start(options, onRequest)

Starts proxy and SIP stack. Parameters are analogous to `sip.start`

### proxy.stop

stops proxy core and sip stack.

### proxy.send(msg[, callback])

Use this function to respond to or to make new requests in context of incoming requests. Proxy core will
automatically handle cancelling of incoming request and issue `CANCEL` requests for outstanding requests on your
behalf. Outgoing requests are bound to context through their top via header.
If you are sending a request and omit `callback` parameter, default calback will be used:

    function defaultProxyCallback(rs) {
      // stripping top Via
      rs.headers.via.shift();

      // sending response to original incoming request
      proxy.send(rs);
    } 



