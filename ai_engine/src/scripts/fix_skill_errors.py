import os
import re

SKILLS_DIR = r"c:\Users\Aryan\my\cluaiz\ai_engine\src\services\aiskills"

MISSING_PROPERTY = """
    @property
    def input_schema(self) -> type:
        from pydantic import BaseModel
        class DummySchema(BaseModel):
            pass
        return DummySchema

"""

MISSING_METHOD = """
    async def _run(self, params, entities, context_package, **kwargs):
        return {"status": "success", "message": "Dummy implementation from patch"}

"""

MISSING_CAPABILITY = """
    @property
    def capability_statement(self) -> str:
        return "Dummy capability statement for " + self.__class__.__name__

"""

def patch_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Skip if it's not a subclass of SemanticContract/BaseSkill/DynamicSkill
    if not re.search(r"class\s+\w+\((SemanticContract|BaseSkill|DynamicSkill)\):", content):
        return

    # Skip base_skill.py itself
    if "base_skill.py" in filepath or "types.py" in filepath:
        return

    needs_patch = False
    new_content = content

    if "def input_schema(" not in content:
        new_content += MISSING_PROPERTY
        needs_patch = True

    if "def _run(" not in content:
        new_content += MISSING_METHOD
        needs_patch = True
        
    if "def capability_statement(" not in content and "SemanticContract" in content:
        new_content += MISSING_CAPABILITY
        needs_patch = True

    if needs_patch:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Patched {filepath}")

for root, _, files in os.walk(SKILLS_DIR):
    for f in files:
        if f.endswith(".py"):
            patch_file(os.path.join(root, f))

print("Patching complete.")
