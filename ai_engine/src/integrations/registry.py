from typing import Dict, Type
from src.integrations.base_tool import BaseTool

class ToolRegistry:
    _registry: Dict[str, Type[BaseTool]] = {}
    
    @classmethod
    def register(cls, tool_cls: Type[BaseTool]):
        temp = tool_cls() 
        cls._registry[temp.name] = tool_cls
        return tool_cls

    @classmethod
    def get_tool(cls, name: str) -> BaseTool:
        if name not in cls._registry: raise ValueError(f"Tool {name} not found")
        return cls._registry[name]()

    @classmethod
    def get_all_schemas(cls):
        return [tool().get_schema() for tool in cls._registry.values()]

registry = ToolRegistry()
