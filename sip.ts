export interface SIP_Start_Options{
    logger?:object;
    port?:number;
    publicAddress?:string;
} 

export interface SIP_Remote{
    protocol:string;
    address:string;
    prot:number;
}

export interface SIP_Message{
    method?:string;
    uri?:string;
    version?:string;
    headers?:object;
    content?:string;
}

export interface SIP_Parse_UIR{
    user?:string;
}

export function Start(options:SIP_Start_Options, onRequest?:(request:SIP_Message,remote:SIP_Remote)=>{}):void {
    
    // var r = exports.create(options, callback);
    // exports.send = r.send;
    // exports.stop = r.destroy;
    // exports.encodeFlowUri = r.encodeFlowUri;
    // exports.decodeFlowUri = r.decodeFlowUri;
    // exports.isFlowUri = r.isFlowUri;
    // exports.hostname = r.hostname;
}