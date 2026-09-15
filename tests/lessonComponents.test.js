import test from "node:test";
import assert from "node:assert/strict";
import { localizeChoiceState } from "../sdk/components/lessonComponents.js";

const screen={
  choices:[{text:"6",feedback:"La diferencia es 6."}],
  hints:["Compara las cantidades."]
};
const copy={hint:"Pista",correct:"Correcto.",lookAgain:"Inténtalo de nuevo.",fallbackHint:"Observa la pregunta."};

test("restored correct feedback is rebuilt in the active language",()=>{
  const state={selected:0,submittedCorrect:true,feedback:{className:"feedback success",html:"<strong>Correct.</strong>"}};
  assert.deepEqual(localizeChoiceState(screen,state,copy),{
    hintHtml:null,
    feedback:{className:"feedback success",html:"<strong>Correcto.</strong><br>La diferencia es 6."}
  });
});

test("restored hints and retries are rebuilt in the active language",()=>{
  const state={hintIndex:1,hintHtml:"old language",feedback:{kind:"warning"}};
  assert.deepEqual(localizeChoiceState(screen,state,copy),{
    hintHtml:"<strong>Pista</strong><br>Compara las cantidades.",
    feedback:{className:"feedback warn",html:"<strong>Inténtalo de nuevo.</strong><br>Compara las cantidades."}
  });
});
