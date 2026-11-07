/** Shared, capped evaluation rules; only actual attended classes count as education. */
export const EDUCATION_WEEKLY_TARGET = 40
/** Serving 85% of eligible public demand meets the access goal; no need to serve every resident. */
export const PUBLIC_ACCESS_TARGET = .85
/** Startup operating support protects the first two years; new applications quote the full cost from year 3. */
export const rentalOperatingCostRate = (year:number) => year<=2?.48:.60
export interface ServiceEvidence {
  publicServed:number; publicRequested:number; weeks:number
  learningServed?:number; learningWeeks?:number
}
const bounded=(value:number)=>Math.max(0,Math.min(100,value))
export function publicServiceScore(stats:ServiceEvidence):number {
  const rawAccess=stats.publicRequested?bounded(stats.publicServed/stats.publicRequested*100):0
  const access=bounded(rawAccess/PUBLIC_ACCESS_TARGET)
  const measured=Math.min(stats.weeks,stats.learningWeeks??0)
  if(measured<=0)return rawAccess // Old evidence stays valid without inventing participants.
  const education=bounded((stats.learningServed??0)/(measured*EDUCATION_WEEKLY_TARGET)*100)
  const fraction=stats.weeks>0?measured/stats.weeks:0
  return rawAccess*(1-fraction)+(.5*access+.5*education)*fraction
}
/** Preserve early growth; above 30, fame becomes progressively harder to build. */
export function seasonReputationGrowthLimit(reputation:number):number {
  return 8*Math.max(.05,Math.min(1,(100-reputation)/70))
}
