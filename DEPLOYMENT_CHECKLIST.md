# 🚀 Admin API Deployment Checklist

## ✅ Pre-Deployment Checklist

### Local Preparation
- [ ] All code changes committed to Git
- [ ] `.env.example` file is up to date
- [ ] Database migrations tested locally
- [ ] Application builds successfully: `npm run build`
- [ ] All tests passing (if applicable)
- [ ] Dependencies are up to date in `package.json`

### Environment Configuration
- [ ] Production database URLs configured
- [ ] JWT secrets changed from defaults
- [ ] AWS S3 credentials configured
- [ ] Firebase credentials configured
- [ ] CCAvenue payment gateway credentials configured
- [ ] Mobile API base URL configured
- [ ] `NODE_ENV=production` set

---

## 🔧 VPS Deployment Steps

### 1. Upload Files to VPS
```bash
# Option 1: Using SCP
scp -r ./IPMS-ADMIN-web-api/* root@72.62.194.189:/var/www/pg-admin-api/

# Option 2: Using Git (Recommended)
ssh root@72.62.194.189
cd /var/www/pg-admin-api
git pull origin main
```

### 2. Run Deployment Script
```bash
cd /var/www/pg-admin-api
chmod +x deploy-vps.sh
./deploy-vps.sh
```

### 3. Configure Nginx
```bash
sudo cp nginx-config.conf /etc/nginx/sites-available/pg-admin-api
sudo ln -s /etc/nginx/sites-available/pg-admin-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Verify Deployment
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs pg-admin-api --lines 50

# Test API
curl http://localhost:5002/health
curl http://72.62.194.189/health
```

---

## 🔍 Common Issues & Solutions

### Issue 1: Build Fails - Prisma Client Not Generated

**Symptoms:**
```
Error: Cannot find module '@prisma/client'
```

**Solution:**
```bash
cd /var/www/pg-admin-api
npm run prisma:generate:all
npm run build
pm2 restart pg-admin-api
```

---

### Issue 2: Database Connection Failed

**Symptoms:**
```
Error: Can't reach database server
```

**Solution:**
```bash
# Check .env file
cat .env | grep DATABASE

# Test connection
npx prisma db pull --schema prisma/consumer.schema.prisma
npx prisma db pull --schema prisma/management.schema.prisma

# Verify database URLs have correct format:
# mysql://user:password@host:3306/database?connection_limit=5&pool_timeout=0
```

---

### Issue 3: Port Already in Use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::5002
```

**Solution:**
```bash
# Find process using port 5002
sudo lsof -i :5002

# Kill the process
sudo kill -9 <PID>

# Or change port in .env file
nano .env
# Change PORT=5002 to another port

# Restart application
pm2 restart pg-admin-api
```

---

### Issue 4: Nginx 502 Bad Gateway

**Symptoms:**
- API returns 502 error
- Nginx error logs show connection refused

**Solution:**
```bash
# Check if app is running
pm2 status

# If not running, start it
pm2 start ecosystem.config.js

# Check if app is listening on correct port
sudo netstat -tulpn | grep 5002

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart both services
pm2 restart pg-admin-api
sudo systemctl restart nginx
```

---

### Issue 5: PM2 Process Crashes Immediately

**Symptoms:**
```
pm2 status shows "errored" or "stopped"
```

**Solution:**
```bash
# Check detailed logs
pm2 logs pg-admin-api --lines 100

# Common causes:
# 1. Missing .env file
# 2. Invalid database connection
# 3. Missing dependencies
# 4. Build not completed

# Rebuild and restart
cd /var/www/pg-admin-api
npm install --legacy-peer-deps
npm run prisma:generate:all
npm run build
pm2 restart pg-admin-api
```

---

### Issue 6: Module Not Found Errors

**Symptoms:**
```
Error: Cannot find module 'body-parser'
```

**Solution:**
```bash
# Reinstall dependencies
cd /var/www/pg-admin-api
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
pm2 restart pg-admin-api
```

---

### Issue 7: Prisma Schema Mismatch

**Symptoms:**
```
Error: Prisma schema is out of sync with database
```

**Solution:**
```bash
cd /var/www/pg-admin-api

# Pull latest schema from database
npm run prisma:pull:all

# Or run migrations
npx prisma migrate deploy --schema prisma/consumer.schema.prisma
npx prisma migrate deploy --schema prisma/management.schema.prisma

# Regenerate client
npm run prisma:generate:all

# Rebuild
npm run build
pm2 restart pg-admin-api
```

---

## 🎯 Key Differences from Mobile API

| Aspect | Mobile API | Admin API |
|--------|-----------|-----------|
| **Port** | 5001 | 5002 |
| **API Prefix** | api/v1 | api/web/v1 |
| **PM2 Name** | pg-api | pg-admin-api |
| **Database** | Single schema | Dual schema (consumer + management) |
| **Directory** | /var/www/pg-api | /var/www/pg-admin-api |
| **Nginx Config** | pg-api | pg-admin-api |

---

## 📝 Post-Deployment Verification

### API Health Check
```bash
# Test health endpoint
curl http://72.62.194.189/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

### Swagger Documentation
```bash
# Access Swagger UI
curl http://72.62.194.189/api/web/v1/docs

# Or open in browser:
# http://72.62.194.189/api/web/v1/docs
```

### Database Connectivity
```bash
# Test consumer database
npx prisma db pull --schema prisma/consumer.schema.prisma

# Test management database
npx prisma db pull --schema prisma/management.schema.prisma
```

### PM2 Monitoring
```bash
# Check status
pm2 status

# Monitor resources
pm2 monit

# View logs
pm2 logs pg-admin-api
```

---

## 🔄 Update Deployment Process

When deploying updates:

```bash
# 1. Connect to VPS
ssh root@72.62.194.189

# 2. Navigate to app directory
cd /var/www/pg-admin-api

# 3. Pull latest changes
git pull origin main

# 4. Install new dependencies (if any)
npm install --legacy-peer-deps

# 5. Regenerate Prisma clients
npm run prisma:generate:all

# 6. Run migrations (if any)
npx prisma migrate deploy --schema prisma/consumer.schema.prisma
npx prisma migrate deploy --schema prisma/management.schema.prisma

# 7. Rebuild application
npm run build

# 8. Restart with PM2
pm2 restart pg-admin-api

# 9. Verify
pm2 logs pg-admin-api --lines 20
curl http://localhost:5002/health
```

---

## 🛡️ Security Checklist

- [ ] Changed default JWT secrets
- [ ] Database credentials secured
- [ ] AWS credentials secured
- [ ] Firebase credentials secured
- [ ] Payment gateway credentials secured
- [ ] `.env` file has correct permissions (600)
- [ ] Firewall configured (UFW)
- [ ] SSL certificate installed (optional but recommended)
- [ ] Regular security updates scheduled

---

## 📊 Monitoring Setup

### PM2 Monitoring
```bash
# Enable PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Check system resources
htop
df -h
free -h
```

---

## 🎉 Deployment Complete!

Your Admin API should now be running at:
- **Local**: http://localhost:5002
- **Public IP**: http://72.62.194.189
- **Swagger**: http://72.62.194.189/api/web/v1/docs

### Next Steps:
1. Configure domain and SSL (optional)
2. Setup automated backups
3. Configure monitoring and alerts
4. Update frontend to use new API URL
5. Test all critical endpoints
