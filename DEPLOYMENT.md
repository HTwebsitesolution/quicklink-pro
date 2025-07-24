# 🚀 QuickLink Pro Deployment Guide

This guide will help you deploy your QuickLink Pro backend to production quickly and easily.

## 📋 Pre-Deployment Checklist

- [ ] MongoDB database ready (MongoDB Atlas recommended)
- [ ] Domain name registered
- [ ] Environment variables configured
- [ ] Frontend code updated with production API URL

## 🎯 Quick Deployment Options

### Option 1: Railway (Recommended - Easiest)

1. **Create Railway account**: Go to [railway.app](https://railway.app)

2. **Deploy from GitHub**:
   ```bash
   # Push your code to GitHub first
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/HTwebsitesolution/quicklink-pro.git
   git push -u origin main
   ```

3. **Connect to Railway**:
   - Click "Deploy from GitHub"
   - Select your repository
   - Railway will automatically detect it's a Node.js app

4. **Set Environment Variables**:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quicklink-pro
   BASE_URL=https://your-app-name.railway.app
   FRONTEND_URL=https://your-frontend-domain.com
   JWT_SECRET=your-super-secret-jwt-key
   ```

5. **Deploy**: Railway will automatically build and deploy your app

### Option 2: Render

1. **Create Render account**: Go to [render.com](https://render.com)

2. **Create Web Service**:
   - Connect your GitHub repository
   - Choose "Web Service"
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Set Environment Variables**: Same as Railway above

### Option 3: Heroku

1. **Install Heroku CLI**:
   ```bash
   # Install Heroku CLI
   npm install -g heroku
   
   # Login to Heroku
   heroku login
   ```

2. **Create Heroku App**:
   ```bash
   heroku create your-app-name
   ```

3. **Set Environment Variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your-mongodb-uri
   heroku config:set BASE_URL=https://your-app-name.herokuapp.com
   heroku config:set FRONTEND_URL=https://your-frontend-domain.com
   heroku config:set JWT_SECRET=your-jwt-secret
   ```

4. **Deploy**:
   ```bash
   git push heroku main
   ```

## 🗄️ Database Setup (MongoDB Atlas)

1. **Create MongoDB Atlas Account**: Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)

2. **Create Cluster**:
   - Choose "Build a Database"
   - Select "Shared" (Free tier)
   - Choose your preferred region
   - Create cluster

3. **Create Database User**:
   - Go to "Database Access"
   - Add new database user
   - Choose "Password" authentication
   - Set username and strong password
   - Grant "Read and write to any database"

4. **Configure Network Access**:
   - Go to "Network Access"
   - Add IP Address
   - Choose "Allow access from anywhere" (0.0.0.0/0) for now
   - Add entry

5. **Get Connection String**:
   - Go to "Databases"
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

## 🌐 Domain Configuration

### Custom Domain Setup

1. **Purchase Domain**: From any registrar (Namecheap, GoDaddy, etc.)

2. **Configure DNS**:
   ```
   Type: CNAME
   Name: api (or your preferred subdomain)
   Value: your-app-name.railway.app (or your platform's domain)
   TTL: 300
   ```

3. **Update Environment Variables**:
   ```
   BASE_URL=https://api.yourdomain.com
   ```

### SSL Certificate

Most platforms (Railway, Render, Heroku) provide automatic SSL certificates for custom domains.

## 🔧 Frontend Integration

Update your frontend to use the production API:

```javascript
// In your frontend code, update the API base URL
const API_BASE_URL = 'https://api.yourdomain.com/api';

// Or use environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

## 🎚️ Production Optimizations

### 1. Update package.json

```json
{
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  },
  "scripts": {
    "start": "NODE_ENV=production node server.js",
    "build": "npm install --production"
  }
}
```

### 2. Enable Compression

Add to your server.js:
```javascript
const compression = require('compression');
app.use(compression());
```

Install compression:
```bash
npm install compression
```

### 3. Set up Logging

```javascript
// Add to server.js
if (process.env.NODE_ENV === 'production') {
  // Production logging
  console.log = function() {};
  console.error = function(error) {
    // Log to external service like Loggly, Papertrail, etc.
  };
}
```

## 📊 Monitoring Setup

### 1. Health Checks

Your backend already includes a health check endpoint at `/health`

### 2. Error Tracking

Consider adding error tracking:
```bash
npm install @sentry/node
```

### 3. Performance Monitoring

Add basic performance monitoring:
```javascript
// Add to server.js
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});
```

## 🔐 Security Checklist

- [ ] Environment variables set correctly
- [ ] MongoDB connection secured with strong password
- [ ] Rate limiting enabled
- [ ] CORS configured for your frontend domain only
- [ ] HTTPS enabled (automatic on most platforms)
- [ ] Error messages don't expose sensitive information

## 🧪 Testing Your Deployment

1. **Health Check**:
   ```bash
   curl https://your-api-domain.com/health
   ```

2. **API Test**:
   ```bash
   curl -X POST https://your-api-domain.com/api/url/shorten \
     -H "Content-Type: application/json" \
     -d '{"originalUrl": "https://example.com"}'
   ```

3. **Frontend Integration**:
   - Update your frontend API URL
   - Test URL shortening
   - Test QR code generation
   - Test analytics

## 📈 Scaling Considerations

### For High Traffic:

1. **Database Indexing**: Your models already include proper indexes
2. **Connection Pooling**: MongoDB driver handles this automatically
3. **Load Balancing**: Most platforms provide this automatically
4. **Caching**: Consider Redis for frequently accessed data
5. **CDN**: Use CloudFlare for static assets and global distribution

### Upgrade Plans:

- **Railway**: $5/month for hobby plan
- **Render**: $7/month for starter plan  
- **Heroku**: $7/month for basic dyno

## 🆘 Troubleshooting

### Common Issues:

1. **MongoDB Connection Error**:
   - Check connection string format
   - Verify database user credentials
   - Check network access settings

2. **CORS Errors**:
   - Verify FRONTEND_URL environment variable
   - Check if frontend domain matches exactly

3. **Rate Limiting Issues**:
   - Adjust rate limits in server.js if needed
   - Consider implementing user-based rate limiting

4. **Memory Issues**:
   - Monitor memory usage
   - Consider upgrading to paid tier
   - Implement proper error handling

## 📞 Support

- Check logs in your platform's dashboard
- Test endpoints using Postman or curl
- Verify environment variables are set correctly
- Check MongoDB Atlas metrics for database issues

## 🎉 Launch Checklist

- [ ] Backend deployed and responding to health checks
- [ ] Database connected and working
- [ ] Frontend updated with production API URL
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Basic monitoring in place
- [ ] Error tracking configured
- [ ] Backup strategy planned

Your QuickLink Pro backend is now ready for production! 🚀
