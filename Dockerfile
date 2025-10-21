# Dockerfile for PocketBase on Railway
FROM alpine:latest

# Install dependencies
RUN apk add --no-cache \
    ca-certificates \
    unzip \
    wget

# Download PocketBase
ARG PB_VERSION=0.22.20
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip \
    && unzip pocketbase_${PB_VERSION}_linux_amd64.zip \
    && rm pocketbase_${PB_VERSION}_linux_amd64.zip

# Copy migrations
COPY pocketbase/pb_migrations /pb_migrations

# Expose port
EXPOSE 8090

# Start PocketBase
CMD ["/pocketbase", "serve", "--http=0.0.0.0:8090", "--migrationsDir=/pb_migrations"]
