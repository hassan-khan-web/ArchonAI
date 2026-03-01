"""
Tech Stack Recommendation Engine - Layer 4B
Provides minimal structured data for recommendations.
LLM handles all framing, explanation, and organization.
"""

from typing import Dict, Any, List, Optional

class TechStackRecommender:
    """Generates minimal structured recommendation data for LLM processing."""
    
    def __init__(self, static_findings: Dict[str, Any], structural_findings: Dict[str, Any], 
                 score: int, security_findings: List[Dict[str, Any]]):
        self.static_findings = static_findings
        self.structural_findings = structural_findings
        self.score = score
        self.security_findings = security_findings
        self.stack = static_findings.get("stack", [])
        self.categories = static_findings.get("categories", {})
    
    def generate_recommendations(self) -> Dict[str, Any]:
        """Generate minimal structured recommendation data for LLM framing."""
        return {
            "frameworks": self._frameworks_data(),
            "databases": self._databases_data(),
            "caching": self._caching_data(),
            "queues": self._queues_data(),
            "monitoring": self._monitoring_data(),
            "ml": self._ml_data() if self._detect_ml() else None,
            "observability": self._observability_data(),
            "project_context": {
                "score": self.score,
                "stack": self.stack,
                "categories": self.categories,
                "has_ml": self._detect_ml(),
                "is_microservices_candidate": self._is_microservices_candidate(),
                "should_cache": self._should_recommend_caching(),
                "is_high_traffic": self._is_high_traffic(),
                "has_background_tasks": self._has_background_tasks(),
                "is_event_driven": self._is_event_driven()
            }
        }
    
    def _frameworks_data(self) -> Dict[str, Any]:
        """Return minimal framework data for LLM to frame."""
        return {
            "current": list(filter(lambda x: any(y in x.lower() for y in ["fastapi", "flask", "django", "express", "nestjs"]), self.stack)),
            "python_stack": any(x in str(self.stack).lower() for x in ["python", "fastapi", "django", "flask"]),
            "node_stack": any(x in str(self.stack).lower() for x in ["express", "node", "javascript"]),
            "has_microservices": self._is_microservices_candidate()
        }
    
    def _databases_data(self) -> Dict[str, Any]:
        """Return minimal database data for LLM to frame."""
        db_detected = self.categories.get("Database", [])
        return {
            "current": db_detected,
            "is_sqlite_or_none": not db_detected or "SQLite" in db_detected,
            "score": self.score,
            "has_analytics": "analytics" in str(self.categories.get("Monitoring", [])).lower()
        }
    
    def _caching_data(self) -> Dict[str, Any]:
        """Return minimal caching data for LLM to frame."""
        return {
            "detected": any(x in str(self.stack).lower() for x in ["redis", "memcached"]),
            "should_recommend": self._should_recommend_caching(),
            "is_high_traffic": self._is_high_traffic(),
            "score": self.score
        }
    
    def _queues_data(self) -> Dict[str, Any]:
        """Return minimal queue data for LLM to frame."""
        return {
            "detected": any(x in str(self.stack).lower() for x in ["celery", "bull", "queue", "kafka", "rabbitmq"]),
            "has_background_tasks": self._has_background_tasks(),
            "is_event_driven": self._is_event_driven()
        }
    
    def _monitoring_data(self) -> Dict[str, Any]:
        """Return minimal monitoring data for LLM to frame."""
        return {
            "detected": any(x in str(self.stack).lower() for x in ["prometheus", "datadog", "newrelic", "elastic"]),
            "score": self.score,
            "needs_enterprise": self.score >= 80
        }
    
    def _ml_data(self) -> Dict[str, Any]:
        """Return minimal ML data for LLM to frame."""
        return {
            "has_ml": True,
            "stack": self.stack,
            "categories": self.categories
        }
    
    def _observability_data(self) -> Dict[str, Any]:
        """Return minimal observability stack data for LLM to frame."""
        return {
            "components": ["logs", "metrics", "traces", "alerting"],
            "score": self.score
        }
    
    # Helper methods
    def _detect_ml(self) -> bool:
        """Check if project includes ML components."""
        ml_indicators = ["tensorflow", "pytorch", "scikit-learn", "mlflow", "pandas", "numpy"]
        return any(x in str(self.stack).lower() for x in ml_indicators)
    
    def _is_microservices_candidate(self) -> bool:
        """Check if project should adopt microservices."""
        return self.score > 70 and self.structural_findings.get("modularity_score", 0) > 60
    
    def _should_recommend_caching(self) -> bool:
        """Determine if caching is critical."""
        categories = self.categories.get("Database", [])
        return len(categories) > 0 and self.score > 50
    
    def _is_high_traffic(self) -> bool:
        """Check for high-traffic indicators."""
        return self.score > 85 and "API" in str(self.categories)
    
    def _has_background_tasks(self) -> bool:
        """Check for background task patterns."""
        return any(x in str(self.categories).lower() for x in ["worker", "scheduler", "background"])
    
    def _is_event_driven(self) -> bool:
        """Check for event-driven architecture patterns."""
        return self.structural_findings.get("concerns_separation", "").lower() == "high"
