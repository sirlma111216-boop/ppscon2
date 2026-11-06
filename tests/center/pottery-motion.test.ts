import test from 'node:test'
import assert from 'node:assert/strict'
import {createMotion,WIDTH,HEIGHT,LOOP_MS,EXPORT_FRAMES} from '../../src/center/potteryMotion.ts'

// Import by URL so Node executes the actual independent preview module, rather
// than a rewritten test double or a Vite-only import from the public directory.
const standaloneURL=new URL('../../public/center/prototypes/pottery/motion.mjs',import.meta.url)
const standalone=await import(standaloneURL.href) as typeof import('../../src/center/potteryMotion.ts')

function syntheticPlate():Uint8ClampedArray {
  const rgba=new Uint8ClampedArray(WIDTH*HEIGHT*4)
  for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){
    const i=(y*WIDTH+x)*4
    rgba[i]=(17*x+11*y)%256
    rgba[i+1]=(3*x^29*y)%256
    rgba[i+2]=((x>>3)*37+(y>>2)*19)%256
    rgba[i+3]=32+(x+7*y)%224
  }
  return rgba
}
const source=syntheticPlate(),original=source.slice()
const motion=createMotion(source),independent=standalone.createMotion(source)

test('the pottery loop has identical frames at zero and the exact loop boundary',()=>{
  assert.deepEqual(motion.render(0),motion.render(LOOP_MS))
  assert.deepEqual(motion.render(0),motion.render(LOOP_MS*3))
  assert.deepEqual(motion.render(725),motion.render(725+LOOP_MS))
  assert.deepEqual(motion.render(-240),motion.render(LOOP_MS-240))
})

test('synthetic textured skin and clothing have actual movement inside the deformation mask',()=>{
  const start=motion.render(0),later=motion.render(900)
  let changed=0
  for(let pixel=0;pixel<WIDTH*HEIGHT;pixel++){
    const i=pixel*4
    if(start[i]!==later[i]||start[i+1]!==later[i+1]||start[i+2]!==later[i+2]){
      changed++
      assert.equal(motion.movingMask[pixel],1,'motion must not spread outside the published mask')
    }
  }
  assert.ok(changed>100,'the animation must move a meaningful set of pixels')
  assert.ok(motion.movingPixels>=changed)
  assert.ok(motion.movingPixels<WIDTH*HEIGHT/2,'the scene cannot move as a whole')
})

test('every unmasked pixel stays byte-identical to the original and alpha is preserved everywhere',()=>{
  for(const time of [0,333,1200,2350,4799]){
    const frame=motion.render(time)
    for(let pixel=0;pixel<WIDTH*HEIGHT;pixel++){
      const i=pixel*4
      assert.equal(frame[i+3],original[i+3],`alpha at ${pixel}, time ${time}`)
      if(motion.movingMask[pixel])continue
      for(let channel=0;channel<3;channel++)assert.equal(frame[i+channel],original[i+channel],`background at ${pixel}, time ${time}`)
    }
  }
})

test('all four people move their heads, torsos and connected arms instead of isolated hands',()=>{
  const regions:Record<string,[number,number,number,number]>={
    womanHead:[95,175,45,50],womanTorso:[75,261,75,43],womanArm:[41,306,64,26],
    studentHead:[242,150,24,25],studentTorso:[217,194,51,24],studentArm:[197,222,37,13],
    teacherHead:[358,102,32,33],teacherTorso:[355,224,32,35],teacherArm:[312,173,13,28],
    manHead:[479,169,40,49],manTorso:[452,262,65,40],manArm:[393,313,51,21],
  }
  const first=motion.render(0),second=motion.render(1200)
  for(const [name,[x,y,width,height]] of Object.entries(regions)){
    let changed=0
    for(let py=y;py<y+height;py++)for(let px=x;px<x+width;px++){
      const i=(py*WIDTH+px)*4
      if(first[i]!==second[i]||first[i+1]!==second[i+1]||first[i+2]!==second[i+2])changed++
    }
    assert.ok(changed>width*height*.5,`${name} must participate in the gesture`)
  }
})

test('independently identified environment and pottery regions are excluded from people motion',()=>{
  const fixedRegions:Record<string,[number,number,number,number]>={
    ceiling:[0,0,600,80],windows:[424,10,160,120],shelves:[176,87,166,44],
    centerTableEdge:[198,268,136,12],tableLegsAndFloor:[216,284,112,87],
    frontTable:[0,365,600,35],frontLeftPot:[126,332,30,18],
    centerPot:[245,235,18,10],frontRightPot:[478,329,30,25],
  }
  for(const time of [0,700,1600,2700,4100]){
    const frame=motion.render(time)
    for(const [name,[x,y,width,height]] of Object.entries(fixedRegions)){
      for(let py=y;py<y+height;py++)for(let px=x;px<x+width;px++){
        const pixel=py*WIDTH+px,i=pixel*4
        assert.equal(motion.movingMask[pixel],0,`${name} cannot belong to a person mask`)
        for(let channel=0;channel<4;channel++)assert.equal(frame[i+channel],original[i+channel],`${name} must remain fixed at ${time}ms`)
      }
    }
  }
})

test('repeated default and reusable-target rendering never mutates the source or previously returned frames',()=>{
  const first=motion.render(450),saved=first.slice()
  const target=new Uint8ClampedArray(source.length).fill(255)
  for(const time of [800,1800,3100,4700,0]){
    assert.equal(motion.render(time,target),target)
    assert.deepEqual(target,motion.render(time))
  }
  assert.deepEqual(source,original)
  assert.deepEqual(first,saved)
  assert.notEqual(first.buffer,source.buffer)
})

test('the bundled game and the independent preview render the same actual pixels across the loop',()=>{
  assert.equal(standalone.WIDTH,WIDTH)
  assert.equal(standalone.HEIGHT,HEIGHT)
  assert.equal(standalone.LOOP_MS,LOOP_MS)
  assert.equal(standalone.EXPORT_FRAMES,EXPORT_FRAMES)
  assert.equal(motion.movingPixels,independent.movingPixels)
  assert.deepEqual(motion.movingMask,independent.movingMask)
  for(const time of [-120,0,67.5,600,1600,2400,3600,4799,4800,9800])
    assert.deepEqual(motion.render(time),independent.render(time),`standalone/game drift at ${time}ms`)
  assert.deepEqual(source,original)
})

test('incorrect RGBA dimensions are rejected before creating a motion renderer',()=>{
  for(const length of [0,WIDTH*HEIGHT*3,WIDTH*HEIGHT*4-1,WIDTH*HEIGHT*4+4])
    assert.throws(()=>createMotion(new Uint8ClampedArray(length)),/600.*400.*RGBA/)
})
