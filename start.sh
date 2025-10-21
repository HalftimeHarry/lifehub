#!/bin/sh
set -e

echo "Starting PocketBase..."
echo "PORT: ${PORT:-8090}"
echo "Working directory: $(pwd)"
echo "Files in current directory:"
ls -la

# Start PocketBase
exec ./pocketbase serve --http=0.0.0.0:${PORT:-8090}
