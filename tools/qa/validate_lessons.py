import json
from pathlib import Path
errors=[]
for path in Path("../../curriculum/lessons").glob("*.json"):
    data=json.loads(path.read_text(encoding="utf-8"))
    for key in ["schema_version","metadata","learning","concepts","screens"]:
        if key not in data: errors.append(f"{path.name}: missing {key}")
    for key in ["id","title","domain","subject","course","unit"]:
        if key not in data.get("metadata",{}): errors.append(f"{path.name}: missing metadata.{key}")
    if not data.get("concepts",{}).get("primary_concept"): errors.append(f"{path.name}: missing primary concept")
    for i,screen in enumerate(data.get("screens",[])):
        if screen.get("type") in ["discover","symbol"]:
            for c in screen.get("choices",[]):
                if c.get("correct") is False and "misconception" not in c: errors.append(f"{path.name} screen {i}: wrong choice missing misconception")
if errors:
    print("\n".join(errors)); raise SystemExit(1)
print("All lesson checks passed.")
