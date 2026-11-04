const assert = require('node:assert/strict');
const missions = {
  M1: {budget:82, options:[[['L1',36,1,2,6],['L2',48,3,1,6]],[['S1',34,2,2,3],['S2',42,3,1,3]]]},
  M2: {budget:78, reserve:8, options:[[['I1',42,1,2,4],['I2',54,2,1,4]],[['G1',16,1,2,6],['G2',24,3,1,6]]]},
  M3: {budget:80, options:[[['P1',40,2,2,5],['P2',52,4,1,5]],[['E1',28,1,2,4],['E2',36,2,1,4]]]},
};
for (const [mid,spec] of Object.entries(missions)) {
 let feasible=0;
 console.log(mid);
 for (const a of spec.options[0]) for (const b of spec.options[1]) {
  const cost=a[1]+b[1]+(spec.reserve||0); const schedules=[];
  for(let sa=a[2];sa<=a[4]-a[3]+1;sa++) for(let sb=b[2];sb<=b[4]-b[3]+1;sb++) {
   const ua=Array.from({length:a[3]},(_,i)=>sa+i);const ub=Array.from({length:b[3]},(_,i)=>sb+i);
   if(ua.some(x=>ub.includes(x))) continue;
   if(mid==='M2') {for(let r=sa+a[3];r<=5;r++) if(!ua.includes(r)&&!ub.includes(r)) schedules.push([sa,sb,r]);}
   else schedules.push([sa,sb]);
  }
  const valid=cost<=spec.budget&&schedules.length>0; if(valid) feasible++;
  console.log(JSON.stringify({combo:a[0]+'+'+b[0],cost,withinBudget:cost<=spec.budget,schedules:schedules.length,example:schedules[0]}));
 }
 assert.equal(feasible,3,mid);
}
console.log('PASS: all 3 missions have 3 feasible combinations and 2 eligible alternatives per request.');
