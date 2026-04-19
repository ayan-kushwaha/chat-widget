import os
import re

replacements = {
    # Core Engine
    "from src.services.aiemployees.base_employee import BaseEmployee": "from src.services.aiskills.engine._base_executor import BaseEmployee",
    "from src.services.aiemployees.router import router": "from src.services.aiskills.engine.skill_router import router",
    "from src.services.aiemployees.router import workforce_router": "from src.services.aiskills.engine.skill_router import workforce_router",
    "from src.services.aiskills.base_skill import BaseSkill": "from src.services.aiskills.engine.base_skill import BaseSkill",
    "from src.services.aiskills.base_skill import SemanticContract": "from src.services.aiskills.engine.base_skill import SemanticContract",
    "from src.services.aiskills.factory import SkillFactory": "from src.services.aiskills.engine.factory import SkillFactory",
    "from src.services.aiskills.loader import bootstrap_skills": "from src.services.aiskills.engine.loader import bootstrap_skills",
    "from src.services.aiskills.registry import SkillRegistry": "from src.services.aiskills.engine.registry import SkillRegistry",
    "from src.services.aiskills.memory_bridge import MemoryBridge": "from src.services.aiskills.engine.memory_bridge import MemoryBridge",
    
    # Skills - ChatWidget
    "src.services.aiskills.it_commander.page_navigator": "src.services.aiskills.chatwidget.page_navigator",
    "src.services.aiskills.integration.product_search": "src.services.aiskills.chatwidget.product_search",
    "src.services.aiskills.integration.inventory_check": "src.services.aiskills.chatwidget.inventory_check",
    "src.services.aiskills.integration.order_lookup": "src.services.aiskills.chatwidget.order_lookup",
    "src.services.aiskills.sales.upsell_engine": "src.services.aiskills.chatwidget.upsell_engine",
    "src.services.aiskills.support.refund_management": "src.services.aiskills.chatwidget.refund_management",
    "src.services.aiskills.support.conflict_resolver": "src.services.aiskills.chatwidget.conflict_resolver",
    "src.services.aiskills.support.de_escalator": "src.services.aiskills.chatwidget.de_escalator",
    "src.services.aiskills.executive.lead_qualifier": "src.services.aiskills.chatwidget.lead_qualifier",
    "src.services.aiskills.security.hitl_approval_gate": "src.services.aiskills.chatwidget.hitl_approval_gate",
    "src.services.aiskills.global_concierge.warm_welcomer": "src.services.aiskills.chatwidget.warm_welcomer",
    "src.services.aiskills.global_concierge.chit_chat_pivot": "src.services.aiskills.chatwidget.chit_chat_pivot",
    "src.services.aiskills.global_concierge.ambiguity_catcher": "src.services.aiskills.chatwidget.ambiguity_catcher",
    "src.services.aiskills.data_harvester.silent_form_filler": "src.services.aiskills.chatwidget.silent_form_filler",
    "src.services.aiskills.data_harvester.implicit_memory_sync": "src.services.aiskills.chatwidget.implicit_memory_sync",
    "src.services.aiskills.data_harvester.contextual_probe": "src.services.aiskills.chatwidget.contextual_probe",
    
    # Skills - Global
    "src.services.aiskills.common.formatting": "src.services.aiskills.global.formatting",
    "src.services.aiskills.common.currency": "src.services.aiskills.global.currency",
    "src.services.aiskills.common.date_formatter": "src.services.aiskills.global.date_formatter",
    "src.services.aiskills.finance.currency_converter": "src.services.aiskills.global.currency_converter",
    "src.services.aiskills.contracts.shared.pii_shield": "src.services.aiskills.global.pii_shield",
    
    # Skills - Executive
    "src.services.aiskills.operations.report_generator": "src.services.aiskills.executive.report_generator",
    "src.services.aiskills.operations.task_summary": "src.services.aiskills.executive.task_summary",
    "src.services.aiskills.hr_admin.leave_manager": "src.services.aiskills.executive.leave_manager",
    "src.services.aiskills.hr_admin.payroll_calculator": "src.services.aiskills.executive.payroll_calculator",
    
    # Skills - Marketing
    "src.services.aiskills.analytics.campaign_analysis": "src.services.aiskills.marketing.campaign_analysis",
    "src.services.aiskills.analytics.sentiment_analyser": "src.services.aiskills.marketing.sentiment_analyser",
    "src.services.aiskills.pr_manager.social_pulse_sentinel": "src.services.aiskills.marketing.social_pulse_sentinel",
    "src.services.aiskills.pr_manager.brand_integrity_guard": "src.services.aiskills.marketing.brand_integrity_guard",
    "src.services.aiskills.pr_manager.content_storyteller": "src.services.aiskills.marketing.content_storyteller",

    # Skills - Psychology
    "src.services.aiskills.contracts.psychology": "src.services.aiskills.psychology",
    "src.services.aiemployees.shadow_boss": "src.services.aiskills.psychology.shadow_boss",
    
    # Skills - Global / Shared
    "src.services.aiemployees.shared": "src.services.aiskills.global",
    
    # Engine / Core
    "src.services.aiemployees.memory": "src.services.aiskills.engine.memory",
    "src.services.aiemployees.base_employee": "src.services.aiskills.engine._base_executor",
    "src.services.aiemployees.router": "src.services.aiskills.engine.skill_router",
    "from src.services.aiemployees": "from src.services.aiskills.engine", # Generic core catch-all
    
    "src.services.aiskills.contracts": "src.services.aiskills" # Catch-all for remaining contract moves
}

def fix_imports(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                for old, new in replacements.items():
                    new_content = new_content.replace(old, new)
                
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"✅ Fixed imports in: {path}")

if __name__ == "__main__":
    src_dir = r"c:\Users\Aryan\my\cluaiz\ai_engine\src"
    fix_imports(src_dir)
    print("🏁 Import fix complete.")
