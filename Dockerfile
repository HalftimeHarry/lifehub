# Dockerfile for PocketBase on Railway
FROM alpine:latest

# Install dependencies
RUN apk add --no-cache \
    ca-certificates \
    unzip \
    wget

# Set working directory
WORKDIR /app

# Download PocketBase
ARG PB_VERSION=0.22.20
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip \
    && unzip pocketbase_${PB_VERSION}_linux_amd64.zip \
    && rm pocketbase_${PB_VERSION}_linux_amd64.zip \
    && chmod +x pocketbase

# Copy migrations and startup script
COPY pocketbase/pb_migrations ./pb_migrations
COPY start.sh ./start.sh

# Create data directory and set permissions
RUN mkdir -p pb_data && \
    chmod +x start.sh

# Expose port
EXPOSE 8090

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-8090}/api/health || exit 1

# Start PocketBase
CMD ["./start.sh"]
