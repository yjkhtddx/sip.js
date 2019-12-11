import * as dgram from 'dgram';
// import {SocketType} from 'dgram'
import * as net from 'net';
import {SIP_Message} from './ts-parseMessage'

export function stringify(message: SIP_Message): string {
    //TODO
    return "";
}

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