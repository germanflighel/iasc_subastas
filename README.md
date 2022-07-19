# Arquitecturas Concurrentes: Subastas

## How to run in (MacOS)

Be sure to edit `/etc/hosts`, adding:

```
127.0.0.1 subastas.com
```

1. Start a kuberneters cluster, `minikube start`
2. `minikube tunnel`
3. `cd k8s && kubectl apply -f .`
4. Configure the queue in the localstack with
```
aws configure
test
test
us-east-1

aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name notification-events.fifo --attributes "FifoQueue=true"
```
5. Check with `curl subastas.com/up`
6. Have fun!