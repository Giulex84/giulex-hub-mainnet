import crypto from "crypto";
import {getServerApiKey} from "./pi";
import {recordMetric,recordSummitMetric} from "./store";
// Temporary, server-verified Daily measurement ends automatically on November 20 (Rome).
export async function safeRecordMetric(uid,event,dedupeId='',value=0,eventDay=new Date().toISOString().slice(0,10)){
 if(!uid||!['login','daily_started','daily_completed','daily_failed'].includes(event))return false;
 try{const secret=getServerApiKey();if(!secret)return false;
 const subject=crypto.createHmac('sha256',secret).update(`user:${uid}`).digest('hex');
 let measured=false;
 try{measured=await recordSummitMetric(eventDay,subject,event)}catch{}
 return event==='login'?await recordMetric(eventDay,subject,'login'):measured;
 }catch{return false;}
}
