# Build stage
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o vam-radar main.go

# Production stage (Distroless)
FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/vam-radar /vam-radar
ENTRYPOINT ["/vam-radar"]
