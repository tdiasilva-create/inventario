import test from 'node:test';
import assert from 'node:assert/strict';
import {equipmentSignal} from '../web/equipment-signal.js';
import {monitoringBatch} from '../web/panel-status.js';
import {presenceState} from '../server/agentes/presence.mjs';

test('signal uses server communication including inventory failure, suspend and 17-minute boundary',()=>{
 const now=Date.parse('2026-11-15T13:00:00Z'),p={last_live_contact_at:new Date(now-1020000).toISOString()};
 const item={agent_linked:true,last_contact_at:p.last_live_contact_at,presence_state:presenceState({state:'linked'},p,now)};
 assert.equal(equipmentSignal(item).color,'online');
 item.presence_state=presenceState({state:'linked'},p,now+1);assert.equal(equipmentSignal(item).color,'offline');
 for(const state of ['communicating','communicating_with_failure'])assert.equal(equipmentSignal({...item,presence_state:state}).color,'online');
 for(const state of ['no_recent_communication','reported_suspend','reported_shutdown'])assert.equal(equipmentSignal({...item,presence_state:state}).color,'offline');
 assert.match(equipmentSignal(item).title,/15\/11\/2026, 09:43:00/);
});
test('manual, revoked, missing data and failed reads are never fictitious offline; fresh state restores signal',()=>{
 assert.equal(equipmentSignal({agent_linked:false}).color,'unknown');
 for(const state of ['never_communicated','revoked','not_linked','unknown',null])assert.equal(equipmentSignal({agent_linked:true,presence_state:state}).color,'unknown');
 const item={agent_linked:true,presence_state:'communicating',signalError:true,last_contact_at:'invalid'};
 assert.equal(equipmentSignal(item).color,'unknown');assert.match(equipmentSignal(item).title,/Status desatualizado/);
 item.monitorState='reported_suspend';item.signalError=false;assert.equal(equipmentSignal(item).color,'offline');
 item.monitorState='communicating';assert.equal(equipmentSignal(item).color,'online');
 item.monitorState='not_linked';assert.equal(equipmentSignal(item).color,'unknown');
});
test('shared status keeps limit 50, deduplicates and eventually includes all sectors without extra requests',()=>{
 const ids=Array.from({length:121},(_,i)=>String(i).padStart(3,'0'));let cursor=0;const seen=new Set();
 for(let n=0;n<3;n++){const batch=monitoringBatch([...ids,...ids],cursor);assert.equal(batch.ids.length,50);batch.ids.forEach(id=>seen.add(id));cursor=batch.next;}
 assert.equal(seen.size,121);assert.deepEqual(monitoringBatch(['b','a','b'],99),{ids:['a','b'],next:0});assert.deepEqual(monitoringBatch([],99),{ids:[],next:0});
});
