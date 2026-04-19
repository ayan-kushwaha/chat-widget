"""

    SKILL BLUEPRINTS  The Neural Competency Repository        
  Cluaiz Neural OS | neurons/workforce/blueprints.py             
                                                                  
  Role: Defines the technical DNA and Tool requirements for       
        specialized SkillNeurons. The 'Instruction Manual'.      

"""

SKILL_BLUEPRINTS = {
    "web_researcher": {
        "description": "Ability to search the live web and synthesize data.",
        "required_tools": ["google_search_api", "web_scraper_v2"],
        "execution_protocol": "SEARCH -> SCRAPE -> SUMMARIZE",
        "output_format": "Markdown Report"
    },
    "data_analyzer": {
        "description": "Ability to process large datasets and find insights.",
        "required_tools": ["python_interpreter", "pandas_plugin"],
        "execution_protocol": "LOAD -> ANALYZE -> VISUALIZE",
        "output_format": "JSON Statistics"
    },
    "email_outreach": {
        "description": "Ability to draft and send personalized emails.",
        "required_tools": ["gmail_smtp_connector"],
        "execution_protocol": "DRAFT -> APPROVE -> SEND",
        "output_format": "Sent Confirmation"
    },
    "content_creator": {
        "description": "General creative writing and branding DNA.",
        "required_tools": ["brand_persona_neuron", "style_guide_lookup"],
        "execution_protocol": "DRAFT -> POLISH -> BRAND_CHECK",
        "output_format": "Styled Copy"
    }
}

def get_blueprint(skill_id: str):
    """Retrieves the biological DNA for a specific skill."""
    return SKILL_BLUEPRINTS.get(skill_id.lower(), {})
