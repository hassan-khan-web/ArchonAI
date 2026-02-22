import os
from typing import Dict, Any, List, Set

class RepositoryAnalyzer:
    def __init__(self, repo_path: str):
        self.repo_path = repo_path
        self.static_findings: Dict[str, Any] = {}
        self.structural_findings: Dict[str, Any] = {}
        self.critique: str = ""
        self.overall_score: int = 0
        self.score_breakdown: Dict[str, int] = {}

    def analyze(self) -> Dict[str, Any]:
        """Run all analysis layers."""
        self._run_layer1_static_scan()
        self._run_layer2_structural_evaluation()
        self._run_layer3_architectural_critique()
        self._calculate_final_score()
        
        return {
            "static_scan": self.static_findings,
            "structural_evaluation": self.structural_findings,
            "architectural_critique": self.critique,
            "overall_score": self.overall_score,
            "score_breakdown": self.score_breakdown
        }

    def _run_layer1_static_scan(self):
        """Layer 1: Detect tech stack and standards."""
        stack_set: Set[str] = set()
        standards = {
            "has_readme": False,
            "has_gitignore": False,
            "has_docker": False,
            "has_ci_cd": False
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
                
                if file.endswith((".tsx", ".jsx")): 
                    stack_set.add("React")
                
                if file.endswith(".py"):
                    try:
                        with open(file_path, 'r', errors='ignore') as f:
                            content = f.read(1000)
                            if "FastAPI" in content:
                                stack_set.add("FastAPI")
                    except Exception:
                        pass
                
                # Detect Testing
                if "test" in file.lower() and file.endswith((".py", ".ts", ".js")):
                    testing_detected = True
                    if file.endswith(".py"): test_frameworks.add("pytest")
                    if file.endswith((".ts", ".js")): test_frameworks.add("jest/vitest")

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
        """Calculate a weighted maturity score (0-100)."""
        static = self.static_findings
        struct = self.structural_findings
        stds = static.get("standards", {})
        
        score = 0
        # Static Layer (40 points)
        if stds.get("has_readme"): score += 5
        if stds.get("has_gitignore"): score += 5
        if stds.get("has_docker"): score += 15
        if stds.get("has_ci_cd"): score += 10
        if static.get("testing", {}).get("detected"): score += 5
        
        # Structural Layer (40 points)
        mod_score = struct.get("modularity_score", 0)
        score += (mod_score * 0.4)
        
        # Qualitative Adjustment (20 points)
        if len(static.get("stack", [])) > 1: score += 10
        if len(struct.get("patterns_detected", [])) >= 2: score += 10

        self.overall_score = min(100, int(score))
        self.score_breakdown = {
             "infrastructure": 15 if stds.get("has_docker") else 0,
             "testing": 5 if static.get("testing", {}).get("detected") else 0,
             "modularity": int(mod_score * 0.4),
             "standards": 10 if (stds.get("has_readme") and stds.get("has_gitignore")) else 0
        }
