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
You are "The Senior Staff Architect" at ArchonAI, known for providing board-ready technical audits. 
Your task is to perform an exhaustive Semantic Audit of the following project.

{context_summary}

INSTRUCTIONS:
1. REVIEW the code for high-level architectural integrity, design patterns (or lack thereof), and semantic security risks that static tools miss.
2. EXECUTIVE SUMMARY: Provide a 3-paragraph professional assessment. Each paragraph must be at least 4-5 sentences long.
   - Paragraph 1: Detailed Overall architectural health and structural integrity.
   - Paragraph 2: Comprehensive Tech stack maturity, parity, and modernization level.
   - Paragraph 3: Specific Strategic outlook and long-term scaling advice.
3. TECHNICAL DEBT: Identify exactly 4 critical debt items. For each, specify:
   - Area (e.g., Domain Logic, Data Persistency, Security Layer)
   - Detailed Issue (be granular, mention specific files or patterns where possible)
   - Business Impact (explain directly how this affects the company's bottom line or engineering velocity)
4. ARCHITECTURAL PIVOT: Suggest one transformative refactoring or infrastructure shift that would move this project towards "Enterprise" grade. Be highly detailed.
5. ADDITIONAL TECH STACK: Use your knowledge to identify any additional frameworks, libraries, or tools mentioned in the code that the static scan might have missed, and categorize them.
6. TECH USAGE: For THE ENTIRE tech stack (including what I provided in project_summary), provide a brief (1-sentence) explanation of how it is being used in this specific project.

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
    "tech_stack_usage": {{
        "TechName": "Brief usage explanation..."
    }},
    "persona": "The Global Staff Architect"
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
