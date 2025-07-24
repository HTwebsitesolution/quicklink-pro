# QuickLink Pro - Production Deployment Guide

## 🚀 Complete Codebase for Web Hosting

This package contains the complete QuickLink Pro URL shortener application ready for production deployment on any web hosting service with Node.js support.

## 📁 File Structure

```
quicklink-pro/
├── production-server.js          # Main backend server
├── production-package.json       # Dependencies and scripts  
├── production-frontend.html      # Frontend (rename to index.html)
├── .env.example                  # Environment variables template
├── src/                          # Backend source code
│   ├── models/                   # Database models
│   ├── controllers/              # API controllers
│   ├── routes/                   # API routes
│   ├── middleware/               # Custom middleware
│   └── utils/                    # Utility functions
└── README-DEPLOYMENT.md          # This file
```

## 🔧 Pre-Deployment Setup

### 1. **Rename Files**
```bash
# Rename files for production
mv production-server.js server.js
mv production-package.json package.json
mv production-frontend.html index.html
cp .env.example .env
```

### 2. **Configure Environment Variables**
Edit `.env` file with your actual values:

```env
# MongoDB Configuration (Required)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quicklink-pro

# Domain Configuration (Required - Updated with your domain)
FRONTEND_URL=https://quicklinkpro.io
BACKEND_URL=https://quicklinkpro.io
BASE_URL=https://quicklinkpro.io
CORS_ORIGIN=https://quicklinkpro.io

# Port Configuration
PORT=5000
NODE_ENV=production
```

### 3. **Update Frontend API URL**
In `index.html`, find and update:
```javascript
const API_BASE_URL = 'https://quicklinkpro.io/api';
```

### 4. **Configure AdSense & Analytics**
Replace placeholders in `index.html`:
```html
<!-- Google AdSense -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_PUBLISHER_ID"></script>

<!-- Google Analytics -->
gtag('config', 'YOUR_GA_TRACKING_ID');
```

## 🌐 Deployment Options

### Option 1: **Shared Hosting (cPanel/Plesk)**

1. **Upload Files**
   - Upload all files to your hosting account
   - Place `index.html` in `public_html/` or `www/`
   - Place backend files in a subdirectory like `api/`

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Subdomain** (Recommended)
   - Create subdomain `api.yourdomain.com` pointing to backend folder
   - Update frontend API_BASE_URL to `https://api.yourdomain.com/api`

### Option 2: **VPS/Cloud Hosting**

1. **Server Setup**
   ```bash
   # Install Node.js (v18+)
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs

   # Or for Ubuntu/Debian:
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Deploy Application**
   ```bash
   # Clone/upload your files
   cd /var/www/quicklink-pro
   npm install
   npm start
   ```

3. **Process Manager** (Recommended)
   ```bash
   # Install PM2
   npm install -g pm2
   
   # Start application
   pm2 start server.js --name quicklink-pro
   pm2 startup
   pm2 save
   ```

4. **Reverse Proxy** (Nginx)
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           try_files $uri $uri/ /index.html;
           root /var/www/quicklink-pro;
       }
       
       location /api/ {
           proxy_pass http://localhost:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Option 3: **Platform-as-a-Service**

#### **Railway**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway deploy
```

#### **Heroku**
```bash
# Install Heroku CLI and deploy
heroku create quicklink-pro
git push heroku main
```

#### **Vercel** (Serverless)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

## 📊 Database Setup

### **MongoDB Atlas** (Recommended)
1. Create account at [mongodb.com](https://www.mongodb.com/cloud/atlas)
2. Create new cluster
3. Create database user
4. Whitelist IP addresses (0.0.0.0/0 for all IPs)
5. Get connection string and update `MONGODB_URI` in `.env`

### **Self-Hosted MongoDB**
```bash
# Install MongoDB
sudo yum install -y mongodb-org  # CentOS/RHEL
# or
sudo apt install -y mongodb  # Ubuntu/Debian

# Update connection string
MONGODB_URI=mongodb://localhost:27017/quicklink-pro
```

## 🔒 Security Checklist

- ✅ Environment variables properly configured
- ✅ MongoDB credentials secured
- ✅ CORS configured for your domain only
- ✅ Rate limiting enabled
- ✅ Helmet security headers configured
- ✅ HTTPS enabled (use Let's Encrypt for free SSL)
- ✅ Regular backups scheduled

## 📈 Performance Optimization

1. **CDN Integration**
   - Use Cloudflare for global content delivery
   - Cache static assets (CSS, JS, images)

2. **Database Indexing**
   - Indexes are automatically created by the application
   - Monitor query performance in MongoDB Atlas

3. **Monitoring**
   - Set up uptime monitoring (UptimeRobot, Pingdom)
   - Monitor server resources and database performance

## 💰 Monetization Setup

1. **Google AdSense**
   - Apply for AdSense account
   - Replace `ca-pub-XXXXXXXXXX` with your publisher ID
   - Create ad units and replace slot IDs

2. **Google Analytics**
   - Create GA4 property
   - Replace `GA_TRACKING_ID` with your tracking ID

## 🚨 Troubleshooting

### **Common Issues**

1. **MongoDB Connection Failed**
   - Check connection string format
   - Verify IP whitelist in MongoDB Atlas
   - Ensure network connectivity

2. **CORS Errors**
   - Update `CORS_ORIGIN` in `.env`
   - Check frontend API_BASE_URL matches backend URL

3. **Port Already in Use**
   - Change PORT in `.env`
   - Kill existing process: `pkill -f node`

4. **404 on Short URLs**
   - Ensure redirect route is configured
   - Check database has links with matching shortCodes

### **Logs and Debugging**
```bash
# View application logs
pm2 logs quicklink-pro

# Debug mode
NODE_ENV=development npm start
```

## 📞 Support

For deployment support:
- Check server logs for specific error messages
- Verify all environment variables are correctly set
- Test API endpoints manually with curl or Postman
- Ensure frontend and backend URLs match

## 🎯 Post-Deployment Checklist

- [ ] Application accessible at your domain
- [ ] Short URL redirection working
- [ ] QR code generation functional
- [ ] Analytics tracking data
- [ ] AdSense ads displaying (after approval)
- [ ] SSL certificate installed and working
- [ ] Database backups configured
- [ ] Monitoring and alerts set up

Your QuickLink Pro application is now ready for production! 🚀
