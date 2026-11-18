const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const mod={exports:{}};
let reportReads=0,summitFails=true;
const store={
 isStoreConfigured:()=>true,
 getMetricsReport:async()=>{reportReads++;return[{day:'2026-11-18',uniqueUsers:2}]},
 getSummitReport:async()=>{if(summitFails)throw Error('sample unavailable');return{rows:[]}}
};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('pages/api/metrics.ts','utf8'),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}
}).outputText,{
 module:mod,exports:mod.exports,Buffer,Date,
 process:{env:{ARENA_METRICS_KEY:'test-only'}},
 require:name=>name==='crypto'?require('crypto'):name.endsWith('/store')?store:{
  bearerFromRequest:()=>null,verifyPiAccessToken:async()=>{throw Error('not signed in')}
 }
});
async function call(headers){
 const res={setHeader(){},status(code){this.code=code;return this},json(body){this.body=body;return this}};
 await mod.exports.default({method:'GET',headers,query:{days:'7'}},res);
 return res;
}
(async()=>{
 const denied=await call({});
 assert.equal(denied.code,403);assert.equal(reportReads,0);
 const partial=await call({'x-arena-metrics-key':'test-only'});
 assert.equal(partial.code,200);
 assert.equal(partial.body.rows[0].uniqueUsers,2);
 assert.equal(partial.body.summit.unavailable,true);
 summitFails=false;
 assert.equal((await call({'x-arena-metrics-key':'test-only'})).body.summit.rows.length,0);
 console.log('Private report authorization and ordinary attendance during a sample outage passed.');
})().catch(error=>{console.error(error);process.exitCode=1});
