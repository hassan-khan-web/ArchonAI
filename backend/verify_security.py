from app.core.analyzer import RepositoryAnalyzer
import json
import os

def verify_security_scan():
    repo_path = "/tmp/vulnerable_repo"
    analyzer = RepositoryAnalyzer(repo_path)
    results = analyzer.analyze()
    
    print("--- Security Sweep Results ---")
    print(f"Overall Score: {results['overall_score']}")
    print(f"Maturity Label: {results['maturity_label']}")
    print("\nSecurity Findings:")
    for find in results['security_findings']:
        print(f"[{find['severity']}] {find['type']}: {find['label']} in {find['file']}")
    
    print("\nScore Breakdown:")
    print(json.dumps(results['score_breakdown'], indent=2))
    
    print("\nActionable Roadmap (Security):")
    for step in results['actionable_roadmap']:
        if "Security" in step['title'] or "Rotation" in step['title'] or "Injection" in step['title']:
            print(f"- {step['title']}: {step['action']}")

if __name__ == "__main__":
    verify_security_scan()
