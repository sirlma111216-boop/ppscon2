import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
const root='reports/center-balance/';
const general=JSON.parse(fs.readFileSync(root+'final-fairness.json'));
const fields=JSON.parse(gunzipSync(fs.readFileSync(root+'final-fields-fairness.json.gz')));
const holdout=JSON.parse(gunzipSync(fs.readFileSync(root+'champion-holdout-trace.json.gz')));
for(const report of [general,fields,holdout])assert.equal(report.sourceUnchangedDuringRun,true);
const champion=fields.summary.find(s=>s.strategy==='balanced_champion');
assert.ok(champion.wins>=3&&champion.top3>=10,'balanced play must have a reproducible winning path');
assert.equal(champion.shortageSeasons,0,'winning policy cannot depend on silent cancellations');
assert.ok(holdout.summary[0].wins>=1&&holdout.summary[0].top3>=3,'unseen seed validation');
for(const id of ['careful_standard','thoughtful_balanced']){const s=general.summary.find(s=>s.strategy===id);assert.ok(s.top3Rate>=75);assert.equal(s.meanShortageSeasons,0);}
for(const id of ['rent_only','luxury_idle'])assert.equal(general.summary.find(s=>s.strategy===id).top3Rate,0);
for(const s of fields.summary.filter(s=>s.strategy.endsWith('_balanced')))assert.ok(s.top3>=6,'specialty plus public service must be viable');
console.log('Balance acceptance gates passed: winning path, holdout, conscientious top-three, no single-action win, viable specialties.');
