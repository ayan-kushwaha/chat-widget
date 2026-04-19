import importlib
import pkgutil
import inspect
from pathlib import Path
from loguru import logger
from .registry import SkillRegistry


async def bootstrap_skills():
    """
     Dynamic Skill Discovery & Registration.
    Automatically finds every class inheriting from BaseSkill in the 'src/services/aiskills' subpackages.
    This eliminates the need for manual maintenance as we scale to 50+ skills.
    """
    logger.info(" Starting Dynamic Skill Discovery...")
    
    from .base_skill import BaseSkill
    
    # Path to the current directory (aiskills)
    package_path = Path(__file__).parent
    
    # Track discovery stats
    discovery_count = 0
    
    # Recursively find all modules in subdirectories
    for module_info in pkgutil.walk_packages([str(package_path)], prefix="src.services.aiskills."):
        try:
            # Import the module
            module = importlib.import_module(module_info.name)
            
            # Find all classes in the module
            for name, obj in inspect.getmembers(module, inspect.isclass):
                # Check if it inherits from BaseSkill and is not abstract
                if issubclass(obj, BaseSkill) and obj.__name__ not in ("BaseSkill", "SemanticContract"):
                    if not inspect.isabstract(obj):
                        # Register it!
                        await SkillRegistry.register(obj)
                        discovery_count += 1
                    
        except Exception as e:
            logger.error(f"Failed to load module {module_info.name}: {e}")

    if discovery_count > 0:
        logger.success(f" Registered {discovery_count} Intelligence Nodes. Foundation Ready.")
    else:
        logger.warning(" No skills were discovered. Check directory structure.")
