from src.utils.logger import logger
from src.core.brain import brain
from src.config.task_mappings import TaskType
import json
import re

class MetadataService:
    async def generate_metadata(self, text: str, context: str = None):
        """
        Generates Summary, Tags, Title and AI Intent using LLM.
        MongoDB docs use Cloud Gemini (DOC_METADATA task).
        Neo4j chunks use Local Qwen (CHUNK_SUMMARY task)  handled separately in base.py.
        """
        safe_text = text[:3000]
        
        prompt = f"""
        You are a Specialized Knowledge Architect. Analyze the text below and extract highly structured metadata.

        GOALS:
        1. TITLE: Generate a professional, concise title. If filename '{context}' is low quality, ignore it.
           STRICT LIMIT: MUST be LESS than 140 characters.
        2. SUMMARY: A professional, clear 2-sentence summary of the main points.
           STRICT LIMIT: MUST be LESS than 500 characters.
        3. TAGS: 5-8 hyper-relevant keywords for hybrid vector search.
           STRICT LIMIT: MAXIMUM of 12 tags.
        4. AI INTENT: Detail exactly what questions this text can answer.
           STRICT LIMIT: MUST be LESS than 350 characters.

        OUTPUT FORMAT (STRICT JSON):
        {{
            "title": "Professional Title (Max 140 chars)",
            "summary": "2-sentence summary (Max 500 chars)",
            "tags": ["tag1", "tag2", "..."],
            "intent_summary": "Extracted Knowledge: ... (Max 350 chars)"
        }}

        CONTEXT/FILENAME: {context if context else 'None provided'}
        TEXT TO ANALYZE:
        "{safe_text}"
        """
        
        try:
            logger.info(f" [Metadata] Sending Request to AI Brain (Task: DOC_METADATA  Gemini)...")
            result = await brain.generate(prompt, task_type=TaskType.DOC_METADATA)
            
            response_text = result.get("text", "") if isinstance(result, dict) else str(result)
            usage = result.get("usage", {"input": 0, "output": 0}) if isinstance(result, dict) else {"input": 0, "output": 0}

            if not response_text:
                logger.error(" [Metadata] AI Brain returned empty response text.")
                raise ValueError("Empty response from AI Brain")

            logger.info(f" [Metadata] AI Brain Response ({len(response_text)} chars)")
            
            # Extract JSON block from response
            match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if not match:
                logger.error(f" [Metadata] No JSON block found: {response_text[:300]}")
                raise ValueError("No valid JSON found in LLM response")
            
            data = json.loads(match.group(0).strip())
            
            # Safe defaults
            data.setdefault("title", "Untitled Document")
            data.setdefault("summary", "Summary unavailable")
            data.setdefault("tags", [])
            data.setdefault("intent_summary", data.get("summary", "No specific intent identified."))
            
            # Hard-limit lengths
            data["title"] = str(data["title"])[:140]
            data["summary"] = str(data["summary"])[:500]
            data["intent_summary"] = str(data["intent_summary"])[:350]
            if isinstance(data["tags"], list):
                data["tags"] = data["tags"][:12]
            
            data["usage"] = usage
            logger.info(f" [Metadata] Generated: {data['title'][:60]}...")
            return data

        except Exception as e:
            logger.error(f" Metadata generation failed: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return {
                "summary": "Summary unavailable", 
                "tags": [], 
                "intent_summary": "No intent summary available."
            }

metadata_service = MetadataService()
