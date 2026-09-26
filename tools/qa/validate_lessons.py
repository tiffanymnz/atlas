import json
from pathlib import Path
errors=[]
curriculum_dir=Path(__file__).resolve().parents[2] / "curriculum"
lesson_dir=curriculum_dir / "lessons"
knowledge_graph=json.loads((curriculum_dir / "knowledge-graph" / "knowledge_graph_v1.json").read_text(encoding="utf-8"))
concept_ids={concept.get("id") for concept in knowledge_graph.get("concepts",[])}
misconception_ids=set(knowledge_graph.get("misconceptions",{}))
lesson_ids=set()
primary_concepts=set()
translation_dir=curriculum_dir / "translations" / "es"

def require_translation(base,translated,key,path_name):
    if key in base and (not isinstance(translated.get(key),str) or not translated[key].strip()):
        errors.append(f"{path_name}: missing Spanish translation for {key}")

def validate_translation(data,translation,path_name):
    require_translation(data.get("metadata",{}),translation.get("metadata",{}),"title",path_name)
    require_translation(data.get("metadata",{}),translation.get("metadata",{}),"review_status",path_name)
    for key in ["learning_goal","big_idea"]:
        require_translation(data.get("learning",{}),translation.get("learning",{}),key,path_name)
    for key in ["assumed_prior_knowledge","novice_success_criteria"]:
        if key in data.get("learning",{}):
            values=translation.get("learning",{}).get(key,[])
            if len(values) != len(data["learning"][key]) or any(not isinstance(value,str) or not value.strip() for value in values):
                errors.append(f"{path_name}: Spanish learning.{key} must match source entries")
    base_screens=data.get("screens",[])
    translated_screens=translation.get("screens",[])
    if len(translated_screens) != len(base_screens):
        errors.append(f"{path_name}: Spanish screens must match lesson screens")
        return
    for index,(screen,translated) in enumerate(zip(base_screens,translated_screens)):
        location=f"{path_name} screen {index}"
        for key in ["label","stage","title","body","callout","nextLabel","prompt","guidance","phraseMeaning","nextRecommendation","hook","boundary","boundaryLabel"]:
            require_translation(screen,translated,key,location)
        require_translation(screen.get("visual",{}),translated.get("visual",{}),"message",location)
        require_translation(screen.get("visual",{}),translated.get("visual",{}),"ariaLabel",location)
        for key in ["hints","phrases","rebuildSteps"]:
            if key in screen:
                values=translated.get(key,[])
                if len(values) != len(screen[key]) or any(not isinstance(value,str) or not value.strip() for value in values):
                    errors.append(f"{location}: Spanish {key} must match source entries")
        if "definitions" in screen:
            definitions=translated.get("definitions",[])
            if len(definitions) != len(screen["definitions"]): errors.append(f"{location}: Spanish definitions must match source entries")
            else:
                for definition_index,(definition,translated_definition) in enumerate(zip(screen["definitions"],definitions)):
                    require_translation(definition,translated_definition,"term",f"{location} definition {definition_index}")
                    require_translation(definition,translated_definition,"meaning",f"{location} definition {definition_index}")
        if "choices" in screen:
            choices=translated.get("choices",[])
            if len(choices) != len(screen["choices"]):
                errors.append(f"{location}: Spanish choices must match source choices")
                continue
            for choice_index,(choice,translated_choice) in enumerate(zip(screen["choices"],choices)):
                require_translation(choice,translated_choice,"text",f"{location} choice {choice_index}")
                require_translation(choice,translated_choice,"feedback",f"{location} choice {choice_index}")

for path in sorted(lesson_dir.glob("*.json")):
    data=json.loads(path.read_text(encoding="utf-8"))
    translation_path=translation_dir / path.name
    if not translation_path.exists():
        errors.append(f"{path.name}: missing Spanish translation file")
    else:
        validate_translation(data,json.loads(translation_path.read_text(encoding="utf-8")),path.name)
    for key in ["schema_version","metadata","learning","concepts","screens"]:
        if key not in data: errors.append(f"{path.name}: missing {key}")
    for key in ["id","title","domain","subject","course","unit"]:
        if key not in data.get("metadata",{}): errors.append(f"{path.name}: missing metadata.{key}")
    lesson_id=data.get("metadata",{}).get("id")
    if lesson_id in lesson_ids: errors.append(f"{path.name}: duplicate metadata.id {lesson_id}")
    lesson_ids.add(lesson_id)
    primary_concept=data.get("concepts",{}).get("primary_concept")
    if not primary_concept: errors.append(f"{path.name}: missing primary concept")
    elif primary_concept not in concept_ids: errors.append(f"{path.name}: unknown primary concept {primary_concept}")
    elif primary_concept in primary_concepts: errors.append(f"{path.name}: duplicate primary concept {primary_concept}")
    primary_concepts.add(primary_concept)
    screens=data.get("screens",[])
    required_types=["intro","misconception","observe","discover","language","memoryHook","symbol","equationReveal","guidedPractice","independentPractice","recall","transfer","reflection","complete"]
    screen_types=[screen.get("type") for screen in screens]
    screen_ids=[screen.get("id") for screen in screens]
    if data.get("schema_version") != "3.0": errors.append(f"{path.name}: schema_version must be 3.0")
    expected_types=required_types
    if path.name=="lesson001.json":
        expected_types=["intro","count","count","observe","discover","language","memoryHook","misconception","symbol","equationReveal","guidedPractice","independentPractice","recall","transfer","reflection","complete"]
    if screen_types != expected_types: errors.append(f"{path.name}: screen sequence must be {' -> '.join(expected_types)}")
    if any(not isinstance(screen_id,str) or not screen_id for screen_id in screen_ids): errors.append(f"{path.name}: every screen needs a stable id")
    if len(set(screen_ids)) != len(screen_ids): errors.append(f"{path.name}: screen ids must be unique")
    if not screens or screens[0].get("type") != "intro": errors.append(f"{path.name}: first screen must be intro")
    if not screens or screens[-1].get("type") != "complete": errors.append(f"{path.name}: last screen must be complete")
    for i,screen in enumerate(data.get("screens",[])):
        if screen.get("type") in ["count","misconception","discover","symbol","guidedPractice","independentPractice","recall","transfer","reflection"]:
            choices=screen.get("choices",[])
            if sum(choice.get("correct") is True for choice in choices) != 1: errors.append(f"{path.name} screen {i}: expected exactly one correct choice")
        if screen.get("type") in ["count","misconception","discover","symbol","guidedPractice","independentPractice","recall","transfer"]:
            choices=screen.get("choices",[])
            for c in choices:
                if c.get("correct") is False and "misconception" not in c: errors.append(f"{path.name} screen {i}: wrong choice missing misconception")
                elif c.get("correct") is False and c.get("misconception") not in misconception_ids: errors.append(f"{path.name} screen {i}: unknown misconception {c.get('misconception')}")
if errors:
    print("\n".join(errors)); raise SystemExit(1)
print("All lesson checks passed.")
