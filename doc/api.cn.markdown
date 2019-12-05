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

如果“message”是一条非“ACK”请求，则创建客户端事务。
如果是一条“ACK”请求直接传递到传输层。

如果“message”是响应，则查找服务器事务并传递该消息。
对“INVITE”请求的成功响应没有特殊处理。
这是不必要的，因为在sip.js“INVITE”中，服务器事务不会在2xx响应上被销毁，
而是会保留32秒（根据RFC 6026）。
应用程序仍然需要重新发送成功的“INVITE”响应。

## 辅助函数

### sip.makeResponse(request, status[, reason])

根据`request`，`status`，`reason`字段的设置，返回一个SIP响应报文（response）对象

### sip.parseUri(uri)

解析一个URI

### sip.stringifyUri(uri)

URI对象生成字符串

### sip.parse(message)

解析一个SIP消息

### sip.stringify(message)

把一个调消息对象转为报文字符串。

### sip.copyMessage(message[, deep])

复制SIP消息。
如果参数deep为false或省略，则只复制根对象的method、uri、status、reason、headers、content字段 和 headers.via 数组。
如果参数deep为true，则执行消息对象的完全递归复制。

## 摘要认证（Digest Authentication）

sip.js实现了RFC 2617中描述的摘要身份验证。
可以通过调用'require（'sip/digest'）访问模块`

### 摘要认证服务器端API

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

### 摘要认证客户端API

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

## 代理模块

sip.js包含了代理模块来简化代理服务器的开发。
它可以通过`require（'sip/proxy'）；`访问

用法示例：
```
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
```


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



