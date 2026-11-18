const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require('typescript'),{startRedis}=require('./redis-helper.cjs');
(async()=>{
 const redis=await startRedis();
 assert(redis,'Real isolated Redis is required');
 try{
  let now='2026-11-18T12:00:00Z';
  class Clock extends Date{
   constructor(...args){super(...(args.length?args:[now]))}
   static now(){return Date.parse(now)}
  }
  const module={exports:{}};
  const context={module,exports:module.exports,Date:Clock,Math,console,fetch:redis.fetch,
   process:{env:{UPSTASH_REDIS_REST_URL:'https://redis.test.invalid',UPSTASH_REDIS_REST_TOKEN:'test'}}};
  vm.createContext(context);
  vm.runInContext(ts.transpileModule(fs.readFileSync('lib/store.ts','utf8'),
   {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,context);
  const store=module.exports,day='2026-11-18';
  await Promise.all(Array.from({length:12},()=>store.recordSummitMetric(day,'a','daily_started')));
  await store.recordSummitMetric(day,'b','daily_started');
  await store.recordSummitMetric(day,'a','daily_completed');
  await store.recordSummitMetric(day,'a','daily_completed');
  await store.recordSummitMetric(day,'old-unmeasured-start','daily_completed');
  await store.recordSummitMetric(day,'b','daily_failed');
  await store.recordSummitMetric(day,'a','login');
  await redis.command(['SET','arena:game:preserved','keep']);
  const report=await store.getSummitReport(),row=report.rows.find(row=>row.day===day);
  assert.equal(row.daily_started,2);
  assert.equal(row.daily_completed,2);
  assert.equal(row.measuredCompletions,1);
  assert.equal(row.measuredFailures,1);
  assert.equal(row.login,1);
  assert(report.startedAt);
  const key='arena:summit-20261117:'+day+':daily_started';
  assert((await redis.command(['TTL',key]))>0);
  assert((await redis.command(['TTL',key]))<=7776000);
  assert.equal(await store.recordSummitMetric(day,'ignore','pvp_completed'),false);
  now='2026-11-20T22:59:59Z';
  assert.equal(await store.recordSummitMetric('2026-11-20','last','daily_started'),true);
  now='2026-11-20T23:00:00Z';
  assert.equal(await store.recordSummitMetric('2026-11-20','late','daily_started'),false);
  assert.equal(await redis.command(['GET','arena:game:preserved']),'keep');
  console.log('Summit Redis: concurrent dedupe, matched outcomes, retention, cutoff and preserved progress passed.');
 }finally{await redis.stop()}
})().catch(error=>{console.error(error);process.exitCode=1});
