// @ts-nocheck
function config() {
  const url = process.env.ARENA_KV_KV_REST_API_URL || process.env.ARENA_KV_REDIS_URL || process.env.ARENA_KV_REST_URL || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.ARENA_KV_KV_REST_API_TOKEN || process.env.ARENA_KV_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

function isStoreConfigured() { return Boolean(config()); }

async function command(parts) {
  const cfg = config();
  if (!cfg) throw new Error("Persistent store is not configured");
  const response = await fetch(cfg.url, { method: "POST", headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" }, body: JSON.stringify(parts), cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.error) throw new Error(payload?.error || "Store request failed");
  return payload?.result;
}

const premiumKey = (uid) => `arena:premium:${uid}`;
const paymentKey = (paymentId) => `arena:payment:${paymentId}`;
const gameStateKey = (uid) => `arena:game:${uid}`;
const dailyKey = (uid, day) => `arena:daily:${day}:${uid}`;
const dailyLockKey = (uid, day) => `arena:daily-lock:${day}:${uid}`;
const replayCreditsKey = (uid) => `arena:daily-replay-credits:${uid}`;
const replayFulfilledKey = (paymentId) => `arena:daily-replay-fulfilled:${paymentId}`;
const profileKey = (uid) => `arena:profile:${uid}`;
const dailyAttemptsKey = (uid,day) => `arena:daily-attempts:${day}:${uid}`;
const dailyBestKey = (uid,day) => `arena:daily-best:${day}:${uid}`;
const dailyLeaderboardKey = (day) => `arena:daily-leaderboard:${day}`;
const pvpMatchKey = (id) => `arena:pvp:match:${id}`;
const pvpUserKey = (uid) => `arena:pvp:user:${uid}`;
const pvpQueueKey = "arena:pvp:queue";
const pvpLockKey = "arena:pvp:matchmaking-lock";
const pvpMatchLockKey = (id) => `arena:pvp:lock:${id}`;
const metricsUniqueKey = (day) => `arena:metrics:unique:${day}`;
const metricsEventsKey = (day) => `arena:metrics:events:${day}`;
const metricsDedupeKey = (id) => `arena:metrics:dedupe:${id}`;

async function hasPremium(uid) { if (!isStoreConfigured()) return false; return (await command(["GET", premiumKey(uid)])) === "1"; }
async function claimPayment(uid, paymentId) { const key=paymentKey(paymentId), created=await command(["SET",key,uid,"NX"]); if(created==="OK")return true; const existing=await command(["GET",key]); if(existing!==uid)throw new Error("Payment already belongs to another user"); return false; }
async function grantPremium(uid,paymentId){await claimPayment(uid,paymentId);await command(["SET",premiumKey(uid),"1"]);}

async function getGameState(uid){if(!isStoreConfigured())return null;const raw=await command(["GET",gameStateKey(uid)]);if(!raw)return null;try{const p=JSON.parse(raw);return{level:Number(p.level)||1,lives:Number.isFinite(Number(p.lives))?Number(p.lives):5,score:Number(p.score)||0,updatedAt:p.updatedAt||null};}catch{return null;}}
async function saveGameState(uid,state){const level=Math.max(1,Math.min(100,Math.trunc(Number(state?.level)||1))),lives=Math.max(0,Math.min(999,Math.trunc(Number(state?.lives)||0))),score=Math.max(0,Math.min(1000000000,Math.trunc(Number(state?.score)||0)));const value=JSON.stringify({level,lives,score,updatedAt:new Date().toISOString()});await command(["SET",gameStateKey(uid),value]);return{level,lives,score};}

async function getDailyChallenge(uid,day){const raw=await command(["GET",dailyKey(uid,day)]);if(!raw)return null;try{return JSON.parse(raw);}catch{return null;}}
async function saveDailyChallenge(uid,day,state){await command(["SET",dailyKey(uid,day),JSON.stringify(state),"EX",259200]);return state;}
async function acquireDailyLock(uid,day){const id=`${Date.now()}:${Math.random().toString(36).slice(2)}`;const ok=await command(["SET",dailyLockKey(uid,day),id,"NX","EX",10]);if(ok!=="OK")throw new Error("Daily challenge request already in progress");return id;}
async function releaseDailyLock(uid,day,id){const script='if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end';await command(["EVAL",script,1,dailyLockKey(uid,day),id]);}
async function flipDailyCard(uid,day,index,maxMoves){
  const script=`
local raw=redis.call("GET",KEYS[1])
if not raw then return cjson.encode({error="Start today's challenge first",code=409}) end
local daily=cjson.decode(raw)
if daily.status~="active" then return cjson.encode({daily=daily}) end
local idx=tonumber(ARGV[1])
if not idx or idx<0 or idx>=#daily.deck then return cjson.encode({error="Invalid card",code=400}) end
for _,matchedIndex in ipairs(daily.matched) do if tonumber(matchedIndex)==idx then return cjson.encode({error="Card is already visible",code=409}) end end
if daily.firstIndex~=cjson.null and tonumber(daily.firstIndex)==idx then return cjson.encode({error="Card is already visible",code=409}) end
local value=daily.deck[idx+1]
local reveal={index=idx,value=value,pending=true}
if daily.firstIndex==cjson.null then
  daily.firstIndex=idx
else
  local firstIndex=tonumber(daily.firstIndex)
  local firstValue=daily.deck[firstIndex+1]
  local isMatch=firstValue==value
  daily.firstIndex=cjson.null
  daily.moves=(tonumber(daily.moves) or 0)+1
  if isMatch then
    table.insert(daily.matched,firstIndex)
    table.insert(daily.matched,idx)
    daily.score=(tonumber(daily.score) or 0)+math.max(20,120-daily.moves*4)
  end
  if #daily.matched==#daily.deck then
    daily.status="completed"
    daily.score=daily.score+math.max(0,(tonumber(ARGV[2])-daily.moves)*25)
    daily.completedAt=ARGV[3]
  elseif daily.moves>=tonumber(ARGV[2]) then
    daily.status="failed"
    daily.completedAt=ARGV[3]
  end
  reveal={index=idx,value=value,firstIndex=firstIndex,firstValue=firstValue,matched=isMatch,pending=false}
end
redis.call("SET",KEYS[1],cjson.encode(daily),"EX",259200)
return cjson.encode({daily=daily,reveal=reveal})`;
  const raw=await command(["EVAL",script,1,dailyKey(uid,day),index,maxMoves,new Date().toISOString()]);
  const result=JSON.parse(raw);
  if(result?.error){const error=new Error(result.error);error.statusCode=Number(result.code)||409;throw error;}
  return result;
}
async function getReplayCredits(uid){return Math.max(0,Number((await command(["GET",replayCreditsKey(uid)]))||0));}
async function grantReplayCredit(uid,paymentId){await claimPayment(uid,paymentId);const created=await command(["SET",replayFulfilledKey(paymentId),uid,"NX"]);if(created==="OK")await command(["INCR",replayCreditsKey(uid)]);else{const owner=await command(["GET",replayFulfilledKey(paymentId)]);if(owner!==uid)throw new Error("Replay fulfillment belongs to another user");}return getReplayCredits(uid);}
async function consumeReplayCredit(uid){const count=await getReplayCredits(uid);if(count<1)throw new Error("A Daily Replay Ticket is required");await command(["DECR",replayCreditsKey(uid)]);return count-1;}
async function saveProfile(uid,username){const value=JSON.stringify({uid,username:typeof username==="string"?username.slice(0,64):null});await command(["SET",profileKey(uid),value]);}
async function recordDailyAttempt(uid,day){const count=Number(await command(["INCR",dailyAttemptsKey(uid,day)]));if(count===1)await command(["EXPIRE",dailyAttemptsKey(uid,day),259200]);return count;}
async function getDailyBest(uid,day){const raw=await command(["GET",dailyBestKey(uid,day)]);if(!raw)return null;try{return JSON.parse(raw);}catch{return null;}}
function isBetterDailyResult(next,current){return!current||next.moves<current.moves||(next.moves===current.moves&&next.score>current.score);}
async function recordDailyResult(uid,day,result){const next={moves:Math.max(0,Math.trunc(Number(result.moves)||0)),score:Math.max(0,Math.trunc(Number(result.score)||0)),completedAt:new Date().toISOString()};const current=await getDailyBest(uid,day),best=isBetterDailyResult(next,current)?next:current;if(best===next)await command(["SET",dailyBestKey(uid,day),JSON.stringify(best),"EX",259200]);const rank=best.moves*1000000-best.score;await command(["ZADD",dailyLeaderboardKey(day),rank,uid]);await command(["EXPIRE",dailyLeaderboardKey(day),259200]);return best;}
async function getDailyMeta(uid,day){const[attempts,best]=await Promise.all([command(["GET",dailyAttemptsKey(uid,day)]),getDailyBest(uid,day)]);return{attempts:Math.max(0,Number(attempts)||0),best};}
async function getDailyLeaderboard(uid,day){const ids=await command(["ZRANGE",dailyLeaderboardKey(day),0,9]),list=Array.isArray(ids)?ids:[];if(!list.length)return{leaders:[],position:null};const keys=[];for(const id of list)keys.push(profileKey(id),dailyBestKey(id,day));const values=await command(["MGET",...keys]);const leaders=list.map((id,index)=>{let profile=null,best=null;try{profile=values?.[index*2]?JSON.parse(values[index*2]):null;}catch{}try{best=values?.[index*2+1]?JSON.parse(values[index*2+1]):null;}catch{}return{rank:index+1,username:profile?.username||"Pioneer",moves:best?.moves||0,score:best?.score||0};});const ownRank=await command(["ZRANK",dailyLeaderboardKey(day),uid]);return{leaders,position:ownRank===null?null:Number(ownRank)+1};}
async function getPvpMatch(id){if(!id)return null;const raw=await command(["GET",pvpMatchKey(id)]);if(!raw)return null;try{return JSON.parse(raw);}catch{return null;}}
async function savePvpMatch(match){await command(["SET",pvpMatchKey(match.id),JSON.stringify(match),"EX",172800]);return match;}
async function getUserPvpMatch(uid){const id=await command(["GET",pvpUserKey(uid)]);return id?getPvpMatch(id):null;}
async function setUserPvpMatch(uid,id){await command(["SET",pvpUserKey(uid),id,"EX",172800]);}
async function clearUserPvpMatch(uid){await command(["DEL",pvpUserKey(uid)]);}
async function getPvpQueue(){const raw=await command(["GET",pvpQueueKey]);if(!raw)return null;try{return JSON.parse(raw);}catch{return null;}}
async function setPvpQueue(value){await command(["SET",pvpQueueKey,JSON.stringify(value),"EX",3600]);}
async function clearPvpQueue(id){const script='local v=redis.call("GET",KEYS[1]); if not v then return 0 end; local ok,obj=pcall(cjson.decode,v); if ok and obj["matchId"]==ARGV[1] then return redis.call("DEL",KEYS[1]) end; return 0';await command(["EVAL",script,1,pvpQueueKey,id]);}
async function acquirePvpLock(){const id=`${Date.now()}:${Math.random().toString(36).slice(2)}`,ok=await command(["SET",pvpLockKey,id,"NX","EX",10]);if(ok!=="OK")throw new Error("Matchmaking is busy. Retry shortly.");return id;}
async function releasePvpLock(id){const script='if redis.call("GET",KEYS[1]) == ARGV[1] then return redis.call("DEL",KEYS[1]) else return 0 end';await command(["EVAL",script,1,pvpLockKey,id]);}
async function acquirePvpMatchLock(matchId){const id=`${Date.now()}:${Math.random().toString(36).slice(2)}`,ok=await command(["SET",pvpMatchLockKey(matchId),id,"NX","EX",10]);if(ok!=="OK")throw new Error("PvP move already in progress");return id;}
async function releasePvpMatchLock(matchId,id){const script='if redis.call("GET",KEYS[1]) == ARGV[1] then return redis.call("DEL",KEYS[1]) else return 0 end';await command(["EVAL",script,1,pvpMatchLockKey(matchId),id]);}
async function flipPvpCard(uid,index,maxMoves){
  const script=`
local matchId=redis.call("GET",KEYS[1])
if not matchId then return cjson.encode({error="Start a PvP match first",code=409}) end
local matchKey=ARGV[1]..matchId
local raw=redis.call("GET",matchKey)
if not raw then return cjson.encode({error="PvP match not found",code=404}) end
local match=cjson.decode(raw)
if match.status=="waiting" then return cjson.encode({error="Waiting for an opponent or choose Arena Bot",code=409}) end
local player=nil
for _,candidate in ipairs(match.players) do if candidate.uid==ARGV[2] then player=candidate break end end
if not player then return cjson.encode({error="PvP player not found",code=404}) end
if player.status~="active" then return cjson.encode({match=match}) end
local idx=tonumber(ARGV[3])
if not idx or idx<0 or idx>=#match.deck then return cjson.encode({error="Invalid card",code=400}) end
for _,matchedIndex in ipairs(player.matched) do if tonumber(matchedIndex)==idx then return cjson.encode({error="Card is already visible",code=409}) end end
if player.firstIndex~=cjson.null and tonumber(player.firstIndex)==idx then return cjson.encode({error="Card is already visible",code=409}) end
local value=match.deck[idx+1]
local reveal={index=idx,value=value,pending=true}
if player.firstIndex==cjson.null then
  player.firstIndex=idx
else
  local firstIndex=tonumber(player.firstIndex)
  local firstValue=match.deck[firstIndex+1]
  local isMatch=firstValue==value
  player.firstIndex=cjson.null
  player.moves=(tonumber(player.moves) or 0)+1
  if isMatch then
    table.insert(player.matched,firstIndex)
    table.insert(player.matched,idx)
    player.score=(tonumber(player.score) or 0)+math.max(20,120-player.moves*4)
  end
  if #player.matched==#match.deck then
    player.status="completed"
    player.score=player.score+math.max(0,(tonumber(ARGV[4])-player.moves)*25)
  elseif player.moves>=tonumber(ARGV[4]) then player.status="failed" end
  if #match.players==2 and match.players[1].status~="active" and match.players[2].status~="active" then match.status="completed" end
  reveal={index=idx,value=value,firstIndex=firstIndex,firstValue=firstValue,matched=isMatch,pending=false}
end
redis.call("SET",matchKey,cjson.encode(match),"EX",172800)
return cjson.encode({match=match,reveal=reveal})`;
  const raw=await command(["EVAL",script,1,pvpUserKey(uid),"arena:pvp:match:",uid,index,maxMoves]);
  const result=JSON.parse(raw);
  if(result?.error){const error=new Error(result.error);error.statusCode=Number(result.code)||409;throw error;}
  return result;
}

async function markPaymentPending(uid,paymentId){await claimPayment(uid,paymentId);}
async function recordMetric(day,subject,event,dedupeId=""){
  const script=`
if ARGV[3]~="" then
  local created=redis.call("SET",KEYS[3],"1","NX","EX",ARGV[4])
  if not created then return 0 end
end
redis.call("PFADD",KEYS[1],ARGV[1])
redis.call("EXPIRE",KEYS[1],ARGV[4])
redis.call("HINCRBY",KEYS[2],ARGV[2],1)
redis.call("EXPIRE",KEYS[2],ARGV[4])
return 1`;
  return Number(await command(["EVAL",script,3,metricsUniqueKey(day),metricsEventsKey(day),metricsDedupeKey(dedupeId||"none"),subject,event,dedupeId,34560000]))===1;
}
async function getMetricsReport(days){
  const count=Math.max(1,Math.min(90,Math.trunc(Number(days)||30))),keys=[],labels=[];
  for(let offset=0;offset<count;offset++){const date=new Date(Date.now()-offset*86400000).toISOString().slice(0,10);labels.push(date);keys.push(metricsUniqueKey(date),metricsEventsKey(date));}
  const script=`local out={}; for i=1,#KEYS,2 do local unique=redis.call("PFCOUNT",KEYS[i]); local events=redis.call("HGETALL",KEYS[i+1]); table.insert(out,{unique=unique,events=events}) end; return cjson.encode(out)`;
  const rows=JSON.parse(await command(["EVAL",script,keys.length,...keys]));
  return labels.map((day,index)=>{const pairs=rows[index]?.events||[],events={};for(let i=0;i<pairs.length;i+=2)events[pairs[i]]=Number(pairs[i+1])||0;return{day,uniqueUsers:Number(rows[index]?.unique)||0,events};});
}
export {isStoreConfigured,hasPremium,claimPayment,grantPremium,getGameState,saveGameState,getDailyChallenge,saveDailyChallenge,acquireDailyLock,releaseDailyLock,flipDailyCard,getReplayCredits,grantReplayCredit,consumeReplayCredit,saveProfile,recordDailyAttempt,getDailyBest,recordDailyResult,getDailyMeta,getDailyLeaderboard,getPvpMatch,savePvpMatch,getUserPvpMatch,setUserPvpMatch,clearUserPvpMatch,getPvpQueue,setPvpQueue,clearPvpQueue,acquirePvpLock,releasePvpLock,acquirePvpMatchLock,releasePvpMatchLock,flipPvpCard,markPaymentPending,recordMetric,getMetricsReport};
