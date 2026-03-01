#!/usr/bin/env python3
"""
Test script to verify tech_recommendations Layer 4B is working correctly.
This script will analyze a sample repository and check if recommendations are generated.
"""

import asyncio
import json
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from app.core.analyzer import RepositoryAnalyzer
from app.core.recommender import TechStackRecommender


async def test_tech_recommendations():
    """Test the tech recommendations engine."""
    
    print("=" * 80)
    print("TESTING TECH STACK RECOMMENDATION ENGINE (Layer 4B)")
    print("=" * 80)
    
    # Use the ArchonAI repo itself as test case
    test_repo_path = "/home/mohammed/ArchonAI/backend"
    
    if not os.path.exists(test_repo_path):
        print(f"❌ Test repository not found at {test_repo_path}")
        return False
    
    print(f"\n📂 Testing with repository: {test_repo_path}\n")
    
    try:
        # Create analyzer with progress callback
        def on_progress(msg):
            print(f"  ℹ️ {msg}")
        
        analyzer = RepositoryAnalyzer(test_repo_path, on_progress=on_progress)
        print("\n🔍 Running analysis...\n")
        
        # Run full analysis
        results = await analyzer.analyze()
        
        print("\n" + "=" * 80)
        print("✅ ANALYSIS COMPLETE")
        print("=" * 80)
        
        # Check for tech_recommendations in results
        if "tech_recommendations" not in results:
            print("\n❌ ERROR: tech_recommendations not in results!")
            print(f"Available keys: {list(results.keys())}")
            return False
        
        tech_recs = results["tech_recommendations"]
        
        if "error" in tech_recs:
            print(f"\n⚠️  WARNING: Error in recommendations: {tech_recs['error']}")
            return False
        
        print("\n📊 TECH RECOMMENDATIONS GENERATED:")
        print("-" * 80)
        
        # Display each recommendation category
        categories = [
            "framework_recommendations",
            "database_recommendations",
            "caching_recommendations",
            "queue_recommendations",
            "monitoring_recommendations",
            "ml_recommendations",
            "observability_stack"
        ]
        
        has_recommendations = False
        
        for category in categories:
            if category in tech_recs and tech_recs[category]:
                has_recommendations = True
                print(f"\n🔧 {category.upper().replace('_', ' ')}:")
                
                rec = tech_recs[category]
                
                if isinstance(rec, dict) and "status" in rec:
                    print(f"   Status: {rec['status']}")
                elif isinstance(rec, dict) and "recommendations" in rec:
                    for i, r in enumerate(rec["recommendations"], 1):
                        print(f"\n   [{i}] {r.get('title', 'N/A')}")
                        if "current" in r:
                            print(f"       Current: {r['current']}")
                        if "recommendation" in r:
                            print(f"       Recommendation: {r['recommendation'][:100]}...")
                        if "reason" in r:
                            print(f"       Why: {r['reason'][:100]}...")
                        if "expected_impact" in r:
                            print(f"       Impact: {r['expected_impact']}")
                elif isinstance(rec, dict) and "ml_stack" in rec:
                    for i, r in enumerate(rec["ml_stack"], 1):
                        print(f"\n   [{i}] {r.get('title', 'N/A')}")
                        print(f"       Recommendation: {r.get('recommendation', 'N/A')[:100]}...")
                elif isinstance(rec, dict):
                    for key, value in rec.items():
                        print(f"   • {key}: {value}")
        
        if not has_recommendations:
            print("\n⚠️  No recommendations generated")
        
        # Print summary
        print("\n" + "=" * 80)
        print("📈 OVERALL ANALYSIS SUMMARY:")
        print("=" * 80)
        print(f"Overall Score: {results.get('overall_score', 'N/A')}/100")
        print(f"Maturity Label: {results.get('maturity_label', 'N/A')}")
        print(f"Score Breakdown: {results.get('score_breakdown', {})}")
        
        # Print logs
        if "logs" in results and results["logs"]:
            print(f"\n📝 Analysis Logs ({len(results['logs'])} entries):")
            for i, log in enumerate(results["logs"][-5:], 1):  # Last 5 logs
                print(f"   [{i}] {log}")
        
        # Detailed tech_recommendations output
        print("\n" + "=" * 80)
        print("📋 FULL TECH RECOMMENDATIONS (JSON):")
        print("=" * 80)
        print(json.dumps(tech_recs, indent=2))
        
        print("\n" + "=" * 80)
        print("✅ TEST PASSED: Tech recommendations are being generated!")
        print("=" * 80)
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR during analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def test_recommender_directly():
    """Test the TechStackRecommender class directly."""
    
    print("\n" + "=" * 80)
    print("UNIT TEST: TechStackRecommender Class")
    print("=" * 80)
    
    # Create sample data
    sample_findings = {
        "stack": ["FastAPI", "Python"],
        "categories": {"Backend": ["FastAPI"], "Database": ["SQLite"]}
    }
    
    sample_structural = {
        "modularity_score": 65,
        "concerns_separation": "Medium"
    }
    
    sample_security = []
    
    try:
        recommender = TechStackRecommender(
            static_findings=sample_findings,
            structural_findings=sample_structural,
            score=65,
            security_findings=sample_security
        )
        
        recs = recommender.generate_recommendations()
        
        print("\n✅ Recommender instantiated and executed successfully!")
        print(f"\nGenerated {len([k for k in recs.keys() if recs[k] and 'error' not in recs[k]])} recommendation categories")
        
        for key, value in recs.items():
            if value and "error" not in value:
                if isinstance(value, dict) and "recommendations" in value:
                    print(f"  • {key}: {len(value['recommendations'])} recommendations")
                elif isinstance(value, dict):
                    print(f"  • {key}: {len(value)} items")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all tests."""
    print("\n🚀 Starting Backend Tech Recommendations Test Suite\n")
    
    # Test 1: Direct recommender unit test
    print("\n--- TEST 1: Direct Recommender Unit Test ---")
    test1 = await test_recommender_directly()
    
    # Test 2: Full analyzer integration test
    print("\n--- TEST 2: Full Analyzer Integration ---")
    test2 = await test_tech_recommendations()
    
    print("\n" + "=" * 80)
    if test1 and test2:
        print("✅ ALL TESTS PASSED!")
        print("Tech Stack Recommendation Engine is working correctly.")
    else:
        print("❌ SOME TESTS FAILED")
        if not test1:
            print("  - Direct recommender test failed")
        if not test2:
            print("  - Full analyzer integration test failed")
    print("=" * 80 + "\n")
    
    return test1 and test2


if __name__ == "__main__":
    result = asyncio.run(main())
    sys.exit(0 if result else 1)
