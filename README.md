
# QuickSale - Flash Sale Backend (Updated)

This repository is a scaffold updated to match the **QuickSale – Flash Sale Backend** requirements.
It contains a microservice layout with:
- auth-service (JWT + refresh tokens)
- inventory-service (stock reservation, emits inventory.result)
- order-service (idempotent order creation, Outbox pattern)
- notifier-service (WebSocket notifier that consumes order.status events)
- api-gateway (simple proxy + JWT verification + rate limit stub)
- shared (common types, db datasource)
- docker-compose (MySQL, Zookeeper, Kafka, Redis)

This scaffold includes minimal runnable code and stubs to connect services with Kafka (kafkajs) and TypeORM (MySQL).

See `docker-compose.yml` for services to run locally.
