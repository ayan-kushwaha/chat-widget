from src.core.executor import executor

class AutoService:
    async def execute_tool(self, tool_name: str, params: dict, user_id: str):
        return await executor.run_tool(tool_name, params, user_id)

auto_service = AutoService()
