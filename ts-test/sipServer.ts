import { stringify } from "ts-sipMessage";
import { SIP_Server_Options, SIP_Message, SIP_Remote } from "ts-Common";
import { SIP_Server } from "ts-sipServer";

function printfSipMessage(message: any, title: string): void {
    console.log("===================================================================");
    console.log(title);
    console.log("===================================================================");
    console.log(stringify(message));
    console.log("===================================================================");
};

const options:SIP_Server_Options = {
    "port":15061
};

const server = new SIP_Server(options,async (message: SIP_Message, remote: SIP_Remote, stream?: Buffer)=>{
    printfSipMessage(message,"onMessage");
});

console.log(`SIP server start listen port:${options.port}`);

