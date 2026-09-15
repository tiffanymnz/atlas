import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { applyTranslation } from "../../engine/i18n/lessonLocale.js";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const outputRoot=resolve(root,"assets/memory");
const lessonNames=["lesson001.json","lesson002.json","lesson003.json","lesson004.json"];
const inputPaths=lessonNames.flatMap(name=>[
  `curriculum/lessons/${name}`,
  `curriculum/translations/es/${name}`
]);
const text={
  en:{language:"English",other:"Español",title:"Atlas memory practice",subtitle:"Printable practice generated from Lessons 001–004.",flashcards:"Flashcards",worksheet:"Worksheet",quiz:"Quiz",print:"Print or save as PDF",instructions:"Solve each problem. Show the subtraction you used.",answerKey:"Answer key",independent:"Independent practice",transfer:"Transfer",recall:"Recall",goal:"Learning goal",remember:"Remember",answer:"Answer",question:"Question"},
  es:{language:"Español",other:"English",title:"Práctica de memoria de Atlas",subtitle:"Práctica imprimible generada de las Lecciones 001–004.",flashcards:"Tarjetas de memoria",worksheet:"Hoja de práctica",quiz:"Prueba",print:"Imprime o guarda como PDF",instructions:"Resuelve cada problema. Muestra la resta que usaste.",answerKey:"Clave de respuestas",independent:"Práctica independiente",transfer:"Transferencia",recall:"Recuerdo",goal:"Objetivo de aprendizaje",remember:"Recuerda",answer:"Respuesta",question:"Pregunta"}
};

const hash=value=>createHash("sha256").update(value).digest("hex");
const escape=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const correct=screen=>screen.choices.find(choice=>choice.correct)?.text || "";
const screen=(lesson,type)=>lesson.screens.find(item=>item.type===type);
const readJson=async path=>JSON.parse(await readFile(resolve(root,path),"utf8"));

function modelLesson(lesson){
  const hook=screen(lesson,"memoryHook"), independent=screen(lesson,"independentPractice"), recall=screen(lesson,"recall"), transfer=screen(lesson,"transfer");
  return {
    lessonId:lesson.metadata.id,
    conceptId:lesson.concepts.primary_concept,
    title:lesson.metadata.title,
    learningGoal:lesson.learning.learning_goal,
    memoryHook:{title:hook.title,hook:hook.hook,body:hook.body},
    independent:{prompt:independent.prompt,answer:correct(independent)},
    recall:{prompt:recall.prompt,choices:recall.choices.map(({text})=>text),answer:correct(recall)},
    transfer:{prompt:transfer.prompt,choices:transfer.choices.map(({text})=>text),answer:correct(transfer)}
  };
}

function shell({lang,title,body}){
  return `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title>
<style>:root{--ink:#17324a;--blue:#315c7c;--soft:#eef5f8;--line:#bfd0da}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:var(--ink);background:#f7f5ef}main{width:min(900px,100%);margin:auto;background:#fff;min-height:100vh;padding:32px}nav{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0 28px}a,.button{color:#fff;background:var(--blue);padding:10px 14px;border-radius:999px;text-decoration:none;font-weight:700;border:0}h1{font-size:2.3rem;margin:.2em 0}h2{border-bottom:2px solid var(--line);padding-bottom:8px;margin-top:34px}.meta{color:#536878;font-weight:700}.card,.problem,.answer{border:2px solid var(--line);border-radius:18px;padding:20px;margin:18px 0;break-inside:avoid}.card{min-height:250px;display:grid;align-content:center}.hook{font-size:1.35rem;font-weight:800;background:var(--soft);padding:15px;border-radius:12px}.lines{height:90px;background:repeating-linear-gradient(transparent 0 29px,var(--line) 30px)}ol.choices{line-height:1.9}.answer-key{break-before:page}.print{float:right}@media print{body,main{background:#fff}.print,nav{display:none}main{padding:0}.card{break-after:page}}</style></head><body><main>${body}</main></body></html>`;
}

function nav(lang,current){
  const c=text[lang];
  return `<nav><a href="flashcards.html">${c.flashcards}</a><a href="worksheet.html">${c.worksheet}</a><a href="quiz.html">${c.quiz}</a><a href="../${lang==="en"?"es":"en"}/${current}.html">${c.other}</a></nav>`;
}

function heading(lang,title,current){
  const c=text[lang];
  return `<button class="button print" onclick="print()">${c.print}</button><p class="meta">✦ Atlas · ${c.language}</p><h1>${escape(title)}</h1>${nav(lang,current)}`;
}

function flashcards(lang,lessons){
  const c=text[lang];
  const cards=lessons.map(item=>`<section class="card" data-lesson-id="${escape(item.lessonId)}" data-concept-id="${escape(item.conceptId)}"><p class="meta">${escape(item.lessonId)} · ${escape(item.conceptId)}</p><h2>${escape(item.title)}</h2><p><strong>${c.goal}:</strong> ${escape(item.learningGoal)}</p><p class="hook"><strong>${c.remember}:</strong> ${escape(item.memoryHook.hook)}</p><p><strong>${c.recall}:</strong> ${escape(item.recall.prompt)}</p><p><strong>${c.answer}:</strong> ${escape(item.recall.answer)}</p></section>`).join("");
  return shell({lang,title:c.flashcards,body:heading(lang,c.flashcards,"flashcards")+cards});
}

function worksheet(lang,lessons){
  const c=text[lang];
  const problems=lessons.map((item,index)=>`<section data-lesson-id="${escape(item.lessonId)}"><h2>${index+1}. ${escape(item.title)}</h2><div class="problem"><strong>${c.independent}</strong><p>${escape(item.independent.prompt)}</p><div class="lines"></div></div><div class="problem"><strong>${c.transfer}</strong><p>${escape(item.transfer.prompt)}</p><div class="lines"></div></div></section>`).join("");
  const answers=lessons.map((item,index)=>`<div class="answer"><strong>${index+1}. ${escape(item.lessonId)}</strong><p>${c.independent}: ${escape(item.independent.answer)}</p><p>${c.transfer}: ${escape(item.transfer.answer)}</p></div>`).join("");
  return shell({lang,title:c.worksheet,body:heading(lang,c.worksheet,"worksheet")+`<p>${c.instructions}</p>`+problems+`<section class="answer-key"><h1>${c.answerKey}</h1>${answers}</section>`});
}

function quiz(lang,lessons){
  const c=text[lang]; let number=0; const answers=[];
  const questions=lessons.map(item=>[item.recall,item.transfer].map((question,kind)=>{number++;const shift=(number-1)%question.choices.length;const choices=question.choices.slice(shift).concat(question.choices.slice(0,shift));const letter=String.fromCharCode(65+choices.indexOf(question.answer));answers.push(`${number}. ${letter}. ${question.answer} (${item.lessonId})`);return `<section class="problem" data-lesson-id="${escape(item.lessonId)}" data-concept-id="${escape(item.conceptId)}"><p class="meta">${escape(item.lessonId)} · ${kind===0?c.recall:c.transfer}</p><h2>${number}. ${escape(question.prompt)}</h2><ol class="choices" type="A">${choices.map(choice=>`<li>${escape(choice)}</li>`).join("")}</ol></section>`;}).join("")).join("");
  return shell({lang,title:c.quiz,body:heading(lang,c.quiz,"quiz")+questions+`<section class="answer-key"><h1>${c.answerKey}</h1>${answers.map(answer=>`<p>${escape(answer)}</p>`).join("")}</section>`});
}

function hub(){
  return shell({lang:"en",title:"Atlas memory practice",body:`<p class="meta">✦ Atlas</p><h1>Memory practice / Práctica de memoria</h1><p>Choose a language. Elige un idioma.</p><section class="card"><h2>English</h2><nav><a href="en/flashcards.html">Flashcards</a><a href="en/worksheet.html">Worksheet</a><a href="en/quiz.html">Quiz</a></nav><h2>Español</h2><nav><a href="es/flashcards.html">Tarjetas</a><a href="es/worksheet.html">Hoja de práctica</a><a href="es/quiz.html">Prueba</a></nav></section><p><a href="../../apps/learner/">Return to Atlas / Volver a Atlas</a></p>`});
}

export async function buildMemoryAssets(){
  const base=await Promise.all(lessonNames.map(name=>readJson(`curriculum/lessons/${name}`)));
  const overlays=await Promise.all(lessonNames.map(name=>readJson(`curriculum/translations/es/${name}`)));
  const localized={en:base.map(modelLesson),es:base.map((lesson,index)=>modelLesson(applyTranslation(lesson,overlays[index])))};
  const outputs={"index.html":hub(),"memory-assets.json":JSON.stringify({schemaVersion:1,locales:localized},null,2)+"\n"};
  for(const lang of ["en","es"]){
    outputs[`${lang}/flashcards.html`]=flashcards(lang,localized[lang]);
    outputs[`${lang}/worksheet.html`]=worksheet(lang,localized[lang]);
    outputs[`${lang}/quiz.html`]=quiz(lang,localized[lang]);
  }
  const sourceText=(await Promise.all(inputPaths.map(async path=>`${path}\n${await readFile(resolve(root,path),"utf8")}`))).join("\n");
  outputs["manifest.json"]=JSON.stringify({schemaVersion:1,generator:"tools/build/generate_memory_assets.mjs",sourceDigest:hash(sourceText),sources:inputPaths,lessonIds:base.map(lesson=>lesson.metadata.id),outputs:Object.fromEntries(Object.entries(outputs).map(([path,content])=>[path,hash(content)]))},null,2)+"\n";
  return outputs;
}

async function main(){
  const outputs=await buildMemoryAssets(), check=process.argv.includes("--check"), errors=[];
  for(const [path,content] of Object.entries(outputs)){
    const target=resolve(outputRoot,path);
    if(check){
      const existing=await readFile(target,"utf8").catch(()=>null);
      if(existing!==content) errors.push(path);
    }else{
      await mkdir(dirname(target),{recursive:true});
      await writeFile(target,content);
    }
  }
  if(errors.length) throw new Error(`Generated memory assets are stale: ${errors.join(", ")}`);
  console.log(check?"Memory assets are current.":`Generated ${Object.keys(outputs).length} memory assets.`);
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) main().catch(error=>{console.error(error.message);process.exit(1);});
