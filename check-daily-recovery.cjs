const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const events=new Set();let state,streak=0;
const store={isStoreConfigured:()=>true,getDailyChallenge:async()=>state,recordDailyResult:async()=>({moves:6,score:100}),recordDailyCompletion:async()=>{streak=1},getDailyMeta:async()=>({streak:{count:streak}})};
const ctx={require:p=>p==='crypto'?require('crypto'):p.endsWith('/pi')?{arenaSessionFromRequest:()=>null,bearerFromRequest:()=> 'token',verifyAccessToken:async()=>({uid:'tester'})}:p.endsWith('/metrics')?{safeRecordMetric:async(uid,event,id)=>events.add(event+':'+id)}:store,Date,Math,Set};vm.createContext(ctx);vm.runInContext(fs.readFileSync('pages/api/game-state.ts','utf8').replace('export default async function handler','async function handler'),ctx);
async function status(){const res={setHeader(){},status(n){this.code=n;return this},json(d){this.data=d;return this}};await ctx.handler({method:'POST',body:{action:'daily-status'}},res);assert.equal(res.code,200);return res.data}
(async()=>{state={day:'2026-10-07',status:'completed',deck:['a','a'],matched:[0,1],firstIndex:null,moves:6,score:100,startedAt:'2026-10-07T07:00:00Z',completedAt:'2026-10-07T07:01:00Z'};let d=await status();assert.equal(d.meta.streak.count,1);assert.equal(events.size,1);await status();assert.equal(events.size,1);state={...state,status:'failed'};await status();assert.equal(events.size,2);state={...state,status:'active'};await status();assert.equal(events.size,2);console.log('Daily recovery: reconciled streak, stable dedupe ID, completed/failed/active passed.');
for(const p of ['public/arena.html','public/admin.html'])new Function(fs.readFileSync(p,'utf8').match(/<script>\s*([\s\S]*?)<\/script>/)[1]);
const html=fs.readFileSync('public/arena.html','utf8'),els=new Map();function el(id){if(!els.has(id))els.set(id,{style:{},textContent:'',classList:{add(){},remove(){},toggle(){}},appendChild(){}});return els.get(id)}
const ui={document:{getElementById:el,querySelectorAll:()=>[],createElement:()=>el(Math.random()),querySelector:()=>el('query')},URLSearchParams,location:{search:''},window:{},console,Pi:{init(){}},navigator:{},setTimeout,clearTimeout,AbortController};vm.createContext(ui);const script=[...html.matchAll(/<script>\s*([\s\S]*?)<\/script>/g)].at(-1)[1];vm.runInContext(script+';globalThis.test={set:s=>{dailyState=s},spot:updateDailySpotlight};',ui);ui.test.set({status:'completed',score:100});ui.test.spot(1);assert.equal(el('openDaily').textContent,'PLAY CLASSIC');ui.test.set({status:'failed'});ui.test.spot();assert.match(el('dailySpotlightTitle').textContent,/limit/);ui.test.set({status:'active',matches:2});ui.test.spot();assert.equal(el('openDaily').textContent,'CONTINUE');console.log('Daily next actions passed.');
ui.test.set(null);vm.runInContext('api=async()=>{throw new Error("offline")};',ui);
await ui.restoreDailyAfterError(new Error('lost response'));
assert.equal(vm.runInContext('dailyNeedsSync',ui),true);
vm.runInContext('api=async(path,body)=>body.action==="daily-status"?{daily:null,meta:{}}:{leaders:[]};',ui);
await ui.restoreDailyAfterError(new Error('lost response'));
assert.equal(vm.runInContext('dailyNeedsSync',ui),false);
console.log('Uncertain response: failed recovery blocks moves; successful reload clears the block.');
})().catch(e=>{console.error(e);process.exitCode=1});
