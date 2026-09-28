import os
import sys
import logging
from typing import List, Optional
from langchain_core.tools import BaseTool

logger = logging.getLogger(__name__)


class MCPService:
    """
    Manages connections to MCP servers (via Stdio or SSE) and loads tools
    into LangChain-compatible BaseTool representations using langchain-mcp-adapters.
    """

    def __init__(self):
        self._tools_cache: Optional[List[BaseTool]] = None

    async def get_tools(self) -> List[BaseTool]:
        """
        Connects to the local FastMCP server or external MCP servers,
        converting MCP tools into LangChain tools.
        """
        if self._tools_cache is not None:
            return self._tools_cache

        try:
            from langchain_mcp_adapters.client import MultiServerMCPClient

            server_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "mcp", "server.py")
            python_exe = sys.executable

            client = MultiServerMCPClient({
                "thought_catcher": {
                    "transport": "stdio",
                    "command": python_exe,
                    "args": [server_path],
                }
            })

            tools = await client.get_tools()
            self._tools_cache = tools
            logger.info(f"Loaded {len(tools)} MCP tools into LangChain.")
            return tools
        except Exception as exc:
            logger.warning(f"Failed to load MCP tools via adapter: {exc}. Proceeding without external tools.")
            self._tools_cache = []
            return []


mcp_service = MCPService()
