import * as dgram from 'dgram';
// import {SocketType} from 'dgram'
import * as net from 'net';

export interface SIP_Message_Headers {
    [key: string]: any;
}

export interface SIP_Message_Headers_Value{
    s:string;
    i:number;
}

export interface SIP_Message {
    method?: string;
    uri?: string;
    version?: string;
    status?: number;
    reason?: string;
    headers: SIP_Message_Headers;
    content?: string;
    [key: string]: any;
}


function parseResponse(rs: string, m: SIP_Message): SIP_Message | undefined {
    var r:RegExpMatchArray | null = rs.match(/^SIP\/(\d+\.\d+)\s+(\d+)\s*(.*)\s*$/);
    if (r) {
        m.version = r[1];
        m.status = +r[2];
        m.reason = r[3];
        return m;
    }
}

function parseRequest(rq: string, m: SIP_Message): SIP_Message | undefined {
    var r:RegExpMatchArray | null = rq.match(/^([\w\-.!%*_+`'~]+)\s([^\s]+)\sSIP\s*\/\s*(\d+\.\d+)/);
    if (r) {
        m.method = unescape(r[1]);
        m.uri = r[2];
        m.version = r[3];
        return m;
    }
}

function applyRegex(regex:RegExp, data:SIP_Message_Headers_Value):RegExpExecArray|undefined {
    regex.lastIndex = data.i;
    var r:RegExpExecArray | null = regex.exec(data.s);

    if (r && (r.index === data.i)) {
        data.i = regex.lastIndex;
        return r;
    }
}

function parseParams(data:SIP_Message_Headers_Value, hdr:any) {
    hdr.params = hdr.params || {};

    var re = /\s*;\s*([\w\-.!%*_+`'~]+)(?:\s*=\s*([\w\-.!%*_+`'~]+|"[^"\\]*(\\.[^"\\]*)*"))?/g;

    for (var r = applyRegex(re, data); r; r = applyRegex(re, data)) {
        hdr.params[r[1].toLowerCase()] = r[2] || null;
    }

    return hdr;
}

function parseMultiHeader(parser, d:SIP_Message_Headers_Value, h:string[]|undefined) {
    h = h || [];

    var re = /\s*,\s*/g;
    do {
        h.push(parser(d));
    } while (d.i < d.s.length && applyRegex(re, d));

    return h;
}

/**
 * 
 * @param d 数据和一个number？，number应该时数组时使用
 * @param h 已解析的制定头域，如果已有值，新的值用逗号分割添加到原来的值后面
 */
function parseGenericHeader(d:SIP_Message_Headers_Value, h:string):string {
    return h ? h + ',' + d.s : d.s;
}

export interface SIP_AOR{
    name?:string;
    uri?:string|;
    [key:string]:any;
};

export function parseAOR(data:SIP_Message_Headers_Value):SIP_AOR|undefined {
    var r:RegExpExecArray|undefined = applyRegex(/((?:[\w\-.!%*_+`'~]+)(?:\s+[\w\-.!%*_+`'~]+)*|"[^"\\]*(?:\\.[^"\\]*)*")?\s*\<\s*([^>]*)\s*\>|((?:[^\s@"<]@)?[^\s;]+)/g, data);
    if(r){
        return parseParams(data, { name: r[1], uri: r[2] || r[3] || '' });
    }
};

function parseAorWithUri(data:SIP_Message_Headers_Value) {
    var r:SIP_AOR|undefined = parseAOR(data);
    if(r){
        r.uri = parseUri(r.uri);
    }
    return r;
}

function parseVia(data:SIP_Message_Headers_Value) {
    var r: = applyRegex(/SIP\s*\/\s*(\d+\.\d+)\s*\/\s*([\S]+)\s+([^\s;:]+)(?:\s*:\s*(\d+))?/g, data);
    return parseParams(data, { version: r[1], protocol: r[2], host: r[3], port: r[4] && +r[4] });
}

export interface SIP_CSeq{
    seq:number;
    method:string;
}


function parseCSeq(d:SIP_Message_Headers_Value):SIP_CSeq|undefined {
    var r:RegExpExecArray | null = /(\d+)\s*([\S]+)/.exec(d.s);
    if(r){
        return { seq: +r[1], method: unescape(r[2]) };
    }
}

function parseAuthHeader(d) {
    var r1 = applyRegex(/([^\s]*)\s+/g, d);
    var a = { scheme: r1[1] };

    var r2 = applyRegex(/([^\s,"=]*)\s*=\s*([^\s,"]+|"[^"\\]*(?:\\.[^"\\]*)*")\s*/g, d);
    a[r2[1]] = r2[2];

    while (r2 = applyRegex(/,\s*([^\s,"=]*)\s*=\s*([^\s,"]+|"[^"\\]*(?:\\.[^"\\]*)*")\s*/g, d)) {
        a[r2[1]] = r2[2];
    }

    return a;
}

function parseAuthenticationInfoHeader(d) {
    var a = {};
    var r = applyRegex(/([^\s,"=]*)\s*=\s*([^\s,"]+|"[^"\\]*(?:\\.[^"\\]*)*")\s*/g, d);
    a[r[1]] = r[2];

    while (r = applyRegex(/,\s*([^\s,"=]*)\s*=\s*([^\s,"]+|"[^"\\]*(?:\\.[^"\\]*)*")\s*/g, d)) {
        a[r[1]] = r[2];
    }
    return a;
}

/**
* 换头域名称,似乎是兼容性逻辑
*/
interface SIP_CompactFormType{
    [key:string]:string
}

const compactForm: SIP_CompactFormType = {
    i: 'call-id',
    m: 'contact',
    e: 'contact-encoding',
    l: 'content-length',
    c: 'content-type',
    f: 'from',
    s: 'subject',
    k: 'supported',
    t: 'to',
    v: 'via'
};

interface SIP_Parsers_Function{
    (d:SIP_Message_Headers_Value,h:string):number|string|SIP_AOR;
}

interface SIP_Parsers_Function_List{
    [key:string]:SIP_Parsers_Function
}

let parsers:SIP_Parsers_Function_List = {
    'to': parseAOR,
    'from': parseAOR,
    'contact': function (v:SIP_Message_Headers_Value, h:string) {
        if (v.s == '*')
            return v.s;
        else
            return parseMultiHeader(parseAOR, v, h);
    },
    'route': parseMultiHeader.bind(0, parseAorWithUri),
    'record-route': parseMultiHeader.bind(0, parseAorWithUri),
    'path': parseMultiHeader.bind(0, parseAorWithUri),
    'cseq': parseCSeq,
    'content-length': function (v:SIP_Message_Headers_Value) { return +v.s; },
    'via': parseMultiHeader.bind(0, parseVia),
    'www-authenticate': parseMultiHeader.bind(0, parseAuthHeader),
    'proxy-authenticate': parseMultiHeader.bind(0, parseAuthHeader),
    'authorization': parseMultiHeader.bind(0, parseAuthHeader),
    'proxy-authorization': parseMultiHeader.bind(0, parseAuthHeader),
    'authentication-info': parseAuthenticationInfoHeader,
    'refer-to': parseAOR
};

export interface SIP_Remote {
    protocol: string;
    address: string;
    prot: number;
}

export interface SIP_Logger_Error {
    (error: Error): void
}

export interface SIP_Logger_Send {
    (message: SIP_Message, target: any): void
}

export interface SIP_Logger_Recv {
    (message: SIP_Message, remote: SIP_Remote): void
}

export interface SIP_Callback {
    (message: SIP_Message, remote: SIP_Remote, stream: Buffer): void;
}

export interface SIP_Server_Loggers {
    error?: SIP_Logger_Error;
    send?: SIP_Logger_Send;
    recv?: SIP_Logger_Recv;
}

export interface SIP_Server_Options {
    logger?: SIP_Server_Loggers;
    address?: string;//默认0.0.0.0
    port?: number;//默认5060
    publicAddress?: string;
    hostname?: string;
}


export interface SIP_Parse_UIR {
    user?: string;
}

export function stringify(message: SIP_Message): string {
    //TODO
    return "";
}

function parse(data: string): SIP_Message | undefined {
    let regHeadersLine:RegExp = /\r\n(?![ \t])/;
    let data_array = data.split(regHeadersLine);//分行

    if (data_array[0] === '')
        return;

    var m: SIP_Message = {};

    if (!(parseResponse(data_array[0], m) || parseRequest(data_array[0], m)))
        return;

    m.headers = {};

    for (var i = 1; i < data_array.length; ++i) {
        var r:RegExpMatchArray | null = data_array[i].match(/^([\S]*?)\s*:\s*([\s\S]*)$/);
        if (!r) {
            return;
        }

        var name = unescape(r[1]).toLowerCase();
        name = compactForm[name] || name;

        try {
            m.headers[name] = (parsers[name] || parseGenericHeader)({ s: r[2], i: 0 }, m.headers[name]);
        }
        catch (e) { }
    }

    return m;
}

export interface SIP_URI{
    schema:string;
    user:string;
    passworld:string;
    host:string;
    port:number;
    params:any;
    headers:any;
}

export function parseUri(s:string):SIP_URI {
    if(typeof s === 'object')
      return s;
  
    var re = /^(sips?):(?:([^\s>:@]+)(?::([^\s@>]+))?@)?([\w\-\.]+)(?::(\d+))?((?:;[^\s=\?>;]+(?:=[^\s?\;]+)?)*)(?:\?(([^\s&=>]+=[^\s&=>]+)(&[^\s&=>]+=[^\s&=>]+)*))?$/;
  
    var r:RegExpExecArray | null = re.exec(s);
  
    if(r) {
      return {
        schema: r[1],
        user: r[2],
        password: r[3],
        host: r[4],
        port: +r[5],
        params: (r[6].match(/([^;=]+)(=([^;=]+))?/g) || [])
          .map(function(s) { return s.split('='); })
          .reduce(function(params, x) { params[x[0]]=x[1] || null; return params;}, {}),
        headers: ((r[7] || '').match(/[^&=]+=[^&=]+/g) || [])
          .map(function(s){ return s.split('=') })
          .reduce(function(params, x) { params[x[0]]=x[1]; return params; }, {})
      }
    }
  }

export function parseMessage(s: Buffer):SIP_Message | undefined {
    var r:RegExpMatchArray | null = s.toString('binary').match(/^\s*([\S\s]*?)\r\n\r\n([\S\s]*)$/);
    //r[1] 请求行 + 请求头部
    //r[2] 请求数据
    if (r) {
        var m:SIP_Message | undefined = parse(r[1]);

        if(m) {
            if(m.headers['content-length']) {
                var c:number = Math.max(0, Math.min(m.headers['content-length'], r[2].length));
                m.content = r[2].substring(0, c);
            }
            else {
                m.content = r[2];
            }

            return m;
        }
    }
}



export class SIP_UDP_Transport {
    public readonly protocol: string = 'UDP';
    private socket: dgram.Socket;
    private address: string = "0.0.0.0";
    private port: number = 5060;
    constructor(options: SIP_Server_Options, callback?: SIP_Callback) {
        this.socket = dgram.createSocket(net.isIPv6(this.address) ? 'udp6' : 'udp4', (msg: Buffer, rinfo: dgram.RemoteInfo) => {
            // var msg = parseMessage(data);

            // if (msg && checkMessage(msg)) {
            //     if (msg.method) {
            //         msg.headers.via[0].params.received = rinfo.address;
            //         if (msg.headers.via[0].params.hasOwnProperty('rport'))
            //             msg.headers.via[0].params.rport = rinfo.port;
            //     }

            //     callback(msg, { protocol: 'UDP', address: rinfo.address, port: rinfo.port, local: { address: address, port: port } });
            // }
        });
        this.socket.bind(this.port, this.address);
    };
    public send(remote: SIP_Remote, message: SIP_Message) {
        var s = stringify(message);
        this.socket.send(Buffer.from(s, 'binary'), 0, s.length, remote.prot, remote.address);
    };
    /**
     * 暂时不知道这样的接口意义，需要确定，这种写法可能与其他通讯层保持统一接口用
     * @param remote 
     * @param error 
     */
    public open(_remote: SIP_Remote, error: any): any {
        let self = this;
        let remote = _remote;
        return {
            send: function (message: SIP_Message): void {
                var s = stringify(message);
                self.send(remote, message);
            },
            protool: this.protocol,
            release: function (): void { }
        }
    }
    public get = this.open;
    public destroy(): void {
        this.socket.close();
    };
}

export interface SIP_Transport_Protocols {
    UDP?: any;//TODO
    TCP?: any;//TODO
    TLS?: any;//TODO
    WS?: any;//TODO
}

export class SIP_Transport {
    private sendLog: SIP_Logger_Send = (message: SIP_Message, target: any) => { };
    private recvLog: SIP_Logger_Recv = (message: SIP_Message, remote: SIP_Remote) => { };
    private protocols: SIP_Transport_Protocols = {};
    constructor(options: SIP_Server_Options, callback: SIP_Callback) {
        let callbackAndLog: SIP_Callback = callback;
        if (options.logger && options.logger.recv) {
            callbackAndLog = (message: SIP_Message, remote: SIP_Remote, stream: Buffer) => {
                this.recvLog(message, remote);
                callback(message, remote, stream);
            }
        }

    }
}

export class SIP_Server {
    private errorLog: SIP_Logger_Error = (error: Error) => { };
    private sendLog: SIP_Logger_Send = (message: SIP_Message, target: any) => { };
    private recvLog: SIP_Logger_Recv = (message: SIP_Message, remote: SIP_Remote) => { };
    private transport: any;
    constructor(options: SIP_Server_Options, callback?: SIP_Callback) {
        if (options.logger && options.logger.error) {
            this.errorLog = options.logger.error;
        }
        this.transport = this.makeTransport(options, (message: SIP_Message, remote: SIP_Remote) => {
            try {
                // var t = m.method ? transaction.getServer(m) : transaction.getClient(m);
                // if(!t) {
                //   if(m.method && m.method !== 'ACK') {
                //     var t = transaction.createServerTransaction(m, transport.get(remote));
                //     try {
                //       callback(m,remote);
                //     } catch(e) {
                //       t.send(makeResponse(m, '500', 'Internal Server Error'));
                //       throw e;
                //     } 
                //   }
                //   else if(m.method === 'ACK') {
                //     callback(m,remote);
                //   }
                // }
                // else {
                //   t.message && t.message(m, remote);
                // }
            } catch (error) {
                this.errorLog(error);
            }
        });
    };
    public send(message: SIP_Message, callback?: SIP_Callback): number {
        this.sendLog(message, "address");
        return 200;
    };
    public makeTransport(options: SIP_Server_Options, callback: SIP_Callback): any {

    }
}

/**
 * 笔记：
 *
 * escape()/unescape()
 * 不编解码字符有69个：*，+，-，.，/，@，_，0-9，a-z，A-Z
 * 注：根据百度百科上说 ECMAScript v3 已从标准中删除了 (蛋蛋，如果真不能用了考虑用以下函数替代，不知道SIP标准怎么规定的)
 *
 * encodeURI()/decodeURI()
 * 不编解码字符有82个：!，#，$，&，'，(，)，*，+，,，-，.，/，:，;，=，?，@，_，~，0-9，a-z，A-Z
 *
 * encodeURIComponent()/decodeURIComponent()
 * 不编解码字符有71个：!， '，(，)，*，-，.，_，~，0-9，a-z，A-Z
 */