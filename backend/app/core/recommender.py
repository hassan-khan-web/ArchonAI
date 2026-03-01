"""
Tech Stack Recommendation Engine - Layer 4B
Provides intelligent, contextual recommendations for frameworks, databases, caching, monitoring, and ML tooling.
"""

from typing import Dict, Any, List, Optional

class TechStackRecommender:
    """Intelligent recommendations based on detected stack, score, and maturity level."""
    
    def __init__(self, static_findings: Dict[str, Any], structural_findings: Dict[str, Any], 
                 score: int, security_findings: List[Dict[str, Any]]):
        self.static_findings = static_findings
        self.structural_findings = structural_findings
        self.score = score
        self.security_findings = security_findings
        self.stack = static_findings.get("stack", [])
        self.categories = static_findings.get("categories", {})
    
    def generate_recommendations(self) -> Dict[str, Any]:
        """Generate comprehensive tech stack recommendations."""
        return {
            "framework_recommendations": self._recommend_frameworks(),
            "database_recommendations": self._recommend_databases(),
            "caching_recommendations": self._recommend_caching(),
            "queue_recommendations": self._recommend_queues(),
            "monitoring_recommendations": self._recommend_monitoring(),
            "ml_recommendations": self._recommend_ml() if self._detect_ml() else None,
            "observability_stack": self._recommend_observability(),
        }
    
    def _recommend_frameworks(self) -> Dict[str, Any]:
        """Recommend backend frameworks based on detected tech stack."""
        backend_detected = any(x in str(self.stack).lower() for x in ["fastapi", "django", "flask", "express", "nestjs"])
        
        recommendations = []
        
        # Python backend path
        if any(x in str(self.stack).lower() for x in ["python", "fastapi", "django", "flask"]):
            if "FastAPI" in str(self.stack):
                recommendations.append({
                    "title": "FastAPI Optimization",
                    "current": "FastAPI",
                    "recommendation": "FastAPI is excellent for async I/O. Ensure dependency injection is properly used, and consider adding Dependency Groups for complex requirements.",
                    "reason": "Already using FastAPI; optimize existing setup for scale."
                })
            elif any(x in str(self.stack).lower() for x in ["django", "flask"]):
                recommendations.append({
                    "title": "Framework Modernization: Flask → FastAPI",
                    "current": "Flask/Django",
                    "recommendation": "Migrate to FastAPI for superior async support, automatic OpenAPI docs, and built-in dependency injection. Use FastAPI with SQLAlchemy async ORM.",
                    "reason": "FastAPI offers better performance for high-concurrency scenarios, native async/await, and modern Python patterns."
                })
        
        # Node.js backend path
        if any(x in str(self.stack).lower() for x in ["express", "node", "javascript"]):
            recommendations.append({
                "title": "Node.js Framework Evolution",
                "current": "Express.js",
                "recommendation": "Consider NestJS for structured backend architecture with built-in dependency injection, type safety (TypeScript), and enterprise patterns. Or upgrade to Fastify for raw performance.",
                "reason": "NestJS provides enterprise-grade structure; Fastify offers 2-3x performance over Express."
            })
        
        # Suggest API gateway if microservices detected
        if self._is_microservices_candidate():
            recommendations.append({
                "title": "API Gateway Pattern",
                "current": "None detected",
                "recommendation": "Implement Kong, Traefik, or AWS API Gateway as a unified entry point for service-to-service communication.",
                "reason": "Essential for managing distributed systems, rate limiting, authentication, and traffic routing."
            })
        
        return {"recommendations": recommendations} if recommendations else {"status": "Framework stack is modern"}
    
    def _recommend_databases(self) -> Dict[str, Any]:
        """Recommend databases based on use case and current maturity."""
        db_detected = self.categories.get("Database", [])
        recommendations = []
        
        if not db_detected or "SQLite" in db_detected:
            recommendations.append({
                "title": "Primary Database: PostgreSQL",
                "current": "SQLite or None",
                "recommendation": "Migrate to PostgreSQL for production. Use SQLAlchemy ORM with asyncpg for async Python drivers. PostgreSQL offers ACID compliance, advanced indexing, and JSONB support.",
                "reason": f"Current score ({self.score}/100) indicates production requirements. PostgreSQL scales to millions of rows with proper indexing.",
                "migration_path": "1) Set up PostgreSQL locally via Docker, 2) Create SQLAlchemy models, 3) Use Alembic for migrations, 4) Test locally before prod."
            })
        
        # Cache layer recommendation
        if self._should_recommend_caching():
            recommendations.append({
                "title": "Read Cache: Redis",
                "current": "None detected",
                "recommendation": "Add Redis as a distributed cache for frequently accessed data. Use 1-hour TTL for user sessions, 5-minute TTL for API responses.",
                "reason": "Reduces database load by 70-80%, critical for APIs handling >1000 req/sec.",
                "implementation": "Use redis-py client; set up Redis via Docker; implement cache-aside pattern for hot data."
            })
        
        # OLAP if analytics detected
        if "analytics" in str(self.categories.get("Monitoring", [])).lower():
            recommendations.append({
                "title": "Analytical Database: ClickHouse or Snowflake",
                "current": "None detected",
                "recommendation": "For analytics and reporting, use ClickHouse (self-hosted, cost-effective) or Snowflake (cloud-native). Do NOT use transactional DB for heavy analytics.",
                "reason": "Analytical queries destroy transaction-heavy OLTP performance. Separate read replicas or OLAP DBs are mandatory."
            })
        
        return {"recommendations": recommendations} if recommendations else {"status": "Database stack is adequate"}
    
    def _recommend_caching(self) -> Dict[str, Any]:
        """Recommend caching architectures."""
        caching_detected = any(x in str(self.stack).lower() for x in ["redis", "memcached", "cache"])
        
        recommendations = []
        
        if not caching_detected and self.score < 75:
            recommendations.append({
                "title": "Distributed Cache: Redis",
                "current": "None detected",
                "recommendation": "Deploy Redis (managed: AWS ElastiCache, Google Cloud Memorystore, or self-hosted). Use for sessions, API response caching, and distributed locks.",
                "pattern": "Cache-Aside: On cache miss, query DB, write to cache with TTL.",
                "tools": "redis-py (Python), ioredis (Node.js)",
                "expected_impact": "50-80% reduction in database queries for read-heavy workloads"
            })
        
        if self._is_high_traffic():
            recommendations.append({
                "title": "Multi-Layer Caching Strategy",
                "current": "Single-layer or none",
                "recommendation": "Implement 3 layers: 1) Application-level (in-memory), 2) Redis (distributed), 3) CDN (static assets). Use cache warming during off-peak hours.",
                "reason": "Critical for systems handling >10k requests/second",
                "tools": "Redis + ngx_cache_bypass + Cloudflare/AWS CloudFront"
            })
        
        return {"recommendations": recommendations} if recommendations else {"status": "Caching strategy adequate"}
    
    def _recommend_queues(self) -> Dict[str, Any]:
        """Recommend async queue/message systems."""
        queue_detected = any(x in str(self.stack).lower() for x in ["celery", "bull", "queue", "kafka", "rabbitmq"])
        
        recommendations = []
        
        if not queue_detected and self._has_background_tasks():
            recommendations.append({
                "title": "Background Job Queue: Celery + Redis",
                "current": "None detected",
                "recommendation": "Use Celery with Redis broker for async task processing. Schedule periodic tasks with celery-beat.",
                "use_cases": ["Email sending", "Image processing", "Report generation", "Data sync"],
                "tools": "Celery (Python), Bull (Node.js), or AWS SQS",
                "implementation": "1) Set up Celery worker, 2) Define tasks, 3) Use time-based scheduling for periodic jobs"
            })
        
        if self._is_event_driven():
            recommendations.append({
                "title": "Event Streaming: Kafka or AWS Kinesis",
                "current": "None detected",
                "recommendation": "For high-volume event processing (>1M events/day), use Kafka for durable event log. Enables event replay and multiple consumers.",
                "reason": "Critical for event-sourced architectures, real-time analytics, and system decoupling",
                "managed_options": "Confluent Cloud, AWS MSK, or self-hosted Kafka"
            })
        
        return {"recommendations": recommendations} if recommendations else {"status": "Queue architecture adequate"}
    
    def _recommend_monitoring(self) -> Dict[str, Any]:
        """Recommend monitoring and observability tools."""
        monitoring_detected = any(x in str(self.stack).lower() for x in ["prometheus", "datadog", "newrelic", "elastic"])
        
        recommendations = []
        
        if not monitoring_detected or self.score < 80:
            recommendations.append({
                "title": "Observability Stack: Prometheus + Grafana + Loki",
                "current": "None detected",
                "recommendation": "Open-source stack: Prometheus (metrics), Grafana (visualization), Loki (logs). Ideal for cost-conscious teams.",
                "metrics_to_track": ["Response time (p50/p95/p99)", "Error rate", "Database query time", "Cache hit ratio", "CPU/Memory usage"],
                "setup": "Docker containers; dashboard for business-critical metrics"
            })
        
        if self.score >= 80:
            recommendations.append({
                "title": "Enterprise Monitoring: Datadog or New Relic",
                "current": "None detected",
                "recommendation": "For production-grade systems, consider managed APM: Datadog (best-in-class) or New Relic (simpler). Includes distributed tracing, alerting.",
                "when_to_use": "When ops team is <3 people; unmanned production systems; complex microservices.",
                "cost_consideration": "$10-30k/month depending on scale"
            })
        
        return {"recommendations": recommendations} if recommendations else {"status": "Monitoring stack adequate"}
    
    def _recommend_observability(self) -> Dict[str, Any]:
        """Recommend full observability stack (logs, metrics, traces)."""
        return {
            "logs": {
                "recommendation": "ELK Stack (Elasticsearch, Logstash, Kibana) or Grafana Loki",
                "purpose": "Centralized log aggregation and search"
            },
            "metrics": {
                "recommendation": "Prometheus + Grafana or Datadog",
                "purpose": "Time-series metrics and visualization"
            },
            "traces": {
                "recommendation": "Jaeger or Datadog APM",
                "purpose": "Distributed tracing for microservices"
            },
            "alerting": {
                "recommendation": "AlertManager (Prometheus) or PagerDuty",
                "purpose": "On-call escalation and incident response"
            }
        }
    
    def _recommend_ml(self) -> Dict[str, Any]:
        """Recommend ML tooling if applicable."""
        if not self._detect_ml():
            return None
        
        recommendations = []
        
        recommendations.append({
            "title": "ML Experiment Tracking: MLflow or Weights & Biases",
            "recommendation": "Use MLflow for versioning models, tracking hyperparameters, and reproducing experiments.",
            "why": "Essential for team collaboration and audit trails"
        })
        
        recommendations.append({
            "title": "Feature Store: Feast or Tecton",
            "recommendation": "Centralized feature repository prevents training/serving skew and enables feature reuse.",
            "why": "Prevents 'data leakage' bugs in ML pipelines"
        })
        
        recommendations.append({
            "title": "Model Serving: FastAPI + Ray Serve or BentoML",
            "recommendation": "Containerized model inference with auto-scaling and versioning.",
            "why": "Production-grade model deployment with A/B testing support"
        })
        
        return {"ml_stack": recommendations}
    
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
