# 🚀 VPS Deployment Guide - Admin API

Complete step-by-step guide to deploy your NestJS Admin API backend on Hostinger VPS.

## 📋 VPS Details

- **Server Location**: Malaysia - Kuala Lumpur
- **OS**: Ubuntu 24.04 LTS
- **Hostname**: srv1250950.hstgr.cloud
- **IP Address**: 72.62.194.189
- **SSH Username**: root
- **CPU**: 2 cores
- **Memory**: 8 GB
- **Disk**: 100 GB
- **Plan**: KVM 2
- **Expiration**: 2026-02-06

---

## 🎯 Deployment Steps

### Step 1: Connect to Your VPS

```bash
ssh root@72.62.194.189
```

When prompted, enter your root password (provided by Hostinger via email).

**First-time connection**: You'll see a fingerprint confirmation. Type `yes` to continue.

---

### Step 2: Upload Your Application Files

**Option A: Using SCP (from your local machine)**

```bash
# Navigate to your project directory on local machine
cd d:\pg-mobile-app\IPMS-ADMIN-web\IPMS-ADMIN-web-api

# Upload files to VPS
scp -r ./* root@72.62.194.189:/var/www/pg-admin-api/
```

**Option B: Using Git (recommended)**

```bash
# On VPS
mkdir -p /var/www/pg-admin-api
cd /var/www/pg-admin-api

# Clone your repository
git clone <your-git-repository-url> .

# Or if you want to use a specific branch
git clone -b main <your-git-repository-url> .
```

**Option C: Using SFTP Client**
- Use FileZilla, WinSCP, or Cyberduck
- Host: 72.62.194.189
- Username: root
- Port: 22
- Upload to: `/var/www/pg-admin-api/`

---

### Step 3: Configure Environment Variables

```bash
cd /var/www/pg-admin-api

# Copy environment example
cp .env.example .env

# Edit environment file
nano .env
```

**Important Environment Variables to Update:**

```env
# Database Configuration (Consumer Schema)
DATABASE_CONSUMER_URL="mysql://username:password@host:3306/consumer_db?connection_limit=5&pool_timeout=0"

# Database Configuration (Management Schema)
DATABASE_MANAGEMENT_URL="mysql://username:password@host:3306/management_db?connection_limit=5&pool_timeout=0"

# Server Configuration
PORT=5002
API_PREFIX=api/web
API_VERSION=v1
NODE_ENV=production

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your-production-secret-key-here-make-it-long-and-random
JWT_REFRESH_SECRET=your-production-refresh-secret-here-make-it-long-and-random
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=indianpgmanagement

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-key\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id

# CCAvenue Payment Gateway
CCAVENUE_MERCHANT_ID=your-merchant-id
CCAVENUE_ACCESS_CODE=your-access-code
CCAVENUE_WORKING_KEY=your-working-key
CCAVENUE_PAYMENT_URL=https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction
CCAVENUE_REDIRECT_URL=https://admin-api.yourdomain.com/api/web/v1/subscription/payment/callback
CCAVENUE_CANCEL_URL=https://admin-api.yourdomain.com/api/web/v1/subscription/payment/cancel

# Mobile API Base URL (for cross-API communication)
MOB_API_BASE_URL=http://api.yourdomain.com/api/v1
```

Save and exit (Ctrl+X, then Y, then Enter)

---

### Step 4: Run Deployment Script

```bash
# Make the script executable
chmod +x deploy-vps.sh

# Run the deployment script
./deploy-vps.sh
```

This script will:
- ✅ Install Node.js 20.x LTS
- ✅ Install PM2 process manager
- ✅ Install and configure Nginx
- ✅ Setup firewall rules
- ✅ Install dependencies
- ✅ Generate Prisma clients (consumer & management schemas)
- ✅ Run database migrations for both schemas
- ✅ Build the application
- ✅ Start the app with PM2
- ✅ Configure PM2 to start on boot

---

### Step 5: Configure Nginx Reverse Proxy

```bash
# Copy nginx configuration
sudo cp nginx-config.conf /etc/nginx/sites-available/pg-admin-api

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/pg-admin-api /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

### Step 6: Setup Domain (Optional but Recommended)

**A. Configure DNS Records:**

Go to your domain registrar and add these DNS records:

```
Type: A
Name: admin-api (or subdomain of your choice)
Value: 72.62.194.189
TTL: 3600
```

**B. Update Nginx Configuration:**

```bash
sudo nano /etc/nginx/sites-available/pg-admin-api
```

Replace `admin-api.yourdomain.com` with your actual domain.

**C. Setup SSL Certificate (Let's Encrypt):**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d admin-api.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal:
sudo certbot renew --dry-run
```

**D. Enable HTTPS in Nginx:**

Edit `/etc/nginx/sites-available/pg-admin-api` and uncomment the HTTPS server block.

```bash
sudo nano /etc/nginx/sites-available/pg-admin-api
sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 7: Verify Deployment

**Check Application Status:**

```bash
pm2 status
pm2 logs pg-admin-api
```

**Test API Endpoints:**

```bash
# Test locally on VPS
curl http://localhost:5002/health

# Test via public IP
curl http://72.62.194.189/health

# Test via domain (if configured)
curl http://admin-api.yourdomain.com/health

# Test Swagger documentation
curl http://admin-api.yourdomain.com/api/web/v1/docs
```

**Check Nginx Status:**

```bash
sudo systemctl status nginx
```

---

## 🔧 Useful Commands

### PM2 Commands

```bash
pm2 status                    # Check application status
pm2 logs pg-admin-api         # View logs
pm2 logs pg-admin-api --lines 100  # View last 100 lines
pm2 restart pg-admin-api      # Restart application
pm2 stop pg-admin-api         # Stop application
pm2 start pg-admin-api        # Start application
pm2 delete pg-admin-api       # Delete from PM2
pm2 monit                     # Monitor CPU/Memory usage
pm2 save                      # Save current process list
```

### Nginx Commands

```bash
sudo systemctl status nginx    # Check status
sudo systemctl start nginx     # Start nginx
sudo systemctl stop nginx      # Stop nginx
sudo systemctl restart nginx   # Restart nginx
sudo systemctl reload nginx    # Reload config
sudo nginx -t                  # Test configuration
```

### Database Commands

```bash
cd /var/www/pg-admin-api

# Generate Prisma clients
npm run prisma:generate:all

# Run migrations for consumer schema
npx prisma migrate deploy --schema prisma/consumer.schema.prisma

# Run migrations for management schema
npx prisma migrate deploy --schema prisma/management.schema.prisma

# Open Prisma Studio for consumer schema
npx prisma studio --schema prisma/consumer.schema.prisma

# Open Prisma Studio for management schema
npx prisma studio --schema prisma/management.schema.prisma
```

### System Monitoring

```bash
htop                    # Interactive process viewer
df -h                   # Disk usage
free -h                 # Memory usage
netstat -tulpn          # Check open ports
journalctl -u nginx -f  # Nginx logs
```

---

## 🔄 Updating Your Application

When you need to deploy updates:

```bash
# Navigate to app directory
cd /var/www/pg-admin-api

# Pull latest changes (if using Git)
git pull origin main

# Install new dependencies (if any)
npm install --legacy-peer-deps

# Regenerate Prisma clients
npm run prisma:generate:all

# Run migrations (if any)
npx prisma migrate deploy --schema prisma/consumer.schema.prisma
npx prisma migrate deploy --schema prisma/management.schema.prisma

# Rebuild application
npm run build

# Restart with PM2
pm2 restart pg-admin-api

# Check logs
pm2 logs pg-admin-api
```

---

## 🐛 Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs pg-admin-api --lines 50

# Check if port is in use
sudo lsof -i :5002

# Restart application
pm2 restart pg-admin-api
```

### Nginx 502 Bad Gateway

```bash
# Check if app is running
pm2 status

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart both services
pm2 restart pg-admin-api
sudo systemctl restart nginx
```

### Database Connection Issues

```bash
# Test database connection
cd /var/www/pg-admin-api

# Test consumer database
npx prisma db pull --schema prisma/consumer.schema.prisma

# Test management database
npx prisma db pull --schema prisma/management.schema.prisma

# Check .env file
cat .env | grep DATABASE
```

### Prisma Client Generation Issues

```bash
# Clean and regenerate
cd /var/www/pg-admin-api
rm -rf node_modules/.prisma
npm run prisma:generate:all
npm run build
pm2 restart pg-admin-api
```

### Out of Memory

```bash
# Check memory usage
free -h

# Restart PM2 with memory limit
pm2 restart pg-admin-api --max-memory-restart 500M
```

---

## 🛡️ Security Best Practices

1. **Change Default SSH Port** (Optional):
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Change Port 22 to something else (e.g., 2222)
   sudo systemctl restart sshd
   ```

2. **Disable Root Login** (After creating sudo user):
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set: PermitRootLogin no
   sudo systemctl restart sshd
   ```

3. **Setup Fail2Ban**:
   ```bash
   sudo apt install fail2ban -y
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

4. **Regular Updates**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

5. **Backup Database Regularly**:
   ```bash
   # Create backup script
   nano /root/backup-db.sh
   ```

---

## 📊 Monitoring & Logs

### Application Logs

```bash
# Real-time logs
pm2 logs pg-admin-api

# Error logs only
pm2 logs pg-admin-api --err

# Output logs only
pm2 logs pg-admin-api --out

# Log files location
ls -la /var/www/pg-admin-api/logs/
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/pg-admin-api-access.log

# Error logs
sudo tail -f /var/log/nginx/pg-admin-api-error.log
```

---

## ✅ Deployment Checklist

- [ ] Connected to VPS via SSH
- [ ] Uploaded application files
- [ ] Configured `.env` file with production values
- [ ] Ran deployment script successfully
- [ ] Configured Nginx reverse proxy
- [ ] Application accessible via IP address
- [ ] (Optional) Configured domain DNS
- [ ] (Optional) Setup SSL certificate
- [ ] Verified all API endpoints working
- [ ] Tested Swagger documentation
- [ ] Setup monitoring and alerts
- [ ] Configured automated backups
- [ ] Documented any custom configurations

---

## 🔑 Key Differences from Mobile API

1. **Port**: Admin API runs on port `5002` (Mobile API on `5001`)
2. **API Prefix**: `api/web/v1` (Mobile API uses `api/v1`)
3. **PM2 Name**: `pg-admin-api` (Mobile API uses `pg-api`)
4. **Dual Database**: Uses both consumer and management schemas
5. **Nginx Config**: Separate configuration file for admin API

---

**🎉 Your NestJS Admin API is now deployed and running on Hostinger VPS!**

Access your API at:
- **HTTP**: http://72.62.194.189:5002
- **Via Nginx**: http://72.62.194.189
- **With Domain**: http://admin-api.yourdomain.com (after DNS setup)
- **HTTPS**: https://admin-api.yourdomain.com (after SSL setup)
- **Swagger Docs**: http://admin-api.yourdomain.com/api/web/v1/docs
