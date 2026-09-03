# Multi-stage build for Go reverse proxy daemon
FROM golang:1.23-alpine AS builder

WORKDIR /app
COPY proxy/go.mod proxy/go.sum ./
RUN go mod download

COPY proxy/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /gateway ./cmd/gateway/main.go

FROM scratch
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /gateway /gateway

EXPOSE 8080
ENTRYPOINT ["/gateway"]
