import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { parseMessage, stringify } from '../ts-sipMessage'
import { format, inspect } from 'util'
import { SIP_Message_Headers, SIP_Message } from 'ts-Common';

const filePath = join(__dirname, "./messages/register.dat");
const register: Buffer = readFileSync(filePath);
let register_str = register.toString('binary');
// register_str = register_str.replace(/\n/g,"\r\n");
// register_str = register_str.replace(/3402000000/g,"4101020000");
// writeFileSync(filePath,register_str)

console.log("---------------------------------------------");
console.log(register_str);
console.log("---------------------------------------------");

// console.log({ data: register_str });

let message: SIP_Message | undefined = parseMessage(register);

console.log("---------------------------------------------");
console.log(inspect(message, { compact: true, depth: 5, breakLength: 80 }));
console.log("---------------------------------------------");

if (message) {
    let str_register: string = stringify(message);
    console.log("---------------------------------------------");
    console.log(str_register);
    console.log("---------------------------------------------");
}
