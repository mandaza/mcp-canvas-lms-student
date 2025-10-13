# Docker Build Fix

## Issue
The Docker build was failing because:
1. `npm ci --only=production` doesn't install dev dependencies
2. The `prepare` script in package.json was trying to run `npm run build`
3. TypeScript wasn't available to build the project

## Solution Applied

### 1. Updated Dockerfile (Multi-stage Build)

The new Dockerfile uses a **multi-stage build** approach:

**Stage 1 (Builder):**
- Installs ALL dependencies (including TypeScript)
- Builds the TypeScript code
- Creates the `dist` folder

**Stage 2 (Production):**
- Installs only production dependencies
- Copies the pre-built `dist` folder from Stage 1
- Results in a smaller, optimized image

### 2. Updated package.json

Removed the `prepare`/`postinstall` script entirely:
```json
"scripts": {
  "build": "tsc && chmod 755 dist/index.js && chmod 755 dist/openwebui-server.js",
  "dev": "tsc --watch",
  "start": "node dist/index.js",
  "start:http": "node dist/openwebui-server.js",
  "clean": "rm -rf dist"
}
```

No post-install hooks means no build attempts during production installs.

### 3. Updated Dockerfile

Added `--ignore-scripts` flag to production npm install:
```dockerfile
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
```

This ensures no scripts run during production dependency installation.

## How to Deploy on Your Server

### Step 1: Pull the Latest Changes

```bash
cd ~/mcp-canvas-lms-student
git pull origin main
```

### Step 2: Rebuild the Docker Image

```bash
# Stop and remove old containers
docker-compose down

# Rebuild with no cache
docker-compose build --no-cache

# Start the new container
docker-compose up -d
```

### Step 3: Verify It's Running

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f canvas-mcp

# Test health endpoint
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","server":"canvas-mcp","version":"1.0.0"}
```

## Alternative: Build Locally First

If you prefer to build locally and then deploy:

```bash
# On your local machine
npm install
npm run build

# Commit the dist folder
git add dist
git commit -m "Add pre-built dist folder"
git push

# On your server
git pull
docker-compose up -d
```

## Troubleshooting

### If build still fails:

1. **Clear Docker cache:**
   ```bash
   docker system prune -a
   docker-compose build --no-cache
   ```

2. **Check available disk space:**
   ```bash
   df -h
   ```

3. **Check Docker logs:**
   ```bash
   docker-compose logs canvas-mcp
   ```

4. **Verify package.json is updated:**
   ```bash
   grep postinstall package.json
   ```
   Should show: `"postinstall": "test -d dist || npm run build"`

### If you see "WARNING: deploy sub-keys not supported"

This warning is harmless. It's just Docker Compose v1 not supporting some v2 features. You can ignore it, or update docker-compose.yml to remove the `deploy.resources.reservations` section.

To remove the warning, edit docker-compose.yml:

```yaml
# Remove or comment out these lines:
# deploy:
#   resources:
#     reservations:
#       cpus: '0.5'
#       memory: 256M
```

Keep only:
```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
```

## Benefits of Multi-stage Build

✅ **Smaller final image** - Dev dependencies not included
✅ **Faster deployments** - Less data to transfer
✅ **More secure** - Fewer packages = smaller attack surface
✅ **Build isolation** - Build artifacts don't pollute production image

## Testing the Fix

Run these commands to verify everything works:

```bash
# 1. Health check
curl http://localhost:3001/health

# 2. Test with API key (if set)
curl http://localhost:3001/message \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"id":"1","method":"tools/call","params":{"name":"list_courses","arguments":{}}}'

# 3. Check container is running
docker ps | grep canvas-mcp

# 4. View resource usage
docker stats canvas-mcp-server --no-stream
```

## Summary

The Docker build is now fixed and uses industry best practices:
- ✅ Multi-stage build for smaller images
- ✅ Proper separation of build and runtime dependencies
- ✅ No build attempts during production installs
- ✅ Optimized layer caching

Your server should now build and run successfully!
