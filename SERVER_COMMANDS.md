# Server Commands Quick Reference

Quick reference for managing your Canvas MCP server on your VPS.

## 🔄 Update and Redeploy

```bash
# Navigate to project directory
cd ~/mcp-canvas-lms-student

# Pull latest changes
git pull origin main

# Rebuild and restart (one command)
docker-compose down && docker-compose build --no-cache && docker-compose up -d

# View logs to confirm it's working
docker-compose logs -f
```

## 📊 Check Status

```bash
# Check if container is running
docker-compose ps

# View live logs
docker-compose logs -f canvas-mcp

# View last 50 lines of logs
docker-compose logs --tail=50 canvas-mcp

# Check resource usage
docker stats canvas-mcp-server --no-stream

# Test health endpoint
curl http://localhost:3001/health
```

## 🛠️ Common Operations

### Start/Stop/Restart

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# Restart just the canvas-mcp service
docker-compose restart canvas-mcp
```

### View Logs

```bash
# All logs
docker-compose logs

# Follow logs (live tail)
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Since specific time
docker-compose logs --since 2h
```

### Rebuild

```bash
# Rebuild without cache
docker-compose build --no-cache

# Rebuild and restart
docker-compose up -d --build

# Full clean rebuild
docker-compose down
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

## 🔍 Debugging

### Enter Container Shell

```bash
# Open shell in running container
docker-compose exec canvas-mcp sh

# Inside container, you can:
ls -la              # List files
cat .env            # View environment (be careful!)
node --version      # Check Node version
npm list            # List installed packages
```

### Check Environment Variables

```bash
# View all env vars in container
docker-compose exec canvas-mcp env | grep CANVAS

# Check specific variable
docker-compose exec canvas-mcp sh -c 'echo $API_KEY'
```

### Test API Endpoints

```bash
# Health check (no auth)
curl http://localhost:3001/health

# With API key
curl http://localhost:3001/message \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"id":"1","method":"tools/call","params":{"name":"list_courses","arguments":{}}}'

# From external (replace with your domain/IP)
curl https://your-domain.com/health
```

## 🔐 Security

### Update API Key

```bash
# Generate new key
openssl rand -hex 32

# Edit .env file
nano .env
# Update API_KEY=new-key-here

# Restart to apply changes
docker-compose restart
```

### View Current Configuration

```bash
# View .env (be careful - contains secrets!)
cat .env

# View docker-compose config
docker-compose config
```

## 🧹 Cleanup

### Remove Old Images

```bash
# Remove unused images
docker image prune -a

# Remove all stopped containers
docker container prune

# Remove unused volumes
docker volume prune

# Clean everything
docker system prune -a
```

### Remove and Reinstall

```bash
# Stop and remove everything
docker-compose down -v

# Remove all canvas-mcp images
docker images | grep canvas-mcp | awk '{print $3}' | xargs docker rmi

# Rebuild fresh
docker-compose build --no-cache
docker-compose up -d
```

## 📈 Monitoring

### Resource Usage

```bash
# Real-time stats
docker stats canvas-mcp-server

# One-time snapshot
docker stats canvas-mcp-server --no-stream

# Detailed container info
docker inspect canvas-mcp-server
```

### Disk Space

```bash
# Check disk usage
df -h

# Docker disk usage
docker system df

# Detailed breakdown
docker system df -v
```

## 🔧 Troubleshooting

### Container Won't Start

```bash
# Check logs for errors
docker-compose logs canvas-mcp

# Check if port is already in use
netstat -tulpn | grep 3001

# Check if .env exists
ls -la .env

# Verify environment variables
docker-compose config
```

### Build Fails

```bash
# Clear build cache
docker builder prune

# Rebuild with verbose output
docker-compose build --no-cache --progress=plain

# Check available disk space
df -h
```

### Can't Connect to Server

```bash
# Check if container is running
docker ps | grep canvas-mcp

# Check container logs
docker-compose logs --tail=50 canvas-mcp

# Check firewall
sudo ufw status

# Check nginx (if using)
sudo nginx -t
sudo systemctl status nginx
```

### Memory Issues

```bash
# Check current memory usage
free -h

# Check Docker memory
docker stats --no-stream

# Increase memory limit in docker-compose.yml
# memory: 512M -> memory: 1024M
```

## 🚀 Quick Fixes

### "Container keeps restarting"

```bash
# Check the logs to see why
docker-compose logs --tail=100 canvas-mcp

# Common causes:
# 1. Missing environment variables
# 2. Invalid Canvas token
# 3. Port already in use
```

### "Out of disk space"

```bash
# Clean up Docker
docker system prune -a

# Check space
df -h

# Remove old logs
sudo journalctl --vacuum-time=3d
```

### "Can't pull from git"

```bash
# Reset local changes
git reset --hard origin/main

# Pull fresh
git pull origin main
```

## 📝 Useful Aliases

Add these to your `~/.bashrc` or `~/.bash_aliases`:

```bash
# Canvas MCP aliases
alias mcp-cd='cd ~/mcp-canvas-lms-student'
alias mcp-logs='docker-compose -f ~/mcp-canvas-lms-student/docker-compose.yml logs -f'
alias mcp-status='docker-compose -f ~/mcp-canvas-lms-student/docker-compose.yml ps'
alias mcp-restart='docker-compose -f ~/mcp-canvas-lms-student/docker-compose.yml restart'
alias mcp-update='cd ~/mcp-canvas-lms-student && git pull && docker-compose down && docker-compose build --no-cache && docker-compose up -d'
alias mcp-health='curl http://localhost:3001/health'

# Reload with: source ~/.bashrc
```

Then you can just type:
```bash
mcp-logs      # View logs
mcp-status    # Check status
mcp-restart   # Restart service
mcp-update    # Update and redeploy
mcp-health    # Test health endpoint
```

## 🆘 Emergency Commands

### Server is Down - Quick Restart

```bash
cd ~/mcp-canvas-lms-student && docker-compose restart && docker-compose logs -f
```

### Complete Reset

```bash
cd ~/mcp-canvas-lms-student
docker-compose down
docker system prune -a -f
git pull origin main
docker-compose build --no-cache
docker-compose up -d
docker-compose logs -f
```

### Rollback to Previous Version

```bash
cd ~/mcp-canvas-lms-student
git log --oneline -10               # Find commit hash
git checkout COMMIT_HASH            # Replace with actual hash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 📞 Health Check URLs

```bash
# Local
http://localhost:3001/health

# From external (replace with your domain)
https://your-domain.com/health

# Expected response:
{"status":"ok","server":"canvas-mcp","version":"1.0.0"}
```

## 🔗 Useful Links

- **Docker Compose Docs**: https://docs.docker.com/compose/
- **Docker CLI Reference**: https://docs.docker.com/engine/reference/commandline/cli/
- **Project README**: ~/mcp-canvas-lms-student/README.md
- **Deployment Guide**: ~/mcp-canvas-lms-student/DEPLOYMENT_GUIDE.md

---

**💡 Tip**: Keep this file open in a separate terminal tab for quick reference!

Save this command to your home directory:
```bash
ln -s ~/mcp-canvas-lms-student/SERVER_COMMANDS.md ~/mcp-commands.md
cat ~/mcp-commands.md  # Quick access
```
