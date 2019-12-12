import * as dgram from 'dgram';
import * as net from 'net';
import { SIP_Server_Options, SIP_Callback, SIP_Message, SIP_Remote } from 'ts-Common';
import { parseMessage, checkMessage, stringify } from 'ts-sipMessage';

export class SIP_UDP_Transport {
    public readonly protocol: string = 'UDP';
    private socket: dgram.Socket;
    private address: string = "0.0.0.0";
    private port: number = 5060;
    constructor(options: SIP_Server_Options, callback: SIP_Callback) {
        this.port = options.port || this.port;
        this.address = options.address || this.address;
        this.socket = dgram.createSocket(net.isIPv6(this.address) ? 'udp6' : 'udp4', (data: Buffer, rinfo: dgram.RemoteInfo) => {
            console.log("SIP_UDP_Transport[onData]");
            let msg:SIP_Message|undefined = parseMessage(data);
            if (msg && checkMessage(msg)) {
                if (msg.method) {
                    msg.headers.via[0].params.received = rinfo.address;
                    if (msg.headers.via[0].params.hasOwnProperty('rport'))
                        msg.headers.via[0].params.rport = rinfo.port;
                }

                let remote:SIP_Remote = {
                    protocol: this.protocol,
                    port: rinfo.port,
                    address: rinfo.address,
                    local: { address: this.address, port: this.port }
                }
                console.log("SIP_UDP_Transport[callback]");
                callback(msg, remote, data);
            }
        });
        this.socket.bind(this.port, this.address);
    };
    public send(remote: SIP_Remote, message: SIP_Message) {
        let s = stringify(message);
        this.socket.send(Buffer.from(s, 'binary'), 0, s.length, remote.port, remote.address);
    };
    /**
     * 目前仅仅做了UDP，暂时不知道这样的接口意义，需要确定，这种写法可能与其他通讯层保持统一接口用
     * @param remote 
     * @param error 
     */
    public open(_remote: SIP_Remote, error: any): any {
        let self = this;
        let remote = _remote;
        return {
            send: function (message: SIP_Message): void {
                let s = stringify(message);
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