export interface SIP_Message_Headers {
    [key: string]: any;
}

export interface SIP_Message_Headers_Value {
    s: string;
    i: number;
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
    var r: RegExpMatchArray | null = rs.match(/^SIP\/(\d+\.\d+)\s+(\d+)\s*(.*)\s*$/);
    if (r) {
        m.version = r[1];
        m.status = +r[2];
        m.reason = r[3];
        return m;
    }
}

function parseRequest(rq: string, m: SIP_Message): SIP_Message | undefined {
    var r: RegExpMatchArray | null = rq.match(/^([\w\-.!%*_+`'~]+)\s([^\s]+)\sSIP\s*\/\s*(\d+\.\d+)/);
    if (r) {
        m.method = unescape(r[1]);
        m.uri = r[2];
        m.version = r[3];
        return m;
    }
}

function applyRegex(regex: RegExp, data: SIP_Message_Headers_Value): RegExpExecArray | undefined {
    regex.lastIndex = data.i;
    var r: RegExpExecArray | null = regex.exec(data.s);

    if (r && (r.index === data.i)) {
        data.i = regex.lastIndex;
        return r;
    }
}

function parseParams(data: SIP_Message_Headers_Value, hdr: any): any {
    hdr.params = hdr.params || {};

    let re: RegExp = /\s*;\s*([\w\-.!%*_+`'~]+)(?:\s*=\s*([\w\-.!%*_+`'~]+|"[^"\\]*(\\.[^"\\]*)*"))?/g;
    for (var r = applyRegex(re, data); r; r = applyRegex(re, data)) {
        hdr.params[r[1].toLowerCase()] = r[2] || null;
    }
    console.log(hdr);
    return hdr;
}

function parseMultiHeader(parser: SIP_Parsers_Function, d: SIP_Message_Headers_Value, h: any) {
    h = h || [];

    let re = /\s*,\s*/g;
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
function parseGenericHeader(d: SIP_Message_Headers_Value, h: string): string {
    return h ? h + ',' + d.s : d.s;
}

export interface SIP_AOR {
    // name?:string;
    // uri?:string|;
    [key: string]: any;
};

/**
 * AOR什么鬼：
 * Address-of-Record（AOR）是一个SIP或SIPS URI，它指向带位置服务的一个域，位置服务可以将一个URI与另一个URI（可能找到用户的URI）映射。典型的，通过注册来填写位置服务。通常认为AOR是用户的“公开地址”。（摘录于：https://www.cnblogs.com/stevensfollower/p/5591017.html ==> 似乎很牛×的帖子）
 * 应该就是这个东东：<sip:41010200001320000001@10.0.1.100:5060>;tag=2024572635
 * 
 *  
 * @param data 
 */
export function parseAOR(data: SIP_Message_Headers_Value): SIP_AOR | undefined {
    var r: RegExpExecArray | undefined = applyRegex(/((?:[\w\-.!%*_+`'~]+)(?:\s+[\w\-.!%*_+`'~]+)*|"[^"\\]*(?:\\.[^"\\]*)*")?\s*\<\s*([^>]*)\s*\>|((?:[^\s@"<]@)?[^\s;]+)/g, data);
    if (r) {
        return parseParams(data, { name: r[1], uri: r[2] || r[3] || '' });
    }
};

export function parseUri(s: string): SIP_URI | undefined {
    if (typeof s === 'object')
        return s;

    var re = /^(sips?):(?:([^\s>:@]+)(?::([^\s@>]+))?@)?([\w\-\.]+)(?::(\d+))?((?:;[^\s=\?>;]+(?:=[^\s?\;]+)?)*)(?:\?(([^\s&=>]+=[^\s&=>]+)(&[^\s&=>]+=[^\s&=>]+)*))?$/;

    var r: RegExpExecArray | null = re.exec(s);

    console.log(r);

    if (r) {
        let ret: any = {
            schema: r[1],// (sips?) ==> sip/sips
            user: r[2],// (?:([^\s>:@]+) ==> 41010200001320000001
            password: r[3],
            host: r[4],
            port: +r[5],
            params: (r[6].match(/([^;=]+)(=([^;=]+))?/g) || [])
                .map(function (s) { return s.split('='); })
                .reduce(function (params: any, x: any) { params[x[0]] = x[1] || null; return params; }, {}),
            headers: ((r[7] || '').match(/[^&=]+=[^&=]+/g) || [])
                .map(function (s) { return s.split('=') })
                .reduce(function (params: any, x: any) { params[x[0]] = x[1]; return params; }, {})
        }


        return ret;
    }
}

function parseAorWithUri(data: SIP_Message_Headers_Value) {
    var r: SIP_AOR | undefined = parseAOR(data);
    if (r) {
        r.uri = parseUri(r.uri);
    }
    return r;
}

export interface SIP_Via {
    // name?:string;
    // uri?:string|;
    [key: string]: any;
};

function parseVia(data: SIP_Message_Headers_Value): SIP_Via | undefined {
    var r: RegExpExecArray | undefined = applyRegex(/SIP\s*\/\s*(\d+\.\d+)\s*\/\s*([\S]+)\s+([^\s;:]+)(?:\s*:\s*(\d+))?/g, data);
    if (r) {
        return parseParams(data, { version: r[1], protocol: r[2], host: r[3], port: r[4] && +r[4] });
    }
}

export interface SIP_CSeq {
    seq: number;
    method: string;
}


function parseCSeq(d: SIP_Message_Headers_Value): SIP_CSeq | undefined {
    var r: RegExpExecArray | null = /(\d+)\s*([\S]+)/.exec(d.s);
    if (r) {
        return { seq: +r[1], method: unescape(r[2]) };
    }
}

function parseAuthHeader(d: SIP_Message_Headers_Value): any {
    var r1: RegExpExecArray | undefined = applyRegex(/([^\s]*)\s+/g, d);
    if (r1) {
        var a: any = { scheme: r1[1] };
        var r2: RegExpExecArray | undefined = applyRegex(/([^\s,"=]*)\s*=\s*([^\s,"]+|"[^"\\]*(?:\\.[^"\\]*)*")\s*/g, d);
        if (r2) {
            a[r2[1]] = r2[2];
            while (r2 = applyRegex(/,\s*([^\s,"=]*)\s*=\s*([^\s,"]+|"[^"\\]*(?:\\.[^"\\]*)*")\s*/g, d)) {
                a[r2[1]] = r2[2];
            }
        }
        return a;
    }
}

function parseAuthenticationInfoHeader(d: SIP_Message_Headers_Value): any {
    let a: any = {};
    let r: RegExpExecArray | undefined = applyRegex(/([^\s,"=]*)\s*=\s*([^\s,"]+|"[^"\\]*(?:\\.[^"\\]*)*")\s*/g, d);
    if (r) {
        a[r[1]] = r[2];
        while (r = applyRegex(/,\s*([^\s,"=]*)\s*=\s*([^\s,"]+|"[^"\\]*(?:\\.[^"\\]*)*")\s*/g, d)) {
            a[r[1]] = r[2];
        }
        return a;
    }
}

/**
* 换头域名称,似乎是兼容性逻辑
*/
interface SIP_CompactFormType {
    [key: string]: string
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

interface SIP_Parsers_Function {
    (d: SIP_Message_Headers_Value, h?: string): any;
}

interface SIP_Parsers_Function_List {
    [key: string]: SIP_Parsers_Function
}

export interface SIP_Parse_UIR {
    user?: string;
}

function parse(data: string): SIP_Message | undefined {
    let regHeadersLine: RegExp = /\r\n(?![ \t])/;
    let data_array = data.split(regHeadersLine);//分行

    if (data_array[0] === '')
        return;

    var m: SIP_Message = { headers: {} };

    if (!(parseResponse(data_array[0], m) || parseRequest(data_array[0], m)))
        return;

    m.headers = {};

    for (let i = 1; i < data_array.length; ++i) {
        let r: RegExpMatchArray | null = data_array[i].match(/^([\S]*?)\s*:\s*([\s\S]*)$/);
        if (!r) {
            return;
        }

        let name = unescape(r[1]).toLowerCase();
        name = compactForm[name] || name;

        console.log(`### parse header[${name}] ###`);
        console.log(`${data_array[i]}`);
        console.log(`#############################`);
        let data:SIP_Message_Headers_Value = { s: r[2], i: 0 };
        try {
            switch (name) {
                case 'to':
                    m.headers[name] = parseAOR({ s: r[2], i: 0 });
                    break;
                case 'from':
                    m.headers[name] = parseAOR({ s: r[2], i: 0 });
                    break;
                case 'contact':
                    {
                        if (data.s === '*')
                            m.headers[name] = data.s;
                        else
                            m.headers[name] = parseMultiHeader(parseAOR, data, m.headers[name]);
                    }
                    break;
                case 'route':
                    m.headers[name] = parseMultiHeader(parseAorWithUri, data, m.headers[name]);
                    break;
                case 'record-route':
                    m.headers[name] = parseMultiHeader(parseAorWithUri, data, m.headers[name]);
                    break;
                case 'path':
                    m.headers[name] = parseMultiHeader(parseAorWithUri, data, m.headers[name]);
                    break;
                case 'cseq':
                    m.headers[name] = parseCSeq(data)
                    break;
                case 'content-length':
                    m.headers[name] = (+data.s)
                    break;
                case 'via':
                    m.headers[name] = parseMultiHeader(parseVia, data, m.headers[name]);
                    break;
                case 'www-authenticate':
                    m.headers[name] = parseMultiHeader(parseAuthHeader, data, m.headers[name]);
                    break;
                case 'proxy-authenticate':
                    m.headers[name] = parseMultiHeader(parseAuthHeader, data, m.headers[name]);
                    break;
                case 'authorization':
                    m.headers[name] = parseMultiHeader(parseAuthHeader, data, m.headers[name]);
                    break;
                case 'proxy-authorization':
                    m.headers[name] = parseMultiHeader(parseAuthHeader, data, m.headers[name]);
                    break;
                case 'authentication-info':
                    m.headers[name] = parseMultiHeader(parseAuthenticationInfoHeader, data, m.headers[name]);
                    break;
                case 'refer-to':
                    m.headers[name] = parseAOR(data);
                    break;

                default:
                    m.headers[name] = parseGenericHeader({ s: r[2], i: 0 }, m.headers[name]);
                    break;
            }
        } catch (error) {
            console.log(error);
        }
        
        console.log(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
        console.log(JSON.stringify(m.headers[name],undefined,"  "));
        console.log(`<<<<<<<<<<<<<<<<<<<<<<<<<<<<<`);
        if(name === 'route') debugger;
    }

    return m;
}

export interface SIP_URI {
    schema: string;
    user: string;
    password: string;
    host: string;
    port: number;
    params?: any;
    headers?: any;
}

export function parseMessage(s: Buffer): SIP_Message | undefined {
    var r: RegExpMatchArray | null = s.toString('binary').match(/^\s*([\S\s]*?)\r\n\r\n([\S\s]*)$/);
    if (r) {
        // console.log(">>>"+r[1]+"<<<");//r[1] 请求行 + 请求头部
        // console.log(">>>"+r[2]+"<<<");//r[2] 请求数据
        var m: SIP_Message | undefined = parse(r[1]);
        if (m) {
            if (m.headers['content-length']) {
                var c: number = Math.max(0, Math.min(m.headers['content-length'], r[2].length));
                m.content = r[2].substring(0, c);
            }
            else {
                m.content = r[2];
            }
            return m;
        }
    }
}