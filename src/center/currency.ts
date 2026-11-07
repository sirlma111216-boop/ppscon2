/** Save-compatible accounting scale. Scores never use these formatters. */
export const WON_PER_UNIT=10_000
export const wonAmount=(units:number):string=>Math.round(units*WON_PER_UNIT).toLocaleString('ko-KR')
export const won=(units:number):string=>wonAmount(units)+'원'
export const signedWonAmount=(units:number):string=>(units>0?'+':'')+wonAmount(units)
export const compactWon=(units:number):string=>Math.abs(units)>=1?(units).toLocaleString('ko-KR',{maximumFractionDigits:1})+'만원':won(units)
/** Old narrative strings are display-only; the underlying saved record stays intact. */
export const legacyMoneyText=(text:string):string=>text.replace(/([\d,]+(?:\.\d+)?)점/g,(_,n:string)=>won(Number(n.replaceAll(',',''))))
