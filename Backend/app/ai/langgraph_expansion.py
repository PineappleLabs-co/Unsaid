import os
import json
import logging
from typing import Literal, Dict, Any, List, Optional, TypedDict
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.language_models.chat_models import BaseChatModel

from app.config import settings
from app.ai.model_factory import get_chat_model
from app.ai.guardrails import sanitize_input_text

logger = logging.getLogger(__name__)


class ExpansionResult(BaseModel):
    title: str = Field(..., description="Action-oriented title for this expansion")
    summary: str = Field(..., description="Executive summary of the expanded thought")
    actionable_steps: List[str] = Field(default_factory=list, description="Ordered checklist of actionable next steps")
    insights: List[str] = Field(default_factory=list, description="Key domain insights, research takeaways, or risks")
    suggested_features: List[str] = Field(default_factory=list, description="Recommended features, extensions, or capabilities")


class ThoughtAgentState(TypedDict):
    raw_text: str
    mode: Literal["plan", "research", "features", "summary"]
    provider: Optional[str]
    model_name: Optional[str]
    system_prompt: str
    result: Optional[ExpansionResult]
    error: Optional[str]
    retry_count: int


def _get_agent_prompt(mode: Literal["plan", "research", "features", "summary"]) -> str:
    if mode == "plan":
        return (
            "You are an expert Project Architect & Execution Strategist. "
            "Analyze the user's note/transcript and generate an execution plan with ordered, actionable milestones. "
            "Respond in valid JSON with fields: title, summary, actionable_steps, insights, suggested_features."
        )
    elif mode == "research":
        return (
            "You are a Senior Market & Technical Research Analyst. "
            "Analyze the user's note/transcript and provide deep domain context, technological feasibility analysis, and comparative insights. "
            "Respond in valid JSON with fields: title, summary, actionable_steps, insights, suggested_features."
        )
    elif mode == "features":
        return (
            "You are a Principal Product Manager & System Architect. "
            "Analyze the user's note/transcript and detail concrete features, UX specifications, and acceptance requirements. "
            "Respond in valid JSON with fields: title, summary, actionable_steps, insights, suggested_features."
        )
    else:  # summary
        return (
            "You are an Executive Idea Synthesizer. "
            "Analyze the user's note/transcript and create a structured summary, extracting core hypotheses and primary decisions. "
            "Respond in valid JSON with fields: title, summary, actionable_steps, insights, suggested_features."
        )


def _generate_fallback_result(text: str, mode: str) -> ExpansionResult:
    clean = text.strip()
    first_line = clean.split("\n")[0][:40] or "Captured Idea"
    return ExpansionResult(
        title=f"Structured {mode.capitalize()}: {first_line}",
        summary=f"Analysis of: {clean[:120]}...",
        actionable_steps=[
            f"Break down requirements for {first_line}",
            "Identify necessary resources and architecture components",
            "Execute first prototype validation sprint",
            "Review user feedback and refine execution strategy"
        ],
        insights=[
            "Execution speed improves by validating assumptions early.",
            "Clear milestone checklists reduce cognitive friction."
        ],
        suggested_features=[
            "Interactive progress tracker",
            "Export plan to Markdown / PDF"
        ]
    )


class LangGraphExpansionEngine:
    """
    LangGraph-powered stateful multi-agent expansion engine with switchable LLM backends.
    """

    def __init__(self):
        self.app = self._build_graph()

    def _build_graph(self):
        try:
            from langgraph.graph import StateGraph, END

            workflow = StateGraph(ThoughtAgentState)

            # Node 1: Route and prepare prompt
            def prepare_node(state: ThoughtAgentState) -> Dict[str, Any]:
                prompt = _get_agent_prompt(state["mode"])
                clean_text = sanitize_input_text(state["raw_text"])
                return {"system_prompt": prompt, "raw_text": clean_text}

            # Node 2: Execute LLM with structured output
            async def execute_agent_node(state: ThoughtAgentState) -> Dict[str, Any]:
                provider = state.get("provider")
                model_name = state.get("model_name")
                chat_model = get_chat_model(provider=provider, model_name=model_name)

                if chat_model is None:
                    fallback = _generate_fallback_result(state["raw_text"], state["mode"])
                    return {"result": fallback, "error": None}

                try:
                    # Use LangChain Structured Output
                    structured_llm = chat_model.with_structured_output(ExpansionResult)
                    response = await structured_llm.ainvoke([
                        SystemMessage(content=state["system_prompt"]),
                        HumanMessage(content=f"Note content:\n\n{state['raw_text']}")
                    ])
                    if isinstance(response, ExpansionResult):
                        return {"result": response, "error": None}
                    elif isinstance(response, dict):
                        return {"result": ExpansionResult(**response), "error": None}
                    else:
                        fallback = _generate_fallback_result(state["raw_text"], state["mode"])
                        return {"result": fallback, "error": None}
                except Exception as exc:
                    logger.warning(f"LangChain agent invocation failed: {exc}. Using fallback generator.")
                    fallback = _generate_fallback_result(state["raw_text"], state["mode"])
                    return {"result": fallback, "error": str(exc)}

            # Node 3: Validation and normalization guardrail
            def validator_node(state: ThoughtAgentState) -> Dict[str, Any]:
                res = state.get("result")
                if not res:
                    res = _generate_fallback_result(state["raw_text"], state["mode"])
                return {"result": res}

            workflow.add_node("prepare", prepare_node)
            workflow.add_node("execute_agent", execute_agent_node)
            workflow.add_node("validate", validator_node)

            workflow.set_entry_point("prepare")
            workflow.add_edge("prepare", "execute_agent")
            workflow.add_edge("execute_agent", "validate")
            workflow.add_edge("validate", END)

            return workflow.compile()
        except Exception as e:
            logger.warning(f"Failed to compile LangGraph workflow ({e}), fallback runtime enabled.")
            return None

    async def expand_thought(
        self,
        text: str,
        mode: Literal["plan", "research", "features", "summary"] = "plan",
        provider: Optional[str] = None,
        model_name: Optional[str] = None,
    ) -> ExpansionResult:
        if self.app is not None:
            try:
                initial_state: ThoughtAgentState = {
                    "raw_text": text,
                    "mode": mode,
                    "provider": provider,
                    "model_name": model_name,
                    "system_prompt": "",
                    "result": None,
                    "error": None,
                    "retry_count": 0,
                }
                final_state = await self.app.ainvoke(initial_state)
                if final_state and final_state.get("result"):
                    return final_state["result"]
            except Exception as exc:
                logger.error(f"LangGraph execution error: {exc}")

        # Direct fallback
        return _generate_fallback_result(text, mode)


# Global engine singleton
langgraph_expansion_engine = LangGraphExpansionEngine()
