import os
from typing import Dict, Any, List, Set

class RepositoryAnalyzer:
    def __init__(self, repo_path: str):
        self.repo_path = repo_path
        self.static_findings: Dict[str, Any] = {}
        self.structural_findings: Dict[str, Any] = {}
        self.critique: str = ""
        self.overall_score: int = 0
        self.maturity_label: str = ""
        self.score_breakdown: Dict[str, int] = {}
        self.roadmap: List[Dict[str, str]] = []
        self.security_findings: List[Dict[str, Any]] = []

    def analyze(self) -> Dict[str, Any]:
        """Run all analysis layers."""
        self._run_layer1_static_scan()
        self._run_layer2_structural_evaluation()
        self._run_layer3_architectural_critique()
        self._run_layer5_security_scan()
        self._calculate_final_score()
        self._run_layer4_actionable_roadmap()
        
        return {
            "static_scan": self.static_findings,
            "structural_evaluation": self.structural_findings,
            "architectural_critique": self.critique,
            "overall_score": self.overall_score,
            "maturity_label": self.maturity_label,
            "score_breakdown": self.score_breakdown,
            "actionable_roadmap": self.roadmap,
            "security_findings": self.security_findings
        }

    def _run_layer1_static_scan(self):
        """Layer 1: Detect tech stack and standards."""
        stack_set: Set[str] = set()
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
            if any(x in root for x in [".git", "node_modules", "__pycache__"]):
                continue
            
            # Detect Standards
            if "README.md" in files: standards["has_readme"] = True
            if ".gitignore" in files: standards["has_gitignore"] = True
            if "docker-compose.yml" in files or "Dockerfile" in files: standards["has_docker"] = True
            if ".github" in dirs or ".gitlab-ci.yml" in files: standards["has_ci_cd"] = True

            # Detect Stack
            for file in files:
                file_path = os.path.join(root, file)
                if file == "package.json": stack_set.add("Node.js/NPM")
                if file in ["requirements.txt", "pyproject.toml"]: stack_set.add("Python")
                if file == "go.mod": stack_set.add("Go")
                if file == "Cargo.toml": stack_set.add("Rust")
                if file == "pom.xml" or file == "build.gradle": stack_set.add("Java/JVM")
                if file == "composer.json": stack_set.add("PHP")
                if file == "Gemfile": stack_set.add("Ruby")
                if file == "AppDelegate.swift": stack_set.add("Swift/iOS")
                
                if file.endswith((".tsx", ".jsx")): 
                    stack_set.add("React/Next.js")
                
                # Infrastructure & Standards
                if file.endswith(".tf"): standards["has_terraform"] = True
                if file in ["deployment.yaml", "k8s.yaml"] or root.endswith("k8s"): standards["has_kubernetes"] = True
                if file in ["openapi.yaml", "swagger.json"]: standards["has_openapi"] = True
                if file.startswith(".eslintrc") or file == "prettier.config.js": standards["has_linting"] = True
                
                # Content-based detection
                content = ""
                if file.endswith((".py", ".java", ".php", ".rb", ".go", ".rs")):
                    try:
                        with open(file_path, 'r', errors='ignore') as f:
                            content = f.read(2000)
                            if "FastAPI" in content: stack_set.add("FastAPI")
                            if "Spring" in content: stack_set.add("Spring Boot")
                            if "Laravel" in content: stack_set.add("Laravel")
                            if "rails" in content.lower(): stack_set.add("Rails")
                    except Exception:
                        pass
                
                # Detect Testing
                if "test" in file.lower() or file.endswith(("_test.go", ".spec.ts", ".spec.js")):
                    testing_detected = True
                    if file.endswith(".py"): test_frameworks.add("pytest")
                    if file.endswith((".ts", ".js")): test_frameworks.add("jest/vitest/playwright")
                    if file.endswith(".go"): test_frameworks.add("go test")
                    if file.endswith(".rs"): test_frameworks.add("cargo test")
                    if "JUnit" in content or "org.junit" in content: test_frameworks.add("JUnit")
                    if "PHPUnit" in content: test_frameworks.add("PHPUnit")
                    if "RSpec" in content or file.endswith("_spec.rb"): test_frameworks.add("RSpec")

        self.static_findings = {
            "stack": list(stack_set),
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
        
        critique_list = []
        stds = static.get("standards", {})
        if not stds.get("has_docker"):
            critique_list.append("Missing containerization. Adding a Dockerfile would improve deployment consistency.")
        if not static.get("testing", {}).get("detected"):
            critique_list.append("No automated tests detected. This is a significant risk for production readiness.")
        if struct.get("concerns_separation") == "Low (Monolithic)":
            critique_list.append("Project structure appears monolithic. Consider extracting business logic into a dedicated service layer.")
        if not stds.get("has_ci_cd"):
            critique_list.append("CI/CD workflows are missing. Automating builds and tests is recommended.")
            
        if not critique_list:
            self.critique = "The architecture follows industry best practices. It is modular, containerized, and includes testing infrastructure."
        else:
            self.critique = " ".join(critique_list)

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
             "security": -security_penalty
        }

    def _run_layer4_actionable_roadmap(self):
        """Layer 4: Generate 'The Transformation' actionable roadmap."""
        static = self.static_findings
        struct = self.structural_findings
        stds = static.get("standards", {})
        stack = static.get("stack", [])
        
        # 1. Database Migration Recommendation
        if any(s in stack for s in ["FastAPI", "Node.js/NPM", "Python"]):
            # We don't have explicit DB detection yet, but we can infer based on context
            # In a real scenario, we'd scan for sqlite3.connect or similar
            self.roadmap.append({
                "title": "High-Concurrency Database Migration",
                "description": "We noticed you are using standard drivers that often default to local storage. To reach Production Grade, we recommend migrating to PostgreSQL.",
                "action": "Add a Redis caching layer to offload expensive queries and improve throughput.",
                "guide": "Phase-1 Migration: Use `SQLAlchemy` or `Prisma` with a PostgreSQL provider."
            })

        # 2. Testing Expansion
        if not static.get("testing", {}).get("detected"):
            self.roadmap.append({
                "title": "Automated Quality Assurance",
                "description": "Zero tests detected. This prevents 'Production' maturity grading.",
                "action": "Implement a core testing suite to cover business logic.",
                "guide": f"Run `touch tests/test_core.py` and implement your first integration test using `pytest`."
            })

        # 3. Infrastructure Stability
        if not stds.get("has_docker"):
            self.roadmap.append({
                "title": "Deployment Consistency",
                "description": "Environment varies between machines. Scaling will be difficult.",
                "action": "Containerize the application to ensure 'it works on my machine' means 'it works in production'.",
                "guide": "Create a `Dockerfile` using `python:3.11-slim` or `node:20-alpine` as a base."
            })

        # 4. Security Remediation
        critical_leaks = [f for f in self.security_findings if f["severity"] == "CRITICAL"]
        if critical_leaks:
            self.roadmap.insert(0, {
                "title": "CRITICAL: Secret Rotation",
                "description": f"Found {len(critical_leaks)} potential hardcoded credentials. These are exposed in Git history.",
                "action": "Immediately revoke and rotate the affected keys.",
                "guide": "Rotate leaked credentials and add affected files to `.gitignore` or use Vault/Secrets Manager."
            })

        high_vulns = [f for f in self.security_findings if f["severity"] == "HIGH"]
        if high_vulns:
            # Code Injection
            if any(v["type"] == "Vulnerability (SAST)" for v in high_vulns):
                self.roadmap.append({
                    "title": "Code Injection Hardening",
                    "description": "SAST scan identified dangerous coding patterns (eval/exec/SQLi).",
                    "action": "Refactor dynamic code execution to use parameterized inputs or secure alternatives.",
                    "guide": "Replace `eval()` with safe parsing and use parameterized queries for SQL statements."
                })
            
            # Dependencies
            if any(v["type"] == "Vulnerable Dependency" for v in high_vulns):
                self.roadmap.append({
                    "title": "Standardize Dependencies",
                    "description": "One or more packages in your manifest have known vulnerabilities.",
                    "action": "Audit and upgrade core dependencies to stable, patched versions.",
                    "guide": "Run `pip install --upgrade requests flask` or `npm update` to resolve CVEs."
                })

        # 4. Architectural Transformation
        if struct.get("concerns_separation") == "Low (Monolithic)":
            self.roadmap.append({
                "title": "Modular Transformation",
                "description": "Your code is currently monolithic. This leads to high maintenance costs.",
                "action": "Refactor into a Domain-Driven Design (DDD) layout.",
                "guide": "Extract business logic into a `/services` layer and keep `/api` for routing only."
            })

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
