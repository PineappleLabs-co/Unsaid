import json
import logging
from typing import Literal, Dict, Any, List
from pydantic import BaseModel, Field
from app.config import settings

logger = logging.getLogger(__name__)

class ExpansionResult(BaseModel):
    title: str = Field(..., description="Action-oriented title for this expansion")
    summary: str = Field(..., description="Executive summary of the expanded thought")
    actionable_steps: List[str] = Field(default_factory=list, description="Ordered checklist of actionable next steps")
    insights: List[str] = Field(default_factory=list, description="Key domain insights, research takeaways, or risks")
    suggested_features: List[str] = Field(default_factory=list, description="Recommended features, extensions, or capabilities")

class MultiAgentExpansionEngine:
    def __init__(self, groq_api_key: str = ""):
        self.api_key = groq_api_key or settings.GROQ_API_KEY
        self.model = settings.GROQ_LLAMA_MODEL or "openai/gpt-oss-120b"

    def _get_agent_prompt(self, mode: Literal["plan", "research", "features", "summary"]) -> str:
        if mode == "plan":
            return (
                "You are an expert Project Architect & Execution Strategist. "
                "Analyze the user's note/transcript and generate an execution plan with ordered, actionable milestones. "
                "Respond in valid JSON conforming to this exact schema:\n"
                "{\n"
                '  "title": "Action-oriented project plan title",\n'
                '  "summary": "1-2 sentence executive strategy overview",\n'
                '  "actionable_steps": ["Milestone 1: ...", "Milestone 2: ...", "Milestone 3: ...", "Milestone 4: ..."],\n'
                '  "insights": ["Strategic insight or dependency 1", "Strategic insight 2"],\n'
                '  "suggested_features": ["Enabling tool/feature 1", "Enabling tool/feature 2"]\n'
                "}"
            )
        elif mode == "research":
            return (
                "You are a Senior Market & Technical Research Analyst. "
                "Analyze the user's note/transcript and provide deep domain context, technological feasibility analysis, and comparative insights. "
                "Respond in valid JSON conforming to this exact schema:\n"
                "{\n"
                '  "title": "Research Insights & Market Context",\n'
                '  "summary": "1-2 sentence synthesis of core domain findings",\n'
                '  "actionable_steps": ["Investigate ...", "Benchmark ...", "Validate ..."],\n'
                '  "insights": ["Market/Technical insight 1", "Key risk or opportunity 2", "Competitive landscape nuance 3"],\n'
                '  "suggested_features": ["Exploratory prototype feature 1", "Analytical capability 2"]\n'
                "}"
            )
        elif mode == "features":
            return (
                "You are a Principal Product Manager & System Architect. "
                "Analyze the user's note/transcript and detail concrete features, UX specifications, and acceptance requirements. "
                "Respond in valid JSON conforming to this exact schema:\n"
                "{\n"
                '  "title": "Product Feature Architecture",\n'
                '  "summary": "1-2 sentence description of proposed feature scope",\n'
                '  "actionable_steps": ["Phase 1 Specification: ...", "Phase 2 Core logic: ...", "Phase 3 Edge testing: ..."],\n'
                '  "insights": ["User behavioral consideration 1", "Architectural performance trade-off 2"],\n'
                '  "suggested_features": ["Feature 1 (P0): ...", "Feature 2 (P1): ...", "Feature 3 (P2): ..."]\n'
                "}"
            )
        else: # summary
            return (
                "You are an Executive Idea Synthesizer. "
                "Analyze the user's note/transcript and create a structured summary, extracting core hypotheses and primary decisions. "
                "Respond in valid JSON conforming to this exact schema:\n"
                "{\n"
                '  "title": "Structured Summary & Core Takeaways",\n'
                '  "summary": "1-2 sentence core idea distillation",\n'
                '  "actionable_steps": ["Immediate next step 1", "Immediate next step 2", "Follow-up question 3"],\n'
                '  "insights": ["Core deduction 1", "Key takeaway 2"],\n'
                '  "suggested_features": ["Potential next iteration 1"]\n'
                "}"
            )

    async def expand_thought(
        self,
        text: str,
        mode: Literal["plan", "research", "features", "summary"] = "plan"
    ) -> ExpansionResult:
        system_prompt = self._get_agent_prompt(mode)
        
        # If Groq available, run live LLM
        if self.api_key and self.api_key != "your_groq_api_key_here":
            try:
                from groq import AsyncGroq
                client = AsyncGroq(api_key=self.api_key)
                
                response = await client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Note content:\n\n{text}"}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.2,
                    max_tokens=800
                )
                
                raw_json = response.choices[0].message.content or "{}"
                data = json.loads(raw_json)
                return ExpansionResult(
                    title=data.get("title", f"Expanded {mode.capitalize()}"),
                    summary=data.get("summary", "Expanded analysis completed."),
                    actionable_steps=data.get("actionable_steps", []),
                    insights=data.get("insights", []),
                    suggested_features=data.get("suggested_features", [])
                )
            except Exception as exc:
                logger.warning(f"Groq expansion failed ({exc}), falling back to deterministic synthesis.")

        # Fallback deterministic generator
        clean = text.strip()
        first_line = clean.split("\n")[0][:40]
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
