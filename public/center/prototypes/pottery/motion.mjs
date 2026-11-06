// The original plate remains immutable. Inset person silhouettes protect every
// surrounding pixel; linked body/head/arm fields provide small, coherent gestures.
export const WIDTH = 600;
export const HEIGHT = 400;
export const LOOP_MS = 4800;
export const EXPORT_FRAMES = 120;





// Conservatively traced inside silhouettes; pots remain fixed foreground objects.
const PEOPLE           = [
  {
    shapes: [
      [[99,143],[121,145],[137,156],[153,165],[160,179],[158,200],[151,219],[140,232],[118,242],[96,232],[82,223],[73,211],[72,195],[76,181],[77,171],[85,163],[82,154],[89,146]],
      [[65,241],[85,232],[103,239],[119,250],[140,240],[157,245],[173,260],[179,285],[183,304],[194,314],[194,329],[184,340],[173,347],[164,343],[164,329],[149,324],[131,324],[118,332],[116,350],[108,351],[93,342],[80,337],[58,337],[37,336],[23,331],[17,320],[23,300],[35,273],[47,253]],
    ], pivot: [111,333], neck: [116,239], headBlend: [224,249], phase: 0, lean: .012, nod: .028,
    arms: [
      {shoulder:[60,256],elbow:[35,317],hand:[106,335],radius:19,phase:0,direction:1},
      {shoulder:[158,257],elbow:[179,302],hand:[173,333],radius:14,phase:.2,direction:-1},
    ],
  },
  {
    shapes: [
      [[241,140],[253,135],[267,140],[274,151],[270,166],[261,181],[249,185],[237,178],[234,167],[237,151]],
      [[220,181],[237,180],[249,191],[264,184],[278,192],[286,209],[290,227],[285,239],[276,246],[269,245],[273,233],[262,228],[246,229],[239,241],[234,245],[227,237],[214,235],[194,236],[184,231],[187,213],[200,192]],
    ], pivot:[249,240],neck:[250,187],headBlend:[176,198],phase:1.2,lean:.013,nod:.032,
    arms:[
      {shoulder:[211,192],elbow:[190,226],hand:[234,237],radius:12,phase:.15,direction:1},
      {shoulder:[275,198],elbow:[284,224],hand:[275,239],radius:10,phase:.35,direction:-1},
    ],
  },
  {
    shapes:[
      [[352,108],[358,97],[368,90],[383,88],[396,94],[402,106],[399,121],[390,139],[384,151],[368,153],[355,144],[350,132],[348,119]],
      [[352,153],[369,151],[383,148],[397,151],[410,161],[412,179],[405,199],[393,215],[397,257],[386,278],[366,280],[341,266],[336,245],[340,216],[347,198],[345,175]],
      [[311,176],[316,168],[322,168],[328,180],[328,192],[334,201],[329,208],[320,207],[314,198],[310,186]],
      [[340,179],[350,176],[362,182],[378,192],[395,201],[389,210],[377,205],[365,198],[351,195],[340,187]],
    ],pivot:[373,276],neck:[371,154],headBlend:[139,164],phase:2.45,lean:.009,nod:.024,
    arms:[
      {shoulder:[350,168],elbow:[327,204],hand:[319,178],radius:12,phase:.1,direction:-1},
      {shoulder:[399,169],elbow:[392,203],hand:[347,185],radius:13,phase:.3,direction:1},
    ],
  },
  {
    shapes:[
      [[468,159],[479,149],[497,144],[513,149],[528,160],[534,173],[531,191],[524,208],[517,225],[505,237],[490,234],[475,225],[467,209],[462,190],[464,173]],
      [[426,220],[457,213],[475,230],[490,246],[508,241],[526,226],[544,234],[559,253],[566,279],[574,301],[581,316],[580,329],[568,338],[550,343],[536,350],[524,347],[516,344],[501,350],[481,349],[459,349],[442,344],[420,340],[396,338],[379,331],[372,319],[377,291],[389,258],[407,235]],
    ],pivot:[483,342],neck:[491,241],headBlend:[222,252],phase:3.6,lean:.011,nod:.03,
    arms:[
      {shoulder:[415,241],elbow:[387,314],hand:[445,337],radius:20,phase:.2,direction:1},
      {shoulder:[544,246],elbow:[567,311],hand:[532,335],radius:17,phase:.4,direction:-1},
    ],
  },
];
const FIXED_OBJECTS            = [
  [[120,329],[134,323],[153,323],[162,329],[160,349],[153,359],[126,359],[120,348]],
  [[240,231],[258,230],[269,234],[268,247],[260,252],[243,250],[238,243]],
  [[459,326],[474,316],[507,316],[523,325],[517,350],[505,364],[474,363],[462,349]],
];
const clamp01 = (value       ) => Math.max(0,Math.min(1,value));
const smooth = (value       ) => { const t=clamp01(value); return t*t*(3-2*t); };
function inside(x       ,y       ,polygon        )         {
  let result=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const [ax,ay]=polygon[i],[bx,by]=polygon[j];
    if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)result=!result;
  }
  return result;
}
function segment(x       ,y       ,a      ,b      ,radius       )                 {
  const vx=b[0]-a[0],vy=b[1]-a[1];
  const along=clamp01(((x-a[0])*vx+(y-a[1])*vy)/(vx*vx+vy*vy));
  const distance=Math.hypot(x-a[0]-along*vx,y-a[1]-along*vy)/radius;
  return [1-smooth((distance-.35)/.65),along];
}


export function createMotion(source                  ) {
  if(source.length!==WIDTH*HEIGHT*4)throw new Error('Expected a 600 × 400 RGBA plate');
  const peopleMask=new Uint8Array(WIDTH*HEIGHT),movingMask=new Uint8Array(WIDTH*HEIGHT);
  const pixels              =[];
  for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++) {
    if(FIXED_OBJECTS.some(polygon=>inside(x,y,polygon)))continue;
    const person=PEOPLE.findIndex(value=>value.shapes.some(polygon=>inside(x,y,polygon)));
    if(person!==-1)peopleMask[y*WIDTH+x]=person+1;
  }
  for(let y=1;y<HEIGHT-1;y++)for(let x=1;x<WIDTH-1;x++) {
    const id=peopleMask[y*WIDTH+x];if(!id)continue;
    let border=6;
    for(let oy=-5;oy<=5;oy++)for(let ox=-5;ox<=5;ox++) {
      if(peopleMask[(y+oy)*WIDTH+x+ox]!==id)border=Math.min(border,Math.hypot(ox,oy));
    }
    const edge=smooth((border-1)/4);if(!edge)continue;
    const person=PEOPLE[id-1];
    const arms                   =person.arms.map(arm=>{
      const [upper]=segment(x,y,arm.shoulder,arm.elbow,arm.radius);
      const [lower,along]=segment(x,y,arm.elbow,arm.hand,arm.radius);
      return [Math.max(upper,lower),lower*smooth(along/.65)];
    });
    pixels.push({x,y,i:(y*WIDTH+x)*4,person:id-1,edge,head:1-smooth((y-person.headBlend[0])/(person.headBlend[1]-person.headBlend[0])),arms});
    movingMask[y*WIDTH+x]=1;
  }
  function render(milliseconds       ,target                  =new Uint8ClampedArray(source)) {
    target.set(source);
    const phase=((milliseconds%LOOP_MS)+LOOP_MS)%LOOP_MS/LOOP_MS*Math.PI*2;
    const poses=PEOPLE.map(person=>{
      const wave=phase+person.phase;
      return {lean:Math.sin(wave)*person.lean,breath:Math.sin(wave+.35)*.65,nod:Math.sin(wave+.55)*person.nod,nodY:Math.sin(wave+.55)*.75,
        arms:person.arms.map(arm=>({swing:Math.sin(wave+.35+arm.phase)*.018*arm.direction,bend:Math.sin(wave+.6+arm.phase)*.026*arm.direction}))};
    });
    for(const pixel of pixels) {
      const {x,y,i,person:personId,edge,head,arms}=pixel,person=PEOPLE[personId],pose=poses[personId];
      let dx=-(y-person.pivot[1])*pose.lean;
      let dy=(x-person.pivot[0])*pose.lean+pose.breath*clamp01((person.pivot[1]-y)/65);
      dx+=-(y-person.neck[1])*pose.nod*head;
      dy+=((x-person.neck[0])*pose.nod+pose.nodY)*head;
      arms.forEach(([armWeight,forearmWeight],index)=>{
        const arm=person.arms[index],motion=pose.arms[index];
        dx+=-(y-arm.shoulder[1])*motion.swing*armWeight-(y-arm.elbow[1])*motion.bend*forearmWeight;
        dy+=(x-arm.shoulder[0])*motion.swing*armWeight+(x-arm.elbow[0])*motion.bend*forearmWeight;
      });
      const sx=x-dx*edge,sy=y-dy*edge,x0=Math.floor(sx),y0=Math.floor(sy),fx=sx-x0,fy=sy-y0;
      const p=y0*WIDTH+x0,id=personId+1;
      // Never pull a table, bowl or another person's pixels into a moving part.
      if(peopleMask[p]!==id||peopleMask[p+1]!==id||peopleMask[p+WIDTH]!==id||peopleMask[p+WIDTH+1]!==id)continue;
      const a=p*4,b=a+WIDTH*4;
      for(let c=0;c<3;c++)target[i+c]=(source[a+c]*(1-fx)+source[a+4+c]*fx)*(1-fy)+(source[b+c]*(1-fx)+source[b+4+c]*fx)*fy;
    }
    return target;
  }
  return {render,movingMask,movingPixels:pixels.length};
}
