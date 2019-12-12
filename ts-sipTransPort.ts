
import { SIP_Logger_Send, SIP_Logger_Recv, SIP_Message, SIP_Remote, SIP_Callback, SIP_Server_Options } from "ts-Common";
import { SIP_UDP_Transport } from "ts-sipUdpTransPort";

export interface SIP_Transport_Protocols {
    UDP?: SIP_UDP_Transport;//TODO
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
            callbackAndLog = (message: SIP_Message, remote: SIP_Remote, stream?: Buffer) => {
                console.log("SIP_Transport with recvLog[onData]");
                this.recvLog(message, remote);
                console.log("SIP_Transport with recvLog[callback]");
                callback(message, remote, stream);
            };
        }
        this.protocols.UDP = new SIP_UDP_Transport(options,callbackAndLog);
    }
}