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

    def analyze_repository(self, project_context: Dict[str, Any], file_samples: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Deep semantic analysis of the repository using Groq LLM.
        """
        if not self.client:
            return {"error": "Groq client not initialized (API Key missing)."}

        # Construct the context prompt
        context_summary = f"""
PROJECT SUMMARY:
- Stack: {project_context.get('stack', [])}
- Modularity Score: {project_context.get('modularity', 0)}/100
- Concerns Separation: {project_context.get('concerns_separation', 'Unknown')}
- Standards Check: {project_context.get('standards', {})}
- Security Findings: {len(project_context.get('security_findings', []))} issues detected.

CORE ARCHITECTURE FILES (Samples):
"""
        for sample in file_samples:
            file_content = str(sample.get('content', ''))
            context_summary += f"\n--- FILE: {sample['path']} ---\n{file_content[:2000]}\n"

        prompt = f"""
You are "The Pragmatic Senior Architect" at ArchonAI. 
Your task is to perform a Deep Semantic Audit of the following project metadata and source code samples.

{context_summary}

INSTRUCTIONS:
1. Review the code for logic flaws, architectural anti-patterns, and semantic security risks.
2. Provide a nuanced "Executive Summary" (concise and professional).
3. Identify 3-4 specific "Technical Debt" items with: Area, Issue, and Impact.
4. Suggest one high-impact "Architectural Pivot" (Refactoring recommendation).

OUTPUT FORMAT (JSON):
{{
    "executive_summary": "...",
    "technical_debt": [
        {{"area": "...", "issue": "...", "impact": "..."}}
    ],
    "architectural_pivot": {{
        "title": "...",
        "description": "...",
        "impact": "..."
    }},
    "persona": "The Pragmatic Senior"
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
            return {"error": f"LLM analysis failed: {str(e)}"}
