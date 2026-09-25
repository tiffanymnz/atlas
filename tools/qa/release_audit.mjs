import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile,readdir } from "node:fs/promises";
import { dirname,extname,relative,resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const requiredFiles=[
  "index.html","release.json","CHANGELOG.md","apps/learner/index.html",
  "docs/V1_RELEASE_CHECKLIST.md","docs/V1_RELEASE_NOTES.md","docs/V1_KNOWN_LIMITATIONS.md","docs/V1_ROLLBACK.md","docs/V1_GO_NO_GO.md",
  "engine/lessonEngine.js","engine/state-store/stateStore.js",
  "sdk/components/components.css","sdk/components/lessonComponents.js",
  ...[1,2,3,4].flatMap(number=>{
    const name=`lesson${String(number).padStart(3,"0")}.json`;
    return [`curriculum/lessons/${name}`,`curriculum/translations/es/${name}`];
  }),
  "assets/memory/index.html","assets/memory/manifest.json","assets/memory/memory-assets.json",
  ...["en","es"].flatMap(locale=>["flashcards","worksheet","quiz"].map(type=>`assets/memory/${locale}/${type}.html`))
];

const digest=value=>createHash("sha256").update(value).digest("hex");
const localReference=value=>value&&!/^(?:[a-z]+:|#|\/\/)/i.test(value);
const normalizeTarget=(source,value,root)=>{
  const clean=value.split(/[?#]/)[0];
  const target=resolve(dirname(resolve(root,source)),clean);
  return clean.endsWith("/")?resolve(target,"index.html"):target;
};

async function walk(directory){
  const entries=await readdir(directory,{withFileTypes:true});
  const paths=[];
  for(const entry of entries){
    const path=resolve(directory,entry.name);
    if(entry.isDirectory()) paths.push(...await walk(path));
    else paths.push(path);
  }
  return paths;
}

export async function auditRelease(root=projectRoot){
  const errors=[],checked=[],references=[];
  for(const path of requiredFiles){
    if(!existsSync(resolve(root,path))) errors.push(`Missing required file: ${path}`);
    else checked.push(path);
  }

  const release=JSON.parse(await readFile(resolve(root,"release.json"),"utf8"));
  if(release.version!=="1.0.0") errors.push("release.json must identify V1");
  if(release.status!=="stable") errors.push("release.json status must be stable");
  if(release.releaseDate!=="2026-09-16") errors.push("release.json must identify the V1 release date");
  if(release.targetDate!=="2026-10-18") errors.push("release.json must retain the V1 target date");
  if(!Array.isArray(release.lessonIds)||release.lessonIds.length!==4) errors.push("release.json must list all four lesson IDs");

  const htmlFiles=(await walk(root)).filter(path=>extname(path)===".html"&&!(path.includes("/.git/")||path.includes("/node_modules/")));
  for(const absolute of htmlFiles){
    const source=relative(root,absolute),html=await readFile(absolute,"utf8");
    // Only URL-bearing attributes are file references. Form values may be
    // languages, numeric defaults, answer tokens, or other application data.
    const values=[...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(match=>match[1]);
    const refresh=[...html.matchAll(/http-equiv="refresh"[^>]+content="[^"]*url=([^";]+)[^"]*"/gi)].map(match=>match[1].trim());
    for(const value of [...values,...refresh].filter(localReference)){
      const target=normalizeTarget(source,value,root);
      references.push(`${source} -> ${relative(root,target)}`);
      if(!target.startsWith(root)||!existsSync(target)) errors.push(`Broken local reference: ${source} -> ${value}`);
    }
  }

  const runtimeJs=(await Promise.all([walk(resolve(root,"engine")),walk(resolve(root,"sdk"))])).flat().filter(path=>extname(path)===".js");
  for(const absolute of runtimeJs){
    const source=relative(root,absolute),code=await readFile(absolute,"utf8");
    for(const match of code.matchAll(/from\s+"([^"]+)"/g)){
      if(!localReference(match[1])) continue;
      const target=normalizeTarget(source,match[1],root);
      references.push(`${source} -> ${relative(root,target)}`);
      if(!existsSync(target)) errors.push(`Broken module import: ${source} -> ${match[1]}`);
    }
  }

  for(const path of requiredFiles.filter(path=>path.endsWith(".json"))) {
    try{ JSON.parse(await readFile(resolve(root,path),"utf8")); }
    catch(error){ errors.push(`Invalid JSON: ${path} (${error.message})`); }
  }

  const manifest=JSON.parse(await readFile(resolve(root,"assets/memory/manifest.json"),"utf8"));
  for(const [path,expected] of Object.entries(manifest.outputs||{})){
    const absolute=resolve(root,"assets/memory",path);
    if(!existsSync(absolute)) errors.push(`Missing manifest output: ${path}`);
    else if(digest(await readFile(absolute))!==expected) errors.push(`Manifest hash mismatch: ${path}`);
  }

  return {version:release.version,checkedFiles:checked.length,internalReferences:references.length,manifestOutputs:Object.keys(manifest.outputs||{}).length,errors};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=await auditRelease();
  if(result.errors.length){ console.error(result.errors.join("\n")); process.exit(1); }
  console.log(`Release audit passed for ${result.version}: ${result.checkedFiles} required files, ${result.internalReferences} internal references, ${result.manifestOutputs} generated outputs.`);
}
