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

export declare function start(option:SIP_Start_Options,callback?:(request:any,remote:SIP_Remote)=>void):void;

export declare function stringify(message:SIP_Message):string;
export declare function parseUri(uri:string):object;


