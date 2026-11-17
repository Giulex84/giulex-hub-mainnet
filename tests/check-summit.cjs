const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const source=fs.readFileSync('lib/store.ts','utf8');
const code=source.slice(source.indexOf('async function recordSummitMetric'),source.indexOf('export {recordSummitMetric'));
let now=Date.parse('2026-11-18T12:00:00Z'),calls=0;
class Clock extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}}
const context={Date:Clock,command:async()=>{calls++;return 1}};
vm.createContext(context);vm.runInContext(code,context);
(async()=>{
assert.equal(await context.recordSummitMetric('2026-11-18','hashed-user','daily_started'),true);
assert.equal(await context.recordSummitMetric('2026-11-18','hashed-user','premium_purchased'),false);
assert.equal(await context.recordSummitMetric('2026-11-16','hashed-user','daily_completed'),false);
now=Date.parse('2026-11-20T22:59:59Z');
assert.equal(await context.recordSummitMetric('2026-11-20','hashed-user','daily_completed'),true);
now=Date.parse('2026-11-20T23:00:00Z');
assert.equal(await context.recordSummitMetric('2026-11-20','hashed-user','daily_completed'),false);
assert.equal(calls,2);
const metrics=fs.readFileSync('lib/metrics.ts','utf8'),mod={exports:{}};
vm.runInNewContext(ts.transpileModule(metrics,{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{
module:mod,exports:mod.exports,Date:Clock,require:path=>path==='crypto'?require('crypto'):path==='./pi'?{getServerApiKey:()=> 'secret'}:{recordSummitMetric:async()=>{throw Error('offline')},recordMetric:async()=>true}
});
assert.equal(await mod.exports.safeRecordMetric('uid','login'),true);
assert.equal(await mod.exports.safeRecordMetric('uid','daily_completed'),false);
console.log('Temporary window, Rome midnight cutoff, event allowlist, and login failure isolation passed.');
})().catch(error=>{console.error(error);process.exitCode=1});
