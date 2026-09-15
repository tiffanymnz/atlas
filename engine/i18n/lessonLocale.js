function object(value){ return value&&typeof value==="object"&&!Array.isArray(value); }

export function applyTranslation(base,translation){
  if(Array.isArray(base)){
    const translated=Array.isArray(translation)?translation:[];
    return base.map((item,index)=>applyTranslation(item,translated[index]));
  }
  if(object(base)){
    const translated=object(translation)?translation:{};
    return Object.fromEntries(Object.entries(base).map(([key,value])=>[key,applyTranslation(value,translated[key])]));
  }
  return typeof base==="string"&&typeof translation==="string"?translation:base;
}

export async function loadLocalizedLesson(path,language,fetcher=fetch){
  const response=await fetcher(path);
  const base=await response.json();
  if(language!=="es") return base;
  const translationPath=path.replace("/lessons/","/translations/es/");
  const translationResponse=await fetcher(translationPath);
  if(!translationResponse.ok) throw new Error(`Missing Spanish translation: ${translationPath}`);
  return applyTranslation(base,await translationResponse.json());
}
