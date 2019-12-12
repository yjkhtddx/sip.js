import { SIP_Logger_Error, SIP_Logger_Send, SIP_Logger_Recv, SIP_Message, SIP_Remote, SIP_Callback, SIP_Server_Options } from "ts-Common";
import { SIP_Transport } from "ts-sipTransPort";


export class SIP_Server {
    private errorLog: SIP_Logger_Error = (error: Error) => { };
    private sendLog: SIP_Logger_Send = (message: SIP_Message, target: any) => { };
    private recvLog: SIP_Logger_Recv = (message: SIP_Message, remote: SIP_Remote) => { };
    private transport: SIP_Transport;
    constructor(options: SIP_Server_Options, callback: SIP_Callback) {
        if (options.logger && options.logger.error) {
            this.errorLog = options.logger.error;
        }
        let _callback = callback;
        this.transport = this.makeTransport(options, (message: SIP_Message, remote: SIP_Remote) => {
            console.log("SIP_Server [onData]");
            _callback(message,remote);
            // try {
            //     let t = message.method ? transaction.getServer(message) : transaction.getClient(message);
            //     if(!t) {
            //       if(message.method && message.method !== 'ACK') {
            //         let t = transaction.createServerTransaction(message, transport.get(remote));
            //         try {
            //           callback(m,remote);
            //         } catch(e) {
            //           t.send(makeResponse(m, '500', 'Internal Server Error'));
            //           throw e;
            //         } 
            //       }
            //       else if(message.method === 'ACK') {
            //         callback(m,remote);
            //       }
            //     }
            //     else {
            //       t.message && t.message(m, remote);
            //     }
            // } catch (error) {
            //     this.errorLog(error);
            // }
        });
    };
    public send(message: SIP_Message, callback?: SIP_Callback): number {
        this.sendLog(message, "address");
        return 200;
    };
    public makeTransport(options: SIP_Server_Options, callback: SIP_Callback): any {
        this.transport = new SIP_Transport(options,callback); 
    }
}