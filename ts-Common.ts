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

export interface SIP_Message_Headers {
    [key: string]: any;
}

export interface SIP_Remote {
    protocol: string;
    address: string;
    port: number;
    local: any;
}

export interface SIP_Callback {
    (message: SIP_Message, remote: SIP_Remote, stream?: Buffer): void;
}

export interface SIP_URI {
    schema?: string;
    user?: string;
    password?: string;
    host?: string;
    port?: number;
    params?: any;
    headers?: any;
}

export interface SIP_Message {
    method?: string;//req
    uri?: string|SIP_URI;//req
    version?: string;//req/res
    status?: number;//res
    reason?: string;//res
    headers: SIP_Message_Headers;
    content?: string;
    [key: string]: any;
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