import crypto from "crypto";
import {getServerApiKey} from "./pi";
import {recordMetric} from "./store";
// Only successful Mainnet sign-ins are measured. All other calls are no-ops.
export async function safeRecordMetric(uid,event,dedupeId='',value=0,eventDay=new Date().toISOString().slice(0,10)){
 if(!uid||event!=='login')return false;
 try{const secret=getServerApiKey();if(!secret)return false;
 const subject=crypto.createHmac('sha256',secret).update(`user:${uid}`).digest('hex');
 return await recordMetric(eventDay,subject,'login');
 }catch{return false;}
}
