import sharp from 'sharp';
import fs from 'node:fs/promises';
const manifest=[
  {
    "id": 0,
    "features": {
      "garden": false,
      "facade": false,
      "plaza": false
    },
    "source": "C:/Users/admin/OneDrive - 경희여자중학교/ppscon2/public/center/building-v2/exterior.webp",
    "prompt": "Existing base exterior; reused unchanged."
  },
  {
    "id": 1,
    "features": {
      "garden": true,
      "facade": false,
      "plaza": false
    },
    "source": "C:/Users/admin/.codex/generated_images/01a1a51c-5d95-7181-a9da-bb27514b5ec1/exec-e53be1bd-7a59-45f8-8a67-a12550cd48aa.png",
    "prompt": "Edit this exact cultural-center exterior for the game's LANDSCAPING UPGRADE ONLY. Keep EXACT camera, framing, building structure, windows, entrance stairs/ramp, red-brick left wing, cream right wing, sky, autumn tree at upper left, time of day and hand-painted illustration style. Do not enlarge or redesign the building. Make the landscape upgrade unmistakable at thumbnail size: in the LEFT FOREGROUND replace the small plain bench/low flowers with a substantial landscaped pocket garden with curving raised pale-stone beds full of rich autumn flowers and dense shrubs, three well-shaped small trees, and a slim dark-green metal pergola shelter with a light woven shade roof and curved built-in benches. Keep it at lower left, do not hide the building windows. Add lush tiered flower beds and attractive low planting along RIGHT edge. These are realistic high-quality neighborhood public-center grounds, not a palace. The large CENTER FOREGROUND paved plaza remains plain and empty exactly like the reference, for a separate future upgrade. No stage, no additional building canopy, no new facade materials. No people, no text, no signs, no logos. Strong readable color and detailed materials, same architectural illustration, widescreen 16:9, full bleed. Preserve building positions rigorously."
  },
  {
    "id": 2,
    "features": {
      "garden": false,
      "facade": true,
      "plaza": false
    },
    "source": "C:/Users/admin/.codex/generated_images/01a1a51c-5d95-7181-a9da-bb27514b5ec1/exec-2a364ed0-5181-4039-ba51-f5b5124b7f8d.png",
    "prompt": "Edit the provided exact neighborhood cultural-center exterior for the FACADE REFURBISHMENT ONLY. Keep the exact building massing, roofline, all seven room window positions, stairs and ramp, camera framing/perspective, sky and autumn trees. Keep TWO stories, realistic local public building. Make the improvement immediately recognizable: replace the plain cream facade surrounds on the central/right two-story wings with refined light limestone panels outlined with strong thin dark bronze vertical fins; replace the long plain horizontal entrance awning with a clearly projecting flat glass-and-deep-bronze portico canopy, a crisp modern geometrical entrance feature supported by two slender bronze posts aligned with the existing posts. Add restrained architectural linear lighting below the new canopy; daytime stays unchanged. Preserve the red brick auditorium wing on the left with a narrow bronze vertical architectural accent at its right corner. Rich, refined architectural design, not ornate and not palace. Keep ALL surrounding gardens, plain foreground plaza paving and small original benches EXACTLY like the reference: no pergola, no raised garden beds, no outdoor stage, no circular plaza, no added building wings. No people, no text, no logos, no labels. Same hand-painted detailed architectural illustration, fuller material contrast, 16:9 full bleed. The facade change must be visually obvious while this remains the exact same center."
  },
  {
    "id": 3,
    "features": {
      "garden": true,
      "facade": true,
      "plaza": false
    },
    "source": "C:/Users/admin/.codex/generated_images/01a1a51c-5d95-7181-a9da-bb27514b5ec1/exec-4c58754a-d059-4891-8628-f9b40fd9af8d.png",
    "prompt": "Create ONE exact combination state of this SAME cultural-center building. Input1 is the LANDSCAPED GARDEN version: preserve its entire lower-left green metal pergola, curving raised stone flower beds, colorful planted small trees and landscaped right edge. Input2 is the FACADE UPGRADE version: use its refined pale limestone facade surrounds and slim bronze vertical fins, wide projecting glass-and-bronze entrance portico, linear light under canopy. COMBINE these two upgrades in one image. Camera, building footprint, roofline, seven room window positions, stairs/ramp, sky, autumn framing tree MUST remain identical. Keep CENTER FOREGROUND the plain original paving: NO circular plaza, NO outdoor stage. Do not invent new structures. Exact recognizable shapes from both references, realistic neighborhood scale, no people or text, same rich hand-painted architecture style, full bleed16:9."
  },
  {
    "id": 4,
    "features": {
      "garden": false,
      "facade": false,
      "plaza": true
    },
    "source": "C:/Users/admin/.codex/generated_images/01a1a51c-5d95-7181-a9da-bb27514b5ec1/exec-1cb133cc-965e-46ea-8eab-bc5310552706.png",
    "prompt": "Edit this exact public cultural-center exterior for the MULTIPURPOSE PLAZA UPGRADE ONLY. Keep exact camera, 16:9 framing, original red-brick and plain cream two-story facade, stairs, accessible ramp, sky, autumn trees, original small gardens and benches. Make the open center/right foreground an unmistakable small public activity square: a broad circular light-gray stone inlay with concentric darker paving bands; at its right back edge, a low accessible semicircular outdoor performance platform, only 35cm high, finished in charcoal stone and pale timber, with two slim integrated standing light posts. A few low curved stone seating blocks flank the activity circle. Keep clear central path to entrance and ramp. Place new activity square in CENTER-RIGHT foreground, leaving lower LEFT garden area and the entire facade unchanged. No tall structures or roofs obscuring room windows. Realistic tasteful neighborhood cultural-center plaza, not grand monument. The new circular plaza and little stage must read clearly even at thumbnail size. Same detailed hand-painted architecture style. NO people, NO letters, NO extra building canopy, NO green pergola or landscaped raised flowerbeds. Full bleed."
  },
  {
    "id": 5,
    "features": {
      "garden": true,
      "facade": false,
      "plaza": true
    },
    "source": "C:/Users/admin/.codex/generated_images/01a1a51c-5d95-7181-a9da-bb27514b5ec1/exec-36f7560d-2d08-4543-bfb4-8c63dc6ae566.png",
    "prompt": "Make ONE precise combined upgrade state of this SAME neighborhood cultural center. Preserve EXACT same camera/framing, 16:9, two stories, roofline, seven room window positions, entrance stairs and accessible ramp, autumn sky/tree, realistic neighborhood scale, same detailed painted architectural style. No people, no writing, no new extra wings. Match exact shapes/positions of the requested upgrades from references, not unrelated redesigns. Combine input1 LANDSCAPING (lower-left dark green pergola, curving stone raised gardens with vivid autumn flowers and small trees, landscaped right-edge) with input2 PLAZA (center-right circular paving rings, low curved stone seats, low timber outdoor performance platform at right with two slim lamp posts). Keep the building facade original: red brick left, plain cream surrounds and original short wood-lined entrance awning, no new bronze glass portico or bronze fins. All three landscape features and circular activity plaza must remain clearly visible together."
  },
  {
    "id": 6,
    "features": {
      "garden": false,
      "facade": true,
      "plaza": true
    },
    "source": "C:/Users/admin/.codex/generated_images/01a1a51c-5d95-7181-a9da-bb27514b5ec1/exec-ea277150-a24b-44ea-9214-e65ca17087f5.png",
    "prompt": "Make ONE precise combined upgrade state of this SAME neighborhood cultural center. Preserve EXACT same camera/framing, 16:9, two stories, roofline, seven room window positions, entrance stairs and accessible ramp, autumn sky/tree, realistic neighborhood scale, same detailed painted architectural style. No people, no writing, no new extra wings. Match exact shapes/positions of the requested upgrades from references, not unrelated redesigns. Combine input1 FACADE refurbishment (large projecting glass-and-bronze entrance portico, bronze vertical fins around pale limestone facade) with input2 PLAZA (center-right circular paving rings, low curved stone seats, low timber outdoor stage at right with two slim lamp posts). Keep ORIGINAL modest landscaping: plain bench and low simple flowers at left, no green pergola, no raised curving flowerbeds, no new large landscaped trees. Show only these TWO upgrades together."
  },
  {
    "id": 7,
    "features": {
      "garden": true,
      "facade": true,
      "plaza": true
    },
    "source": "C:/Users/admin/.codex/generated_images/01a1a51c-5d95-7181-a9da-bb27514b5ec1/exec-9ed199da-3e06-4b68-be3a-921553c26e87.png",
    "prompt": "Make ONE precise combined upgrade state of this SAME neighborhood cultural center. Preserve EXACT same camera/framing, 16:9, two stories, roofline, seven room window positions, entrance stairs and accessible ramp, autumn sky/tree, realistic neighborhood scale, same detailed painted architectural style. No people, no writing, no new extra wings. Match exact shapes/positions of the requested upgrades from references, not unrelated redesigns. Combine ALL THREE upgrades exactly: input1 landscaped garden with lower-left dark-green pergola, curved stone raised flowerbeds full of colorful flowers/small trees and lush right-edge planting; input2 pale limestone/bronze fins facade and large projecting bronze/glass entrance portico with linear light; input3 circular center-right activity plaza with stone paving rings, curved low seats and low timber outdoor stage at right with two slim lamp posts. Retain the red brick left auditorium and all windows. All THREE upgrades must be unmistakably present simultaneously. Do not remove the pergola, the glass portico, or the small stage."
  }
];
await fs.mkdir('public/center/campus-v3',{recursive:true});await fs.mkdir('.preview/art-originals/campus-v3',{recursive:true});
for(const item of manifest){const target='public/center/campus-v3/exterior-'+item.id+'.webp';if(item.id===0){await fs.copyFile(item.source,target)}else{await fs.copyFile(item.source,'.preview/art-originals/campus-v3/exterior-'+item.id+'.png');await sharp(item.source).resize({width:1600}).webp({quality:86,effort:6}).toFile(target)} const m=await sharp(target).metadata();item.output=target;item.width=m.width;item.height=m.height;item.bytes=(await fs.stat(target)).size;}
await fs.writeFile('docs/center-growth/CAMPUS_ART_V3.json',JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(manifest.map(({id,width,height,bytes})=>({id,width,height,bytes}))));
