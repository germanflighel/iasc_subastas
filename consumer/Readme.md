## Levantar localstack
```
docker compose -f localstack-docker-compose.yml up
```
> Deberan instalar AWS CLI
## Crear queue
```
aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name notification-events.fifo --attributes "FifoQueue=true"
```       
## Enviar mensaje
```
aws --endpoint-url=http://localhost:4566 sqs send-message --queue-url http://localhost:4566/000000000000/notification-events.fifo \
--message-body '{"endpoint":"hola","body":{"one":"two"}}' \
--message-group-id 1 \
--message-deduplication-id 1
```       