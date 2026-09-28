import pytest
import asyncio
from app.ai.langgraph_expansion import LangGraphExpansionEngine, ExpansionResult
from app.ai.model_factory import get_chat_model
from app.mcp.server import mcp_server, search_thoughts, format_plan_markdown


@pytest.mark.asyncio
async def test_langgraph_expansion_engine_modes():
    engine = LangGraphExpansionEngine()
    test_text = "Build a mobile application that captures voice notes and summarizes them into actionable task plans."

    for mode in ["plan", "research", "features", "summary"]:
        result = await engine.expand_thought(text=test_text, mode=mode)
        assert isinstance(result, ExpansionResult)
        assert len(result.title) > 0
        assert len(result.summary) > 0
        assert len(result.actionable_steps) > 0
        assert len(result.insights) > 0


def test_model_factory_defaults():
    # Without keys configured, should gracefully return None for safe fallback
    model = get_chat_model(provider="groq", api_key="")
    assert model is None

    model_invalid = get_chat_model(provider="unknown_provider")
    assert model_invalid is None


def test_mcp_tools():
    # Test search_thoughts tool
    res = search_thoughts("productivity app", limit=3)
    assert "productivity app" in res

    # Test format_plan_markdown tool
    md = format_plan_markdown(
        title="Voice App Launch Plan",
        actionable_steps=["Set up repo", "Implement audio capture", "Deploy backend"],
        insights=["Voice UX needs high responsiveness"],
        suggested_features=["Export to PDF"]
    )
    assert "# Voice App Launch Plan" in md
    assert "**Step 1:** Set up repo" in md
    assert "Export to PDF" in md
