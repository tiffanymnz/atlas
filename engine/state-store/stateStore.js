const STORAGE_VERSION = 1;
const PREFERENCES_KEY = "atlas.preferences.v1";
const LEARNING_KEY = "atlas.learning.v1";
const LAST_LESSON_KEY = "atlas.lastLesson.v1";

function storage() { try { return globalThis.localStorage; } catch { return null; } }
function read(key, fallback) { try { const value=storage()?.getItem(key); return value?JSON.parse(value):fallback; } catch { return fallback; } }
function write(key, value) { try { storage()?.setItem(key,JSON.stringify(value)); return true; } catch { return false; } }
function attempt(){ return {id:globalThis.crypto?.randomUUID?.()||`attempt-${Date.now()}-${Math.random().toString(16).slice(2)}`,startedAt:new Date().toISOString(),completedAt:null,completed:false,events:[],summary:null}; }
function learningState(){ const state=read(LEARNING_KEY,null); return state?.version===STORAGE_VERSION&&state.lessons?state:{version:STORAGE_VERSION,lessons:{}}; }
function object(value){ return value&&typeof value==="object"&&!Array.isArray(value); }
function clone(value){ try { return structuredClone(value); } catch { return JSON.parse(JSON.stringify(value)); } }
function normalizeAttempt(value){
  const fallback=attempt(), saved=object(value)?value:{};
  return {
    id:typeof saved.id==="string"&&saved.id?saved.id:fallback.id,
    startedAt:typeof saved.startedAt==="string"?saved.startedAt:fallback.startedAt,
    completedAt:typeof saved.completedAt==="string"?saved.completedAt:null,
    completed:saved.completed===true,
    events:Array.isArray(saved.events)?saved.events:[],
    summary:object(saved.summary)?saved.summary:null
  };
}
function normalizeRecord(value,lesson,path){
  const saved=object(value)?value:{};
  const statuses=new Set(["not_started","in_progress","completed"]);
  const currentAttempt=normalizeAttempt(saved.currentAttempt);
  const screenStates=object(saved.screenStates)?Object.fromEntries(Object.entries(saved.screenStates).filter(([,state])=>object(state))):{};
  return {
    lessonId:lesson.metadata.id,
    path,
    title:lesson.metadata.title,
    status:currentAttempt.completed?"completed":statuses.has(saved.status)?saved.status:"not_started",
    index:Number.isFinite(Number(saved.index))?Math.max(0,Math.floor(Number(saved.index))):0,
    screenStates,
    currentAttempt,
    priorCompletedAttempts:Array.isArray(saved.priorCompletedAttempts)?saved.priorCompletedAttempts.map(normalizeAttempt).filter(item=>item.completed):[],
    lastAccessedAt:typeof saved.lastAccessedAt==="string"?saved.lastAccessedAt:new Date().toISOString()
  };
}

export function getPreferences(){ const saved=read(PREFERENCES_KEY,{}); return {dark:saved?.dark===true,big:saved?.big===true,reduce:saved?.reduce===true,language:saved?.language==="es"?"es":"en"}; }
export function savePreferences(p){ return write(PREFERENCES_KEY,{dark:!!p.dark,big:!!p.big,reduce:!!p.reduce,language:p.language==="es"?"es":"en"}); }
export function ensureLessonRecord(lesson,path){
  const state=learningState(), id=lesson.metadata.id, existing=state.lessons[id];
  if(existing){ const record=normalizeRecord(existing,lesson,path); state.lessons[id]=record; write(LEARNING_KEY,state); return record; }
  const record=normalizeRecord(null,lesson,path);
  state.lessons[id]=record; write(LEARNING_KEY,state); return record;
}
export function saveLessonRecord(id,record){ const state=learningState(); record.lastAccessedAt=new Date().toISOString(); state.lessons[id]=record; return write(LEARNING_KEY,state); }
export function getAllLessonRecords(){ return Object.values(learningState().lessons); }
export function archiveCompletedAttempt(record,summary){ record.currentAttempt=normalizeAttempt(record.currentAttempt); record.currentAttempt.completed=true; record.currentAttempt.completedAt||=new Date().toISOString(); record.currentAttempt.summary=summary; return record; }
export function newLessonAttempt(record){
  const completed=normalizeAttempt(record.currentAttempt);
  record.priorCompletedAttempts=Array.isArray(record.priorCompletedAttempts)?record.priorCompletedAttempts:[];
  if(completed.completed&&!record.priorCompletedAttempts.some(item=>item.id===completed.id)) record.priorCompletedAttempts.push(clone(completed));
  record.currentAttempt=attempt(); record.screenStates={}; record.index=0; record.status="not_started"; return record;
}
export function saveLastLessonPath(path){ try { storage()?.setItem(LAST_LESSON_KEY,path); return true; } catch { return false; } }
export function getLastLessonPath(){ try { return storage()?.getItem(LAST_LESSON_KEY); } catch { return null; } }
