const STORAGE_VERSION = 1;
const PREFERENCES_KEY = "atlas.preferences.v1";
const LEARNING_KEY = "atlas.learning.v1";
const LAST_LESSON_KEY = "atlas.lastLesson.v1";

function storage() { try { return globalThis.localStorage; } catch { return null; } }
function read(key, fallback) { try { const value=storage()?.getItem(key); return value?JSON.parse(value):fallback; } catch { return fallback; } }
function write(key, value) { try { storage()?.setItem(key,JSON.stringify(value)); return true; } catch { return false; } }
function attempt(){ return {id:globalThis.crypto?.randomUUID?.()||`attempt-${Date.now()}-${Math.random().toString(16).slice(2)}`,startedAt:new Date().toISOString(),completedAt:null,completed:false,events:[],summary:null}; }
function learningState(){ const state=read(LEARNING_KEY,null); return state?.version===STORAGE_VERSION&&state.lessons?state:{version:STORAGE_VERSION,lessons:{}}; }

export function getPreferences(){ return {dark:false,big:false,reduce:false,...read(PREFERENCES_KEY,{})}; }
export function savePreferences(p){ return write(PREFERENCES_KEY,{dark:!!p.dark,big:!!p.big,reduce:!!p.reduce}); }
export function ensureLessonRecord(lesson,path){
  const state=learningState(), id=lesson.metadata.id, existing=state.lessons[id];
  if(existing){ existing.path=path; existing.title=lesson.metadata.title; existing.screenStates||={}; existing.priorCompletedAttempts||=[]; existing.currentAttempt||=attempt(); return existing; }
  const record={lessonId:id,path,title:lesson.metadata.title,status:"not_started",index:0,screenStates:{},currentAttempt:attempt(),priorCompletedAttempts:[],lastAccessedAt:new Date().toISOString()};
  state.lessons[id]=record; write(LEARNING_KEY,state); return record;
}
export function saveLessonRecord(id,record){ const state=learningState(); record.lastAccessedAt=new Date().toISOString(); state.lessons[id]=record; return write(LEARNING_KEY,state); }
export function getAllLessonRecords(){ return Object.values(learningState().lessons); }
export function archiveCompletedAttempt(record,summary){ record.currentAttempt.completed=true; record.currentAttempt.completedAt||=new Date().toISOString(); record.currentAttempt.summary=summary; return record; }
export function newLessonAttempt(record){
  const completed=record.currentAttempt;
  if(completed?.completed&&!record.priorCompletedAttempts.some(item=>item.id===completed.id)) record.priorCompletedAttempts.push(structuredClone(completed));
  record.currentAttempt=attempt(); record.screenStates={}; record.index=0; record.status="not_started"; return record;
}
export function saveLastLessonPath(path){ try { storage()?.setItem(LAST_LESSON_KEY,path); return true; } catch { return false; } }
export function getLastLessonPath(){ try { return storage()?.getItem(LAST_LESSON_KEY); } catch { return null; } }
