import test from "node:test";
import assert from "node:assert/strict";
import { localizeChoiceState, renderComparisonBlocks, renderComparisonButtons } from "../sdk/components/lessonComponents.js";

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

test("unequal comparison rows share columns so vertical pairs line up",()=>{
  const html=renderComparisonBlocks({topCount:15,bottomCount:9,revealGap:true});
  assert.equal((html.match(/--columns:15/g)||[]).length,2);
  assert.equal((html.match(/class="block extra"/g)||[]).length,6);
  assert.equal((html.match(/class="block bottom dim"/g)||[]).length,9);
});

test("button model forms five visible pairs before showing five extras",()=>{
  const base={topCount:10,bottomCount:5,ariaLabel:"Ten blue and five red buttons"};
  const pairs=renderComparisonButtons({...base,step:"pair"});
  const extras=renderComparisonButtons({...base,step:"reveal"});
  assert.match(pairs,/role="img" aria-label="Ten blue and five red buttons"/);
  assert.equal((pairs.match(/class="buttonColumn matched"/g)||[]).length,5);
  assert.equal((extras.match(/class="buttonColumn unmatched"/g)||[]).length,5);
  assert.equal((extras.match(/class="buttonToken red absent"/g)||[]).length,5);
});
