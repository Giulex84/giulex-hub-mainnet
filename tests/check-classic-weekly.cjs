const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript'),{startRedis}=require('./redis-helper.cjs');
(async()=>{const redis=await startRedis();if(!redis)throw Error('Weekly regression requires isolated Redis');try{
let instant='2026-10-12T00:00:00.000Z';class Clock extends Date{constructor(...a){super(...(a.length?a:[instant]));}static now(){return Date.parse(instant)}}
const module={exports:{}},ctx={module,exports:module.exports,process:{env:{UPSTASH_REDIS_REST_URL:'https://redis.test.invalid',UPSTASH_REDIS_REST_TOKEN:'test'}},fetch:redis.fetch,Date:Clock,Math,console};vm.createContext(ctx);vm.runInContext(ts.transpileModule(fs.readFileSync('lib/store.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,ctx);const s=module.exports;
const seed=async(uid,score=1000,level=4)=>redis.command(['SET','arena:game:'+uid,JSON.stringify({score,level,lives:5,updatedAt:'2026-10-11T23:50:00Z'})]);
await seed('first');await s.saveGameState('first',{score:1010,level:4,lives:5});assert.equal((await s.getClassicLeaderboard('first')).ownBest,null);
let board=await s.recordClassicResult('first',5,1040,6);assert.equal(board.ownBest.score,40);assert.equal((await s.getGameState('first')).score,1040);
await Promise.all(Array.from({length:5},()=>s.recordClassicResult('first',5,1040,6)));assert.equal((await s.getClassicLeaderboard('first')).ownBest.score,40);
// Game Over and restart at the same level must not dedupe subsequent earned points.
await s.saveGameState('first',{score:1050,level:5,lives:0});await s.saveGameState('first',{score:1050,level:5,lives:9});await s.saveGameState('first',{score:1070,level:5,lives:9});assert.equal((await s.getClassicLeaderboard('first')).ownBest.score,70);
await s.recordClassicResult('first',6,1100,9);assert.equal((await s.getClassicLeaderboard('first')).ownBest.score,100);
await seed('concurrent');await Promise.all([s.saveGameState('concurrent',{score:1020,level:4,lives:5}),s.recordClassicResult('concurrent',5,1040,6),s.saveGameState('concurrent',{score:1030,level:4,lives:5})]);assert.equal((await s.getGameState('concurrent')).score,1040);assert.equal((await s.getClassicLeaderboard('concurrent')).ownBest.score,40);
// A delayed completion still publishes eligibility after a newer partial save.
await seed('delayed');await s.saveGameState('delayed',{score:1050,level:5,lives:0});assert.equal((await s.recordClassicResult('delayed',5,1040,6)).ownBest.score,50);assert.equal((await s.getGameState('delayed')).lives,0);
// Response loss after atomic commit; cumulative retries cannot grant twice.
await seed('lost');let lose=true;ctx.fetch=async(url,o)=>{let r=await redis.fetch(url,o);if(lose&&JSON.parse(o.body)[0]==='EVAL'){lose=false;throw Error('lost reply')}return r};await assert.rejects(()=>s.recordClassicResult('lost',5,1030,6),/lost reply/);ctx.fetch=redis.fetch;assert.equal((await s.recordClassicResult('lost',5,1030,6)).ownBest.score,30);
await seed('fresh',0,1);assert.equal((await s.recordClassicResult('fresh',2,30,6)).ownBest.score,30);
// Legacy total in current week is not imported and old week is left untouched.
await redis.command(['SET','arena:classic-best:2026-10-05:first',JSON.stringify({level:4,score:1000})]);await redis.command(['ZADD','arena:classic-leaderboard:2026-10-05',1000004,'first']);
await redis.command(['SET','arena:classic-best:2026-10-12:first',JSON.stringify({level:6,score:1100})]);assert.equal((await s.getClassicLeaderboard('first')).ownBest.score,100);
assert.equal((await s.getClassicLeaderboard('first','2026-10-05')).ownBest.score,1000);
instant='2026-10-18T23:59:59.999Z';assert.equal((await s.getClassicLeaderboard('first')).week,'2026-10-12');instant='2026-10-19T00:00:00Z';assert.equal((await s.getClassicLeaderboard('first')).ownBest,null);await s.recordClassicResult('first',7,1120,9);assert.equal((await s.getClassicLeaderboard('first')).ownBest.score,20);assert.equal((await s.getClassicLeaderboard('first','2026-10-12')).ownBest.score,100);assert.equal((await s.getGameState('first')).score,1120);
// Fresh VM demonstrates persistent totals survive server restart.
const m2={exports:{}},c2={...ctx,module:m2,exports:m2.exports};vm.createContext(c2);vm.runInContext(ts.transpileModule(fs.readFileSync('lib/store.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,c2);assert.equal((await m2.exports.getClassicLeaderboard('first')).ownBest.score,20);
await redis.command(['SET','arena:game:corrupt','invalid']);await assert.rejects(()=>s.saveGameState('corrupt',{score:10,level:1,lives:5}),/review/);assert.equal(await redis.command(['GET','arena:game:corrupt']),'invalid');
await assert.rejects(()=>s.recordClassicResult('first',99,1130,5),/progression/);
// API auth boundary and save/load integration against isolated Redis.
const apiCtx={require:p=>p==='crypto'?require('crypto'):p.endsWith('/pi')?{arenaSessionFromRequest:req=>req.headers?.['x-arena-session'],bearerFromRequest:req=>req.headers?.authorization? 'test-token':null,verifyAccessToken:async()=>({uid:'api-weekly'}),verifyArenaSession:()=>({uid:'api-weekly'})}:p.endsWith('/metrics')?{safeRecordMetric:async()=>true}:s,Date:Clock,Math,Set};vm.createContext(apiCtx);vm.runInContext(fs.readFileSync('pages/api/game-state.ts','utf8').replace('export default async function handler','async function handler'),apiCtx);
async function request(body,authenticated=true){const res={setHeader(){},status(n){this.code=n;return this},json(v){this.data=v;return this}};await apiCtx.handler({method:'POST',headers:authenticated?{authorization:'Bearer test'}:{},body},res);return res}
assert.equal((await request({action:'load'},false)).code,401);await seed('api-weekly');assert.equal((await request({action:'save',state:{score:1020,level:4,lives:5}})).code,200);const completed=await request({action:'classic-complete',score:1040,level:5,lives:6});assert.equal(completed.code,200);assert.equal(completed.data.ownBest.score,40);const loaded=await request({action:'load'});assert.equal(loaded.data.state.score,1040);assert.equal(loaded.data.state.level,5);
// Invalid ranking type must fail before any state mutation (Lua has no rollback).
await seed('type-failure');const before=await redis.command(['GET','arena:game:type-failure']);await redis.command(['SET','arena:classic-weekly-board-v2:2026-10-19','bad']);await assert.rejects(()=>s.recordClassicResult('type-failure',5,1020,6),/review/);assert.equal(await redis.command(['GET','arena:game:type-failure']),before);await redis.command(['DEL','arena:classic-weekly-board-v2:2026-10-19']);
// Inline scripts remain parseable, and saves/completions share one serialized queue.
const html=fs.readFileSync('public/arena.html','utf8');for(const x of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(x[1]);assert.match(html,/classicSaveQueue\.then/);assert.match(html,/queueClassicProgress\(true\)/);
console.log('Weekly Classic: first game, partial saves, replay, concurrency, Game Over, response loss, historical preservation, UTC rollover and persistence passed.');
}finally{await redis.stop()}})().catch(e=>{console.error(e);process.exitCode=1});
