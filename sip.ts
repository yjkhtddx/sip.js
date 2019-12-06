
export interface SIP_Message{
    method?:string;
    uri?:string;
    version?:string;
    headers?:object;
    content?:string;
}

export interface SIP_Remote{
    protocol:string;
    address:string;
    prot:number;
}

export interface SIP_Logger_Error{
    (error:Error):void
}

export interface SIP_Logger_Send{
    (message:SIP_Message,target:any):void
}

export interface SIP_Logger_Recv{
    (message:SIP_Message,remote:SIP_Remote):void
}

export interface SIP_Callback{
    (message:SIP_Message,remote:SIP_Remote,stream:Buffer):void;
}

export interface SIP_Server_Loggers{
    error?:SIP_Logger_Error;
    send?:SIP_Logger_Send;
    recv?:SIP_Logger_Recv;
}

export interface SIP_Server_Options{
    logger?:SIP_Server_Loggers;
    address?:string;//默认0.0.0.0
    port?:number;//默认5060
    publicAddress?:string;
    hostname?:string;
} 


export interface SIP_Parse_UIR{
    user?:string;
}

export interface SIP_Transport_Protocols{
    UDP?:any;//TODO
    TCP?:any;//TODO
    TLS?:any;//TODO
    WS?:any;//TODO
}

export class SIP_Transport
{
    private sendLog:SIP_Logger_Send = (message:SIP_Message,target:any)=>{};
    private recvLog:SIP_Logger_Recv = (message:SIP_Message,remote:SIP_Remote)=>{};
    private protocols:SIP_Transport_Protocols = {};
    constructor(options:SIP_Server_Options,callback:SIP_Callback)
    {
        let callbackAndLog:SIP_Callback = callback;
        if(options.logger && options.logger.recv){
            callbackAndLog = (message:SIP_Message,remote:SIP_Remote,stream:Buffer)=>{
                this.recvLog(message,remote);
                callback(message,remote,stream);
            }
        }
        
    }
}

export class SIP_Server
{
    private errorLog:SIP_Logger_Error = (error:Error)=>{};
    private sendLog:SIP_Logger_Send = (message:SIP_Message,target:any)=>{};
    private recvLog:SIP_Logger_Recv = (message:SIP_Message,remote:SIP_Remote)=>{};
    private transport:any;
    constructor(options:SIP_Server_Options,callback?:SIP_Callback)
    {
        if(options.logger && options.logger.error){
            this.errorLog = options.logger.error;
        }
        this.transport = this.makeTransport(options, (message:SIP_Message,remote:SIP_Remote)=>{
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
              } catch(error) {
                this.errorLog(error);
              }
        });
    };
    public send(message:SIP_Message,callback?:SIP_Callback):number{
        this.sendLog(message,"address");
        return 200;
    };
    public makeTransport(options:SIP_Server_Options,callback:SIP_Callback):any{
        
    }
}