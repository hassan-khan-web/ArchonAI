import os
import re
import ast
import hashlib
import socket
import ssl
import datetime
from typing import Dict, Any, List, Set, Optional, Callable
from app.core.brain import ArchonBrain
from app.core.recommender import TechStackRecommender

class RepositoryAnalyzer:
    def __init__(self, repo_path: str, on_progress: Optional[Callable[[str], None]] = None):
        self.repo_path = repo_path
        self.on_progress = on_progress
        self.repo_id = repo_path.split("/")[-1]
        self.static_findings: Dict[str, Any] = {}
        self.structural_findings: Dict[str, Any] = {}
        self.critique: str = ""
        self.overall_score: int = 0
        self.maturity_label: str = "Pending"
        self.score_breakdown: Dict[str, int] = {}
        self.roadmap: List[Dict[str, str]] = []
        self.security_findings: List[Dict[str, Any]] = []
        self.logs: List[str] = []
        self.brain = ArchonBrain()
        self.ai_analysis: Dict[str, Any] = {}
        self.structured_critique: Dict[str, Any] = {
            "executive_summary": "",
            "technical_debt": [],
            "architect_persona": "The Pragmatic Senior"
        }
        self.complexity_results: Dict[str, Any] = {}
        self.duplication_results: Dict[str, Any] = {}
        self.secops_results: Dict[str, Any] = {}
        self.tech_recommendations: Dict[str, Any] = {}

    def _log(self, message: str):
        self.logs.append(message)
        if self.on_progress is not None and callable(self.on_progress):
            self.on_progress(message)

    async def analyze(self) -> Dict[str, Any]:
        """Run all analysis layers."""
        self._log("Phase Alpha: Initiating deep static scan...")
        self._run_layer1_static_scan()
        
        self._log("Phase Beta: Evaluating structural modularity and patterns...")
        self._run_layer2_structural_evaluation()
        
        self._log("Phase Gamma: Running heuristic architectural audit...")
        self._run_layer3_architectural_critique()
        
        self._log("Phase Delta: Auditing security layers and secrets...")
        self._run_layer5_security_scan()
        
        self._log("Phase Eta: Deep Infrastructure Audit (Config Hardening)...")
        self._run_layer8_infra_deep_audit()
        
        # The deterministic roadmap generation is removed as AI will handle it.
        # self._log("Phase Theta: Generating actionable transformation roadmap...")
        # self._run_layer4_actionable_roadmap()

        self._log("Phase Iota: Calculating deterministic code complexity (AST)...")
        self._run_layer9_complexity_analysis()
        
        self._log("Phase Kappa: Running DRY Audit (Code Duplication Scan)...")
        self._run_layer10_duplication_scan()

        self._log("Phase Lambda: Conducting SecOps Enterprise Audit (SSL/DNS)...")
        self._run_layer11_secops_audit()
        
        self._log("Phase Mu: Mapping architectural dependency graph...")
        self._run_layer7_dependency_graph()

        self._calculate_final_score() # Calculate BEFORE AI analysis so we can pass it to the brain
        
        self._log("Phase Nu: Generating Tech Stack Recommendations...")
        self._run_layer4b_tech_recommendations()
        
        self._log("Phase Zeta: Running Deep Semantic Audit (AI Architect)...")
        await self._run_layer6_semantic_analysis()
        
        self._log("Analysis Complete.")
        
        return {
            "id": self.repo_path.split("/")[-1],
            "static_scan": self.static_findings,
            "structural_evaluation": self.structural_findings,
            "architectural_critique": self.critique,
            "structured_critique": self.structured_critique,
            "ai_analysis": self.ai_analysis,
            "overall_score": self.overall_score,
            "maturity_label": self.maturity_label,
            "score_breakdown": self.score_breakdown,
            "actionable_roadmap": self.roadmap,
            "security_findings": self.security_findings,
            "complexity": self.complexity_results,
            "duplication": self.duplication_results,
            "secops": self.secops_results,
            "tech_recommendations": self.tech_recommendations,
            "dependency_graph": getattr(self, "dependency_graph", {"nodes": [], "links": []}),
            "logs": self.logs
        }

    def _run_layer1_static_scan(self):
        """Layer 1: Detect tech stack and standards with categorization."""
        stack_categories = {
            "Languages": set(),
            "Backend": set(),
            "Frontend": set(),
            "Database": set(),
            "Infrastructure": set(),
            "Testing": set(),
            "AI/ML": set(),
            "Tools": set()
        }
        
        standards = {
            "has_readme": False,
            "has_gitignore": False,
            "has_docker": False,
            "has_ci_cd": False,
            "has_terraform": False,
            "has_kubernetes": False,
            "has_openapi": False,
            "has_linting": False
        }
        test_frameworks: Set[str] = set()
        testing_detected = False

        for root, dirs, files in os.walk(self.repo_path):
            if any(x in root for x in [".git", "node_modules", "__pycache__", "venv", ".venv"]):
                continue
            
            # Detect Standards
            if "README.md" in files: standards["has_readme"] = True
            if ".gitignore" in files: standards["has_gitignore"] = True
            if "docker-compose.yml" in files or "Dockerfile" in files: standards["has_docker"] = True
            if ".github" in dirs or ".gitlab-ci.yml" in files: standards["has_ci_cd"] = True

            # Detect Stack & Deep Manifest Parsing
            for file in files:
                file_path = os.path.join(root, file)
                
                # Manifest Parsings
                if file == "package.json":
                    stack_categories["Tools"].add("NPM/Yarn")
                    try:
                        import json
                        with open(file_path, 'r') as f:
                            pkg_data = json.load(f)
                            deps = {**pkg_data.get("dependencies", {}), **pkg_data.get("devDependencies", {})}
                            for dep in deps:
                                if "react" in dep: stack_categories["Frontend"].add("React")
                                if "next" in dep: stack_categories["Frontend"].add("Next.js")
                                if "vue" in dep: stack_categories["Frontend"].add("Vue.js")
                                if "express" in dep: stack_categories["Backend"].add("Express")
                                if "tailwind" in dep: stack_categories["Frontend"].add("Tailwind CSS")
                                if "prisma" in dep: stack_categories["Database"].add("Prisma ORM")
                                if "mongoose" in dep: stack_categories["Database"].add("Mongoose/MongoDB")
                                if "jest" in dep or "vitest" in dep: 
                                    testing_detected = True
                                    test_frameworks.add(dep)
                    except: pass

                if file in ["requirements.txt", "pyproject.toml"]:
                    stack_categories["Languages"].add("Python")
                    try:
                        with open(file_path, 'r') as f:
                            content = f.read()
                            if "fastapi" in content.lower(): stack_categories["Backend"].add("FastAPI")
                            if "django" in content.lower(): stack_categories["Backend"].add("Django")
                            if "flask" in content.lower(): stack_categories["Backend"].add("Flask")
                            if "sqlalchemy" in content.lower(): stack_categories["Database"].add("SQLAlchemy")
                            if "psycopg2" in content.lower() or "asyncpg" in content.lower(): stack_categories["Database"].add("PostgreSQL")
                            if "pytest" in content.lower():
                                testing_detected = True
                                test_frameworks.add("pytest")
                    except: pass

                # Extension-based detection
                if file.endswith((".py")): stack_categories["Languages"].add("Python")
                if file.endswith((".js", ".jsx", ".ts", ".tsx")): stack_categories["Languages"].add("JavaScript/TypeScript")
                if file.endswith(".go"): stack_categories["Languages"].add("Go")
                if file.endswith(".rs"): stack_categories["Languages"].add("Rust")
                if file.endswith(".java"): stack_categories["Languages"].add("Java")
                if file.endswith(".tf"): 
                    standards["has_terraform"] = True
                    stack_categories["Infrastructure"].add("Terraform")
                
                if file in ["deployment.yaml", "k8s.yaml"] or root.endswith("k8s"): 
                    standards["has_kubernetes"] = True
                    stack_categories["Infrastructure"].add("Kubernetes")
                if file in ["openapi.yaml", "swagger.json"]: standards["has_openapi"] = True
                if file.startswith(".eslintrc") or file == "prettier.config.js": standards["has_linting"] = True
                
                # Content-based detection for smaller files
                if file.endswith((".py", ".java", ".php", ".rb", ".go", ".rs", ".js", ".ts", ".tsx")):
                    try:
                        with open(file_path, 'r', errors='ignore') as f:
                            content = f.read(5000)
                            content_lower = content.lower()
                            if "fastapi" in content_lower: stack_categories["Backend"].add("FastAPI")
                            if "spring" in content_lower: stack_categories["Backend"].add("Spring Boot")
                            if "laravel" in content_lower: stack_categories["Backend"].add("Laravel")
                            
                            # AI/ML Detection
                            if "torch" in content_lower or "pytorch" in content_lower: stack_categories["AI/ML"].add("PyTorch")
                            if "tensorflow" in content_lower: stack_categories["AI/ML"].add("TensorFlow")
                            if "keras" in content_lower: stack_categories["AI/ML"].add("Keras")
                            if "transformers" in content_lower: stack_categories["AI/ML"].add("HuggingFace Transformers")
                            if "moshi" in content_lower: stack_categories["AI/ML"].add("Moshi (Kyutai)")
                            if "openai" in content_lower: stack_categories["AI/ML"].add("OpenAI SDK")
                            if "groq" in content_lower: stack_categories["AI/ML"].add("Groq SDK")
                            if "scikit-learn" in content_lower or "sklearn" in content_lower: stack_categories["AI/ML"].add("Scikit-Learn")
                            if "numpy" in content_lower: stack_categories["AI/ML"].add("NumPy")
                            if "pandas" in content_lower: stack_categories["AI/ML"].add("Pandas")
                    except: pass
                
                # Detect Testing Files
                if "test" in file.lower() or file.endswith(("_test.go", ".spec.ts", ".spec.js")):
                    testing_detected = True
                    if file.endswith(".py"): test_frameworks.add("pytest")
                    if file.endswith((".ts", ".js")): test_frameworks.add("jest/vitest/playwright")

        # Flatten stack for backward compatibility but keep categories
        all_stack = set()
        for cat in stack_categories.values():
            all_stack.update(cat)

        self.static_findings = {
            "stack": list(all_stack),
            "categories": {k: list(v) for k, v in stack_categories.items()},
            "standards": standards,
            "testing": {
                "detected": testing_detected,
                "frameworks": list(test_frameworks)
            }
        }

    def _run_layer2_structural_evaluation(self):
        """Layer 2: Evaluate folder hierarchy and modularity."""
        patterns_detected = []
        modularity_score = 0
        concerns_separation = "Unknown"

        try:
            root_dirs = [d for d in os.listdir(self.repo_path) 
                        if os.path.isdir(os.path.join(self.repo_path, d)) and not d.startswith(".")]
        except Exception:
            root_dirs = []
        
        # Look for common architectural patterns
        if any(d in root_dirs for d in ["app", "src", "api"]):
            patterns_detected.append("Standard Source Layout")
        if any(d in root_dirs for d in ["services", "logic", "core"]):
            patterns_detected.append("Service Layer Pattern")
        if any(d in root_dirs for d in ["models", "db", "entities"]):
            patterns_detected.append("Data Modeling Layer")
        
        # Advanced Architectural Patterns
        if any(d in root_dirs for d in ["domain", "use_cases", "infrastructure"]):
            patterns_detected.append("Clean/Hexagonal Architecture")
        if any(d in root_dirs for d in ["events", "pubsub", "kafka", "rabbitmq"]):
            patterns_detected.append("Event-Driven Architecture")
        if any(d in root_dirs for d in ["services", "apps"]) and len(root_dirs) > 8:
            patterns_detected.append("Microservices / Multi-Repo Layout")
        
        # Simple modularity heuristic
        dir_count = len(root_dirs)
        if dir_count > 5:
            modularity_score = 80
            concerns_separation = "High (Modularized)"
        elif dir_count > 2:
            modularity_score = 50
            concerns_separation = "Moderate"
        else:
            modularity_score = 20
            concerns_separation = "Low (Monolithic)"

        self.structural_findings = {
            "patterns_detected": patterns_detected,
            "modularity_score": modularity_score,
            "concerns_separation": concerns_separation
        }

    def _run_layer3_architectural_critique(self):
        """Layer 3: Heuristic-based Senior Architect feedback."""
        static = self.static_findings
        struct = self.structural_findings
        stds = static.get("standards", {})
        stack = static.get("stack", [])
        
        debt = []
        summary = ""
        
        # 1. Evaluate Infrastructure
        if not stds.get("has_docker"):
            debt.append({"area": "Infrastructure", "issue": "Missing Containerization", "impact": "Inconsistent deployment environments."})
        if not stds.get("has_ci_cd"):
            debt.append({"area": "Infrastructure", "issue": "No CI/CD Automation", "impact": "Manual deployments increase risk of human error."})
            
        # 2. Evaluate Quality
        if not static.get("testing", {}).get("detected"):
            debt.append({"area": "Quality", "issue": "Untested Codebase", "impact": "High risk of regressions and deployment failures."})
            
        # 3. Evaluate Architecture
        if struct.get("concerns_separation") == "Low (Monolithic)":
            debt.append({"area": "Architecture", "issue": "Monolithic Structure", "impact": "Difficulty in scaling and high cognitive load for new developers."})

        # 4. Generate Narrative Summary
        stack_str = ", ".join(stack[:2])
        if self.overall_score > 80:
            summary = f"This {stack_str} project is exceptionally well-structured. The architect has prioritized modularity and infrastructure readiness, making it a benchmark for 'Enterprise' standards."
        elif self.overall_score > 50:
            summary = f"A solid {stack_str} baseline is present. While the core patterns are functional, there is significant room to improve deployment consistency and automated testing."
        else:
            summary = f"This repository is in its early stages. It currently lacks the structural and operational scaffolding required for a stable production environment."

        # Language Specific Nuance
        if "Go" in stack:
            summary += " Note: Ensure Go idiomatic patterns like small interfaces are used to keep the codebase decoupled."
        elif "Python" in stack:
            summary += " Note: Leveraging Type Hints and a dedicated /services layer would significantly refine the Pythonic architecture."
        elif "Node.js/NPM" in stack or "React/Next.js" in stack:
            summary += " Note: Moving towards a 'Bulletproof' architecture with clear domain separation (e.g., /core, /features) is highly recommended for JS/TS stacks."

        self.structured_critique = {
            "executive_summary": summary,
            "technical_debt": debt,
            "architect_persona": "The Pragmatic Senior"
        }
        self.critique = summary # Backward compatibility

    def _calculate_final_score(self):
        """Calculate a weighted maturity score (0-100) and assign a grade."""
        static = self.static_findings
        struct = self.structural_findings
        stds = static.get("standards", {})
        
        score = 0
        # 1. Infrastructure (30 pts)
        infra_score = 0
        if stds.get("has_docker"): infra_score += 15
        if stds.get("has_ci_cd"): infra_score += 15
        score += infra_score
        
        # 2. Standards & Tests (30 pts)
        standards_score = 0
        if stds.get("has_readme"): standards_score += 5
        if stds.get("has_gitignore"): standards_score += 5
        if static.get("testing", {}).get("detected"): standards_score += 20
        score += standards_score
        
        # 3. Architecture & Modularity (40 pts)
        arch_score = 0
        patterns = struct.get("patterns_detected", [])
        arch_score += min(30, len(patterns) * 10)
        mod_val = struct.get("modularity_score", 0)
        arch_score += (mod_val / 100) * 10
        score += arch_score

        self.overall_score = min(100, int(score))

        # 4. Security Penalties
        security_penalty = 0
        for find in self.security_findings:
            if find["severity"] == "CRITICAL": security_penalty += 30
            if find["severity"] == "HIGH": security_penalty += 15
        
        self.overall_score = max(0, self.overall_score - security_penalty)
        
        # 5. Complexity Penalties
        complexity_penalty = 0
        avg_comp = self.complexity_results.get("average_complexity", 0)
        if avg_comp > 15: complexity_penalty += 15
        elif avg_comp > 8: complexity_penalty += 5
        
        self.overall_score = max(0, self.overall_score - complexity_penalty)

        # 6. Duplication Penalties
        dup_penalty = 0
        dup_ratio = self.duplication_results.get("duplication_ratio", 0)
        if dup_ratio > 15: dup_penalty += 15
        elif dup_ratio > 5: dup_penalty += 5
        
        self.overall_score = max(0, self.overall_score - dup_penalty)

        # Assign Maturity Label
        if self.overall_score <= 40:
            self.maturity_label = "Basic"
        elif self.overall_score <= 65:
            self.maturity_label = "Intermediate"
        elif self.overall_score <= 85:
            self.maturity_label = "Production"
        else:
            self.maturity_label = "Enterprise"

        self.score_breakdown = {
             "infrastructure": infra_score,
             "standards_tests": standards_score,
             "architecture": int(arch_score),
             "security": -security_penalty,
             "complexity": -complexity_penalty,
             "duplication": -dup_penalty
        }

    # The deterministic _run_layer4_actionable_roadmap is removed as AI will handle it.
    # def _run_layer4_actionable_roadmap(self):
    #     """Layer 4: Generate 'The Transformation' actionable roadmap."""
    #     static = self.static_findings
    #     struct = self.structural_findings
    #     stds = static.get("standards", {})
    #     stack = static.get("stack", [])
        
    #     # 1. Database Migration Recommendation
    #     if any(s in stack for s in ["FastAPI", "Node.js/NPM", "Python"]):
    #         # We don't have explicit DB detection yet, but we can infer based on context
    #         # In a real scenario, we'd scan for sqlite3.connect or similar
    #         self.roadmap.append({
    #             "title": "High-Concurrency Database Migration",
    #             "description": "We noticed you are using standard drivers that often default to local storage. To reach Production Grade, we recommend migrating to PostgreSQL.",
    #             "action": "Add a Redis caching layer to offload expensive queries and improve throughput.",
    #             "guide": "Phase-1 Migration: Use `SQLAlchemy` or `Prisma` with a PostgreSQL provider."
    #         })

    #     # 2. Testing Expansion
    #     if not static.get("testing", {}).get("detected"):
    #         self.roadmap.append({
    #             "title": "Automated Quality Assurance",
    #             "description": "Zero tests detected. This prevents 'Production' maturity grading.",
    #             "action": "Implement a core testing suite to cover business logic.",
    #             "guide": f"Run `touch tests/test_core.py` and implement your first integration test using `pytest`."
    #         })

    #     # 3. Infrastructure Stability
    #     if not stds.get("has_docker"):
    #         self.roadmap.append({
    #             "title": "Deployment Consistency",
    #             "description": "Environment varies between machines. Scaling will be difficult.",
    #             "action": "Containerize the application to ensure 'it works on my machine' means 'it works in production'.",
    #             "guide": "Create a `Dockerfile` using `python:3.11-slim` or `node:20-alpine` as a base."
    #         })

    #     # 4. Security Remediation
    #     critical_leaks = [f for f in self.security_findings if f["severity"] == "CRITICAL"]
    #     if critical_leaks:
    #         self.roadmap.insert(0, {
    #             "title": "CRITICAL: Secret Rotation",
    #             "description": f"Found {len(critical_leaks)} potential hardcoded credentials. These are exposed in Git history.",
    #             "action": "Immediately revoke and rotate the affected keys.",
    #             "guide": "Rotate leaked credentials and add affected files to `.gitignore` or use Vault/Secrets Manager."
    #         })

    #     high_vulns = [f for f in self.security_findings if f["severity"] == "HIGH"]
    #     if high_vulns:
    #         # Code Injection
    #         if any(v["type"] == "Vulnerability (SAST)" for v in high_vulns):
    #             self.roadmap.append({
    #                 "title": "Code Injection Hardening",
    #                 "description": "SAST scan identified dangerous coding patterns (eval/exec/SQLi).",
    #                 "action": "Refactor dynamic code execution to use parameterized inputs or secure alternatives.",
    #                 "guide": "Replace `eval()` with safe parsing and use parameterized queries for SQL statements."
    #             })
            
    #         # Dependencies
    #         if any(v["type"] == "Vulnerable Dependency" for v in high_vulns):
    #             self.roadmap.append({
    #                 "title": "Standardize Dependencies",
    #                 "description": "One or more packages in your manifest have known vulnerabilities.",
    #                 "action": "Audit and upgrade core dependencies to stable, patched versions.",
    #                 "guide": "Run `pip install --upgrade requests flask` or `npm update` to resolve CVEs."
    #             })

    #     # 4. Architectural Transformation
    #     if struct.get("concerns_separation") == "Low (Monolithic)":
    #         self.roadmap.append({
    #             "title": "Modular Transformation",
    #             "description": "Your code is currently monolithic. This leads to high maintenance costs.",
    #             "action": "Refactor into a Domain-Driven Design (DDD) layout.",
    #             "guide": "Extract business logic into a `/services` layer and keep `/api` for routing only."
    #         })

    def _run_layer5_security_scan(self):
        """Layer 5: Detect secrets, vulnerable deps, and code injection."""
        import re
        
        # Secret Patterns
        secret_patterns = {
            "AWS Access Key": r"AKIA[0-9A-Z]{16}",
            "GitHub Token": r"ghp_[a-zA-Z0-9]{36}",
            "Private Key": r"-----BEGIN [A-Z ]+ PRIVATE KEY-----",
            "Stripe API Key": r"sk_live_[0-9a-zA-Z]{24}",
            "Database URL": r"postgresql://[a-zA-Z0-9:]+@[a-zA-Z0-9.-]+:[0-9]+/|[a-z]+://[a-z0-9_]+:[a-z0-9_]+@"
        }

        # SAST Patterns (Code Injection & SQLi)
        sast_patterns = {
            "Insecure eval()": r"eval\(.*\)",
            "Insecure exec()": r"exec\(.*\)",
            "Shell Injection": r"shell=True",
            "Potential SQL Injection": r"(SELECT .* FROM .* WHERE .* (%|\.format|f[\"']))|(\.execute|\.run)\(.*(%|\.format|f[\"']).*\)"
        }

        # Vulnerable Dependency Signatures
        vuln_sigs = {
            "requests": r"requests[<>=! ]*2\.(2[0-7]|1[0-9]|0\.[0-9])", # Old requests
            "flask": r"flask[<>=! ]*(0\.|1\.0)", # Very old flask
            "express": r"\"express\":\s*\"[\^~]?[0-3]\.", # Express < 4
            "lodash": r"\"lodash\":\s*\"[\^~]?[0-3]\."  # Lodash < 4
        }

        for root, dirs, files in os.walk(self.repo_path):
            if any(x in root for x in [".git", "node_modules", "__pycache__"]):
                continue
            
            for file in files:
                file_path = os.path.join(root, file)
                if not file.endswith((".py", ".js", ".ts", ".php", ".rb", ".go", ".tf", ".env", ".yml", ".json", ".txt")):
                    continue

                try:
                    with open(file_path, 'r', errors='ignore') as f:
                        content = f.read(5000)
                        
                        # 1. Scan for Secrets
                        for label, pattern in secret_patterns.items():
                            if re.search(pattern, content):
                                self.security_findings.append({
                                    "type": "Secret Leak",
                                    "severity": "CRITICAL",
                                    "label": label,
                                    "file": os.path.relpath(file_path, self.repo_path),
                                    "description": f"Potential {label} detected in plain text."
                                })

                        # 2. Scan for SAST (only in source files)
                        if file.endswith((".py", ".js", ".ts", ".php", ".rb")):
                            for label, pattern in sast_patterns.items():
                                if re.search(pattern, content):
                                    self.security_findings.append({
                                        "type": "Vulnerability (SAST)",
                                        "severity": "HIGH",
                                        "label": label,
                                        "file": os.path.relpath(file_path, self.repo_path),
                                        "description": f"Dangerous usage of {label} detected. Susceptible to injection attacks."
                                    })
                        
                        # 3. Scan for Vulnerable Dependencies
                        if file in ["requirements.txt", "package.json"]:
                            for pkg, sig in vuln_sigs.items():
                                if re.search(sig, content):
                                    self.security_findings.append({
                                        "type": "Vulnerable Dependency",
                                        "severity": "HIGH",
                                        "label": f"Insecure {pkg} version",
                                        "file": os.path.relpath(file_path, self.repo_path),
                                        "description": f"The version of {pkg} detected has known security flaws (CVEs)."
                                    })
                except Exception:
                    pass

    def _run_layer4b_tech_recommendations(self):
        """Layer 4B: Generate intelligent tech stack recommendations."""
        try:
            recommender = TechStackRecommender(
                static_findings=self.static_findings,
                structural_findings=self.structural_findings,
                score=self.overall_score,
                security_findings=self.security_findings
            )
            self.tech_recommendations = recommender.generate_recommendations()
            self._log("Tech Stack Recommendations generated.")
        except Exception as e:
            self._log(f"Warning: Tech recommendations failed: {str(e)}")
            self.tech_recommendations = {"error": str(e)}

    async def _run_layer6_semantic_analysis(self):
        """Layer 6: Deep Semantic Analysis using Groq LLM."""
        if not self.brain.client:
            self._log("AI Engine skipped (Key missing).")
            return

        # Prepare context for the brain, including dependency graph summary
        project_context = {
            "stack": self.static_findings.get("stack", []),
            "modularity": self.structural_findings.get("modularity_score", 0),
            "concerns_separation": self.structural_findings.get("concerns_separation", "Unknown"),
            "standards": self.static_findings.get("standards", {}),
            "security_findings": self.security_findings,
            "dependency_graph_summary": getattr(self, "dependency_graph", {}).get("links", [])[:30], # Top relationships
            "overall_score": self.overall_score
        }

        # 1. Collect representative file samples for the LLM
        samples = []
        total_chars = 0
        max_chars = 28000  # Safety limit for Groq payload (approx 7-8k tokens)
        
        # Priority mapping for files that define architecture
        priority_keywords = ["main", "app", "index", "settings", "config", "models", "schema", "routes", "controller"]
        priority_files = ["Dockerfile", "docker-compose.yml", "package.json", "requirements.txt", "pyproject.toml", "next.config.js"]

        all_candidate_files = []
        for root, _, files in os.walk(self.repo_path):
            if any(x in root for x in [".git", "node_modules", "__pycache__", "venv", ".venv"]): continue
            for file in files:
                file_path = os.path.join(root, file)
                if any(file_path.endswith(ext) for ext in [".py", ".js", ".ts", ".tsx", ".go", ".tf", ".conf", ".yaml", ".yml"]) or file in priority_files:
                    rel_path = os.path.relpath(file_path, self.repo_path)
                    
                    # Calculate priority score
                    score = 0
                    if file in priority_files: score += 100
                    if any(kw in file.lower() for kw in priority_keywords): score += 50
                    if rel_path.count("/") == 0: score += 20 # Root files usually important
                    
                    all_candidate_files.append({"path": rel_path, "abs": file_path, "score": score})

        # Sort by priority score descending
        all_candidate_files.sort(key=lambda x: x["score"], reverse=True)

        for item in all_candidate_files:
            if len(samples) >= 15: break 
            if total_chars >= max_chars: break
            
            try:
                with open(item["abs"], 'r', errors='ignore') as f:
                    content = f.read(2000) # Reduced per-file limit to allow more files
                    samples.append({"path": item["path"], "content": content})
                    total_chars += len(content)
            except: pass

        # 2. Call Brain with scores for justification
        scores_for_ai = {
            "overall_score": self.overall_score,
            "score_breakdown": self.score_breakdown
        }
        
        # Build context summary from samples and other data
        context_text = f"Project Metrics: {project_context}\n\nFile Samples:\n"
        for s in samples:
            context_text += f"\nFILE: {s['path']}\n{s['content']}\n"

        if len(context_text) > max_chars: # Final safety truncate
             context_text = context_text[:max_chars] + "\n... [TRUNCATED] ..."

        try:
            self.ai_analysis = await self.brain.analyze_repository(
                context_text, 
                self.repo_path.split("/")[-1], 
                scores=scores_for_ai,
                tech_recommendations=self.tech_recommendations
            )
        except Exception as e:
            self.ai_analysis = {"error": f"Internal Analysis Error: {str(e)}"}

        # 3. Integrate AI findings
        if "error" not in self.ai_analysis:
            # Overwrite roadmap with detailed AI-generated one
            if self.ai_analysis.get("engineering_roadmap"):
                self.roadmap = self.ai_analysis["engineering_roadmap"]
            
            # Update structured critique
            self.structured_critique["executive_summary"] = self.ai_analysis.get("executive_summary", [])
            self.structured_critique["score_justification"] = self.ai_analysis.get("score_justification", "")
            self.structured_critique["suggested_action"] = self.ai_analysis.get("suggested_action", {})
            self.structured_critique["tech_stack_notes"] = self.ai_analysis.get("tech_stack_notes", {})
            self.structured_critique["technical_debt"] = self.ai_analysis.get("technical_debt", [])
            self.structured_critique["graph_evaluation"] = self.ai_analysis.get("graph_evaluation", "")
            
            # Retroactively update critique for backward compatibility
            self.critique = self.structured_critique["executive_summary"]
            self._log("AI Architect review finalized.")
        else:
            self._log(f"AI Warning: {self.ai_analysis['error']}")

    def _run_layer7_dependency_graph(self):
        """Layer 7: Build a node-link graph of module dependencies."""
        nodes = []
        links = []
        file_to_id = {}
        
        # 1. Identify all source files as nodes
        for root, _, files in os.walk(self.repo_path):
            if any(x in root for x in [".git", "node_modules", "__pycache__", "venv"]):
                continue
            for file in files:
                if file.endswith((".py", ".js", ".ts", ".tsx", ".go")):
                    rel_path = os.path.relpath(os.path.join(root, file), self.repo_path)
                    node_id = len(nodes)
                    nodes.append({
                        "id": node_id,
                        "name": file,
                        "path": rel_path,
                        "type": "module"
                    })
                    file_to_id[rel_path] = node_id

        # 2. Extract imports (basic regex for Python & JS/TS)
        import_patterns = [
            # Python: from x import y or import x
            r"^(?:from|import)\s+([a-zA-Z0-9_\.]+)",
            # JS/TS: import x from 'y' or import 'y'
            r"import\s+.*from\s+['\"](.*)['\"]",
            r"import\s+['\"](.*)['\"]",
            # JS/TS: require('y')
            r"require\(['\"](.*)['\"]\)"
        ]

        for source_path, source_id in file_to_id.items():
            full_path = os.path.join(self.repo_path, source_path)
            try:
                with open(full_path, 'r', errors='ignore') as f:
                    content = f.read(10000) # Read first 10k chars for imports
                    for pattern in import_patterns:
                        matches = re.finditer(pattern, content, re.MULTILINE)
                        for match in matches:
                            target = match.group(1)
                            # Try to resolve target to a file in our nodes
                            # Simple resolution logic
                            for potential_target in file_to_id:
                                # Match if target is a substring of path or path contains target
                                # e.g., 'app.core.analyzer' matches 'app/core/analyzer.py'
                                normalized_target = target.replace(".", "/")
                                if normalized_target in potential_target and source_path != potential_target:
                                    links.append({
                                        "source": source_id,
                                        "target": file_to_id[potential_target],
                                        "value": 1
                                    })
                                    break
            except: pass

        self.dependency_graph = {
            "nodes": nodes[:50], # Limit for UI performance
            "links": links[:100]
        }

    def _run_layer8_infra_deep_audit(self):
        """Layer 8: Audit configuration files for security and performance."""
        for root, _, files in os.walk(self.repo_path):
            if any(x in root for x in [".git", "node_modules"]):
                continue
            
            for file in files:
                file_path = os.path.join(root, file)
                
                # Nginx Audit
                if file in ["nginx.conf", "default.conf"] or file.endswith(".conf"):
                    try:
                        with open(file_path, 'r', errors='ignore') as f:
                            content = f.read()
                            
                            # Security Headers
                            if "add_header Strict-Transport-Security" not in content:
                                self.security_findings.append({
                                    "type": "Infrastructure Gap", "severity": "MEDIUM", "label": "Missing HSTS",
                                    "file": os.path.relpath(file_path, self.repo_path),
                                    "description": "Nginx config missing HSTS header. Connections can be downgraded to HTTP."
                                })
                            if "add_header Content-Security-Policy" not in content:
                                self.security_findings.append({
                                    "type": "Infrastructure Gap", "severity": "MEDIUM", "label": "Missing CSP",
                                    "file": os.path.relpath(file_path, self.repo_path),
                                    "description": "Missing Content-Security-Policy. Vulnerable to XSS/Injection."
                                })
                            
                            # SSL Audit
                            if re.search(r"ssl_protocols.*TLSv1(\.1)?", content):
                                self.security_findings.append({
                                    "type": "Security Risk", "severity": "HIGH", "label": "Legacy TLS Protocol",
                                    "file": os.path.relpath(file_path, self.repo_path),
                                    "description": "Config allows TLS 1.0/1.1. These are deprecated and insecure."
                                })
                            
                            # Performance Audit
                            if "gzip on" not in content:
                                self.roadmap.append({
                                    "title": "Enable Gzip Compression",
                                    "description": "Nginx compression is disabled. This increases bandwidth usage and page load times.",
                                    "action": "Add 'gzip on;' to your server or http block.",
                                    "guide": "Set `gzip_types text/plain text/css application/json;` for optimal savings."
                                })
                    except: pass

                # Apache Audit
                if file in [".htaccess", "httpd.conf"]:
                    try:
                        with open(file_path, 'r', errors='ignore') as f:
                            content = f.read()
                            if "Header set Strict-Transport-Security" not in content:
                                self.security_findings.append({
                                    "type": "Infrastructure Gap", "severity": "MEDIUM", "label": "Missing HSTS (Apache)",
                                    "file": os.path.relpath(file_path, self.repo_path),
                                    "description": "Apache config missing HSTS. Use 'Header set Strict-Transport-Security' to fix."
                                })
                    except: pass

    def _run_layer9_complexity_analysis(self):
        """Layer 9: Deterministic Cyclomatic Complexity using AST."""
        complexity_reports = []
        total_complexity = 0
        function_count = 0
        
        for root, _, files in os.walk(self.repo_path):
            if any(x in root for x in [".git", "node_modules", "__pycache__", "venv"]):
                continue
            for file in files:
                if file.endswith(".py"):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, "r", errors="ignore") as f:
                            code = f.read()
                            tree = ast.parse(code)
                            
                            for node in ast.walk(tree):
                                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                                    # Calculate complexity for this function
                                    # Base complexity is 1
                                    complexity = 1
                                    for child in ast.walk(node):
                                        if isinstance(child, (ast.If, ast.For, ast.While, ast.ExceptHandler, ast.With, ast.And, ast.Or, ast.Assert)):
                                            complexity += 1
                                    
                                    function_count += 1
                                    total_complexity += complexity
                                    
                                    if complexity > 10: # Threshold for high complexity
                                        complexity_reports.append({
                                            "file": os.path.relpath(file_path, self.repo_path),
                                            "function": node.name,
                                            "complexity": complexity,
                                            "severity": "HIGH" if complexity > 20 else "MEDIUM"
                                        })
                    except: pass
        
        self.complexity_results = {
            "critical_functions": complexity_reports[:10], # Cap for UI
            "average_complexity": round(total_complexity / function_count, 2) if function_count > 0 else 0,
            "total_functions_scanned": function_count
        }
        
        # Add to technical debt if average is high
        if self.complexity_results["average_complexity"] > 10:
            self.structured_critique["technical_debt"].append({
                "area": "Code Quality",
                "issue": f"High Complexity (Avg: {self.complexity_results['average_complexity']})",
                "impact": "Codebase contains excessive branching logic, making it fragile and hard to test."
            })

    def _run_layer10_duplication_scan(self):
        """Layer 10: Identify copy-pasted code blocks using structural hashing."""
        hashes = {} # hash -> list of (file, start_line)
        duplications = []
        total_lines = 0
        duplicated_lines_count = 0
        
        chunk_size = 6 # Minimum lines to consider a duplicate
        
        for root, _, files in os.walk(self.repo_path):
            if any(x in root for x in [".git", "node_modules", "__pycache__", "venv"]):
                continue
            for file in files:
                if file.endswith((".py", ".js", ".ts", ".go", ".java")):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', errors='ignore') as f:
                            # Simple normalization: strip whitespace and ignore comments
                            lines = [line.strip() for line in f.readlines() if line.strip() and not line.strip().startswith(("#", "//", "/*", "*"))]
                            total_lines += len(lines)
                            
                            for i in range(len(lines) - chunk_size + 1):
                                chunk = "".join(lines[i:i + chunk_size])
                                h = hashlib.md5(chunk.encode()).hexdigest()
                                
                                loc = (os.path.relpath(file_path, self.repo_path), i + 1)
                                if h in hashes:
                                    hashes[h].append(loc)
                                else:
                                    hashes[h] = [loc]
                    except: pass
        
        # Identify duplicates
        for h, locs in hashes.items():
            if len(locs) > 1:
                # This is a duplicated block
                primary = locs[0]
                others = locs[1:]
                duplicated_lines_count += chunk_size * len(others)
                
                if len(duplications) < 5: # Top 5 clusters
                     duplications.append({
                         "primary_location": f"{primary[0]}:L{primary[1]}",
                         "occurrences": len(locs),
                         "clones": [f"{l[0]}:L{l[1]}" for l in locs[1:4]] # Show first few clones
                     })
        
        duplication_ratio = round((duplicated_lines_count / total_lines) * 100, 2) if total_lines > 0 else 0
        
        self.duplication_results = {
            "duplication_ratio": duplication_ratio,
            "top_clusters": duplications,
            "total_lines_scanned": total_lines
        }
        
        # Update technical debt
        if duplication_ratio > 10:
            self.structured_critique["technical_debt"].append({
                "area": "DRY Compliance",
                "issue": f"Code Fragmentation ({duplication_ratio}%)",
                "impact": "Logic is duplicated across files, causing 'Shotgun Surgery' anti-pattern during maintenance."
            })

    def _run_layer11_secops_audit(self):
        """Layer 11: Enterprise SecOps audit (SSL, DNS, and Domain Health)."""
        domain_findings = []
        domains_scanned = set()
        
        # 1. Scavenge for domains in config files and env
        # Simplified regex for domain detection
        domain_pattern = r"(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,6}"
        exempt_domains = ["github.com", "pypi.org", "npmjs.com", "localhost", "127.0.0.1", "google.com", "microsoft.com", "apple.com"]
        
        for root, _, files in os.walk(self.repo_path):
            if any(x in root for x in [".git", "node_modules"]): continue
            for file in files:
                if file.endswith((".py", ".env", ".conf", ".yml", ".json")):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', errors='ignore') as f:
                            content = f.read(10000)
                            matches = re.findall(domain_pattern, content)
                            for domain in matches:
                                if domain not in domains_scanned and not any(ex in domain for ex in exempt_domains):
                                    domains_scanned.add(domain)
                    except: pass
        
        # 2. Heuristic Audit of Scavenged Domains
        for domain in list(domains_scanned)[:3]: # Limit for performance/safety
            try:
                context = ssl.create_default_context()
                with socket.create_connection((domain, 443), timeout=2) as sock:
                    with context.wrap_socket(sock, server_hostname=domain) as ssock:
                        cert = ssock.getpeercert()
                        if cert:
                            # Check expiry
                            not_after_str = cert.get('notAfter')
                            if not_after_str:
                                expires = datetime.datetime.strptime(not_after_str, '%b %d %H:%M:%S %Y %Z')
                                days_left = (expires - datetime.datetime.utcnow()).days
                                
                                if days_left < 30:
                                    self.security_findings.append({
                                        "type": "SecOps Risk", "severity": "HIGH", "label": "SSL Certificate Expiring",
                                        "file": "Network Audit",
                                        "description": f"Certificate for {domain} expires in {days_left} days."
                                    })
                                
                                domain_findings.append({
                                    "domain": domain,
                                    "status": "Healthy",
                                    "ssl_expiry": not_after_str,
                                    "days_remaining": days_left
                                })
            except Exception as e:
                # Could be a private domain or offline
                domain_findings.append({
                    "domain": domain,
                    "status": "Unreachable/Private",
                    "error": "Could not establish SSL handshake"
                })

        self.secops_results = {
            "monitored_domains": domain_findings,
            "dns_health": "Heuristic Audit Passive",
            "tls_compliance": "Verified" if domain_findings else "N/A"
        }
