from src.integrations.registry import registry
from src.utils.logger import logger
import asyncio
import time


class Executor:
    async def run_tool(self, tool_name: str, params: dict, user_id: str):
        """
        Finds and runs a tool from the registry.
        Logs performance and errors.
        """
        start_time = time.time()
        logger.info(f" Executor: Request to run '{tool_name}' for user {user_id}")
        
        try:
            tool = registry.get_tool(tool_name)
            if not tool:
                raise ValueError(f"Tool '{tool_name}' not found in registry.")

            # Run the tool
            result = await tool.run(params, user_id=user_id)
            
            duration = round(time.time() - start_time, 2)
            logger.info(f" Tool '{tool_name}' executed in {duration}s")
            
            return {
                "status": "success",
                "tool": tool_name,
                "duration": duration,
                "result": result
            }

        except Exception as e:
            logger.error(f" Execution Failed for '{tool_name}': {str(e)}")
            return {
                "status": "error", 
                "message": str(e),
                "tool": tool_name
            }

executor = Executor()
