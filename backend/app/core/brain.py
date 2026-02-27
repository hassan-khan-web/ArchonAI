import os
import json
from typing import Dict, Any, List, Optional
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

class ArchonBrain:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if self.api_key:
            self.client = Groq(api_key=self.api_key)
        else:
            self.client = None
            print("Warning: GROQ_API_KEY not found. Semantic Audit will be disabled.")

    async def analyze_repository(self, context_summary: str, repo_id: str, scores: Dict[str, Any] = None) -> Dict[str, Any]:
        """Orchestrate LLM analysis for a repository."""
        if not self.client:
            return {"error": "Groq client not initialized (API Key missing)."}

        overall_score = scores.get("overall_score", "Unknown") if scores else "Unknown"
        score_breakdown = scores.get("score_breakdown", {}) if scores else {}

        prompt = f"""
You are "The Senior Global Architect" at ArchonAI. Your mission is to provide an exhaustive, high-density technical audit from A to Z. 

PROJECT CONTEXT:
{context_summary}

AUDIT METRICS:
Overall Score: {overall_score}/100
Breakdown: {score_breakdown}

INSTRUCTIONS:
1. REVIEW (A to Z): Provide a comprehensive professional assessment. Do not mention the AI model or any internal engine names.
   - Paragraph 1: Detailed audit of the current state of the codebase. Covering everything from structure to parity.
   - Paragraph 2: SCORE JUSTIFICATION. Explain specifically why the score of {overall_score} was assigned. Reference the strengths and the specific penalties that influenced it.
   - Paragraph 3: Strategic vision and production readiness assessment.
2. ENGINEERING ROADMAP: Provide a list of exactly 4 detailed engineering evolution steps. Each step must be a full paragraph (4-5 sentences) describing what technical updates are required and exactly what tools/libraries the developer should use to implement them.
3. SUGGESTED ACTION: One major transformative shift presented as a logical, detailed recommendation paragraph. This is a core architectural advice for the user.
4. TECH STACK NOTES: For the detected tech stack, provide a brief (1-2 sentences) note for EACH specific tool/library, explaining exactly where and how it is being utilized in this specific project.
5. NEURAL DEBT AUDIT: Identify exactly 4 critical debt items. For each, provide an exhaustive paragraph that covers the Area, the precise technical Issue, and the long-term Business Impact. Do not truncate; be detailed.
6. ARCHITECTURAL GRAPH EVALUATION: Provide a single paragraph evaluating the dependency relationships and modularity of the graph. This will be displayed below the graph visualization.
7. NO SNIPPETS: Use plain, professional English. No code blocks or snippets in textual fields.

OUTPUT FORMAT (JSON):
{{
    "executive_summary": ["Paragraph 1...", "Paragraph 2...", "Paragraph 3..."],
    "score_justification": "Detailed explanation...",
    "engineering_roadmap": [
        {{"title": "...", "detail": "Full paragraph..."}}
    ],
    "suggested_action": {{
        "title": "...",
        "paragraph": "..."
    }},
    "tech_stack_notes": {{
        "ToolName": "Brief note on location/usage..."
    }},
    "technical_debt": [
        {{"title": "...", "paragraph": "Exhaustive paragraph..."}}
    ],
    "graph_evaluation": "Detailed paragraph..."
}}
"""

        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional software architect providing structural feedback in JSON format."
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model="llama-3.3-70b-versatile",
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            return json.loads(chat_completion.choices[0].message.content)
        except Exception as e:
            error_msg = str(e)
            if "413" in error_msg or "rate_limit_exceeded" in error_msg:
                return {"error": "Project context is too large for the current AI tier. Reducing the number of files or upgrading your Groq plan may help."}
            return {"error": f"LLM analysis failed: {error_msg}"}
