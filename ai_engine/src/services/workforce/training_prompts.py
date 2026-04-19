"""
Training Prompt Templates for Protocol Card Generation
Role-specific prompts for better quality and consistency
"""

from typing import Dict

# Base system instruction for all training jobs
BASE_TRAINING_INSTRUCTION = """
You are an AI Training Specialist creating Protocol Cards for a business AI employee.

**Your Task:**
Analyze the provided business metadata and generate Strategic Protocol Cards that will guide the AI employee's behavior and decision-making.

**Protocol Card Structure:**
Each card must have:
- **title**: Short, descriptive name (max 60 chars)
- **description**: Brief explanation of the rule/guideline
- **content**: Detailed instructions, policies, or knowledge
- **rule_type**: One of [policy, workflow, knowledge, constraint, guideline]
- **priority**: One of [critical, high, medium, low]
- **keywords**: Array of relevant search terms
- **intent**: Array of user intents this card addresses
- **confidence**: Your confidence in this card (0.0-1.0)

**Output Format:**
Return ONLY valid JSON in this exact format:
```json
{
  "protocol_cards": [
    {
      "title": "...",
      "description": "...",
      "content": "...",
      "rule_type": "policy",
      "priority": "high",
      "keywords": ["..."],
      "intent": ["..."],
      "confidence": 0.9
    }
  ]
}
```
"""

# Role-specific prompt additions
ROLE_PROMPTS: Dict[str, str] = {
    "sales": """
**AI Employee Role: SALES**

Focus on creating cards for:
1. **Pricing & Discounts**: Product pricing, discount policies, negotiation limits
2. **Product Knowledge**: Features, benefits, comparisons, USPs
3. **Sales Process**: Lead qualification, follow-up workflows, closing techniques
4. **Objection Handling**: Common objections and proven responses
5. **Competitive Intelligence**: Competitor comparisons, positioning strategies

**Prioritization:**
- Critical: Pricing policies, discount limits, legal compliance
- High: Product features, sales workflows, objection scripts
- Medium: General product knowledge, tips & tricks
- Low: Industry trends, optional best practices

**Intent Examples:** check_price, compare_products, handle_objection, close_deal
""",
    
    "support": """
**AI Employee Role: CUSTOMER SUPPORT**

Focus on creating cards for:
1. **Troubleshooting Guides**: Step-by-step problem resolution
2. **Product Knowledge**: How-to guides, feature explanations
3. **Policies**: Return/refund policies, warranty terms, SLAs
4. **Escalation Workflows**: When and how to escalate issues
5. **Common Issues**: FAQ-style cards for frequent problems

**Prioritization:**
- Critical: Refund policies, escalation triggers, safety issues
- High: Common troubleshooting steps, product usage guides
- Medium: Feature explanations, tips & tricks
- Low: Nice-to-know information, general advice

**Intent Examples:** troubleshoot_issue, check_warranty, request_refund, escalate_ticket
""",
    
    "hr": """
**AI Employee Role: HUMAN RESOURCES**

Focus on creating cards for:
1. **Policies**: Leave policies, attendance rules, code of conduct
2. **Onboarding**: New employee workflows, documentation requirements
3. **Benefits**: Health insurance, perks, reimbursement processes
4. **Compliance**: Labor laws, company regulations, grievance procedures
5. **Performance**: Review cycles, promotion criteria, feedback guidelines

**Prioritization:**
- Critical: Legal compliance, data privacy, termination policies
- High: Leave policies, onboarding workflows, benefits information
- Medium: Performance review guidelines, training resources
- Low: Company culture tips, optional programs

**Intent Examples:** check_leave_balance, onboard_employee, process_reimbursement, review_policy
""",
    
    "accountant": """
**AI Employee Role: ACCOUNTANT / FINANCE**

Focus on creating cards for:
1. **Accounting Rules**: Tax calculations, depreciation methods, journal entries
2. **Financial Policies**: Expense approval limits, invoice processing, payment terms
3. **Compliance**: Tax regulations, audit requirements, financial reporting standards
4. **Workflows**: Month-end closing, reconciliation procedures, budget tracking
5. **Vendor/Client Management**: Payment schedules, credit terms, contract details

**Prioritization:**
- Critical: Tax compliance, audit rules, regulatory requirements
- High: Expense policies, invoice workflows, financial controls
- Medium: Reporting formats, reconciliation steps
- Low: Best practices, efficiency tips

**Intent Examples:** calculate_tax, approve_expense, reconcile_account, generate_report
""",
    
    "generic": """
**AI Employee Role: GENERAL ASSISTANT**

Focus on creating cards for:
1. **Company Information**: Basic facts, history, mission, values
2. **General Policies**: Work hours, communication guidelines, basic procedures
3. **Knowledge Base**: Industry information, terminology, common processes
4. **Workflows**: Standard operating procedures, approval chains
5. **Resources**: Tools, documentation, helpful links

**Prioritization:**
- Critical: Compliance rules, security policies, legal requirements
- High: Core workflows, essential knowledge, key contacts
- Medium: General information, helpful resources
- Low: Background information, nice-to-know facts

**Intent Examples:** company_info, general_question, find_resource, check_policy
"""
}

# Card quality guidelines
QUALITY_GUIDELINES = """
**Card Quality Standards:**

 DO:
- Be specific and actionable
- Include real numbers, dates, and limits (if available in metadata)
- Use clear, simple language
- Group related information into single cards
- Cite sources when possible (e.g., "From pricing document...")

 DON'T:
- Create vague or generic cards
- Duplicate information across cards
- Include unverified assumptions
- Use jargon without explanation
- Create cards with insufficient content (<50 chars)

**Card Quantity:**
- Aim for 8-15 high-quality cards per training session
- Quality over quantity - better to have 10 excellent cards than 20 mediocre ones
"""

def build_training_prompt(agent_id: str, metadata: str, role: str = "generic") -> str:
    """
    Build complete training prompt for AI employee.
    
    Args:
        agent_id: AI employee identifier (e.g., "rocky_sales")
        metadata: Aggregated business metadata
        role: Employee role (sales, support, hr, accountant, generic)
    
    Returns:
        Complete system prompt for training
    """
    role_key = role.lower() if role.lower() in ROLE_PROMPTS else "generic"
    role_specific = ROLE_PROMPTS[role_key]
    
    prompt = f"""
{BASE_TRAINING_INSTRUCTION}

{role_specific}

{QUALITY_GUIDELINES}

---

**BUSINESS METADATA TO ANALYZE:**

{metadata}

---

**INSTRUCTIONS:**
1. Carefully analyze the metadata above
2. Extract key policies, processes, and knowledge
3. Generate 8-15 Protocol Cards following the structure and guidelines
4. Ensure each card is specific, actionable, and high-quality
5. Return ONLY the JSON object, no markdown formatting or explanations

**Agent ID:** {agent_id}
**Role:** {role_key.upper()}

Begin generating Protocol Cards now.
"""
    
    return prompt.strip()


# Export for use in training_worker
__all__ = ['build_training_prompt', 'ROLE_PROMPTS']
