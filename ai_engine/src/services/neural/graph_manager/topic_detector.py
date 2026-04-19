"""

   TOPIC DETECTOR  Real-time Semantic Segmentation            
  Cluaiz Neural OS | graph_manager/topic_detector.py             
                                                                  
  Role: Detects subject-matter shifts and creates TopicNeurons.   

"""
from typing import Dict, List, Optional
from loguru import logger

class TopicDetector:
    """
    Analyzes sequences of episodes to group them under TopicNeurons.
    Example: Message 1-5 (Research), Message 6-10 (Marketing).
    """
    
    async def detect_topic(self, message: str, history: List[str]) -> Dict[str, str]:
        """
        Determines the current topic of conversation.
        Segments chat into discrete TopicNeurons for the Neo4j structure.
        """
        logger.info(" [GraphManager] Segmenting topic for structural mapping...")
        
        # In production, this would use a cross-encoder or structured LLM call
        detected_topic = "General Inquiry"
        if any(w in message.lower() for w in ["research", "search", "web", "find"]):
            detected_topic = "Web Research"
        elif any(w in message.lower() for w in ["story", "marketing", "pr", "campaign"]):
            detected_topic = "Content Marketing"
        elif any(w in message.lower() for w in ["youtube", "video", "manager"]):
            detected_topic = "YouTube Management"
            
        import yaml
        
        structured_matrix = {
            "Topic_Title": detected_topic,
            "Core_Intent": f"User is analyzing or discussing {detected_topic}.",
            "User_Focus_State": "Active / Exploring",
            "Key_Entities_Used": {
                "Tools": ["System_AI"],
                "Keywords": [detected_topic, "planning"]
            },
            "Status_of_Topic": "Pending Execution",
            "Past_Dependencies": {
                "Linked_To": "none_detected"
            },
            "Abstract_Summary": f"A highly-focused context window concerning {detected_topic}."
        }
        
        yaml_output = yaml.dump(structured_matrix, sort_keys=False)
        logger.debug(f" [TopicMatrix] Generated highly-structured YAML:\n{yaml_output}")
            
        return {
            "topic_id": f"topic_{detected_topic.lower().replace(' ', '_')}",
            "topic_name": detected_topic,
            "summary": structured_matrix["Abstract_Summary"],
            "structured_yaml": yaml_output
        }

topic_detector = TopicDetector()
