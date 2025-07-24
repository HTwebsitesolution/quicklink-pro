# QuickLink Pro - Professional URL Shortener

🚀 **Live Demo**: [quicklinkpro.io](https://quicklinkpro.io)

QuickLink Pro is a professional URL shortener service with QR code generation, analytics tracking, and monetization through Google AdSense.

## ✨ Features

- **URL Shortening**: Create short, memorable links
- **QR Code Generation**: Automatic QR codes for all shortened URLs
- **Click Analytics**: Track clicks, locations, devices, and browsers
- **Bulk Processing**: Shorten multiple URLs at once
- **Link Management**: Update, delete, and manage links
- **Link Expiration**: Set expiration dates for links
- **Rate Limiting**: Built-in rate limiting for API protection
- **Admin Dashboard**: Administrative endpoints for system management

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **nanoid** - Unique ID generation for short codes
- **QRCode** - QR code generation
- **Helmet** - Security middleware
- **Express Rate Limit** - Rate limiting
- **Express Validator** - Input validation

## 📁 Project Structure

```
src/
├── controllers/        # Route controllers
│   ├── urlController.js
│   ├── analyticsController.js
│   └── adminController.js
├── models/            # Database models
│   ├── Link.js
│   └── Analytics.js
├── routes/            # API routes
│   ├── urlRoutes.js
│   ├── analyticsRoutes.js
│   └── adminRoutes.js
├── middleware/        # Custom middleware
│   ├── errorHandler.js
│   ├── notFound.js
│   └── validateRequest.js
└── utils/             # Utility functions
    └── urlUtils.js
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HTwebsitesolution/quicklink-pro.git
   cd quicklink-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration:
   - `MONGODB_URI`: Your MongoDB connection string
   - `BASE_URL`: Your domain (e.g., https://yourdomain.com)
   - `FRONTEND_URL`: Your frontend URL for CORS

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### URL Shortening

#### Shorten URL
```http
POST /api/url/shorten
Content-Type: application/json

{
  "originalUrl": "https://example.com/very-long-url",
  "customAlias": "my-link",
  "description": "My awesome link",
  "expiration": "2024-12-31T23:59:59.000Z"
}
```

#### Bulk Shorten URLs
```http
POST /api/url/bulk-shorten
Content-Type: application/json

{
  "urls": [
    "https://example1.com",
    "https://example2.com"
  ],
  "prefix": "campaign"
}
```

#### Get Link Info
```http
GET /api/url/info/:shortCode
```

#### Generate QR Code
```http
GET /api/url/qr/:shortCode
```

### Analytics

#### Get Link Analytics
```http
GET /api/analytics/link/:shortCode?days=30
```

#### Get Dashboard Stats
```http
GET /api/analytics/dashboard
```

#### Get Detailed Analytics
```http
GET /api/analytics/link/:shortCode/detailed
```

### Admin Endpoints

#### Get All Links
```http
GET /api/admin/links?page=1&limit=20&search=query
```

#### Get System Stats
```http
GET /api/admin/stats
```

#### Export Links to CSV
```http
GET /api/admin/export/csv
```

### Redirect

#### Redirect to Original URL
```http
GET /:shortCode
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/quicklink-pro` |
| `BASE_URL` | Base URL for short links | `http://localhost:5000` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `JWT_SECRET` | JWT secret key | Required for auth |

### Rate Limiting

- **API endpoints**: 100 requests per 15 minutes per IP
- **URL shortening**: 20 requests per 15 minutes per IP

## 🔒 Security Features

- **Helmet.js**: Security headers
- **Rate limiting**: Prevents abuse
- **Input validation**: Validates all inputs
- **URL sanitization**: Cleans URLs before processing
- **CORS configuration**: Restricts cross-origin requests
- **Error handling**: Secure error responses

## 📊 Analytics Features

- **Click tracking**: Total and unique clicks
- **Geographic data**: Country-based analytics
- **Device detection**: Mobile, tablet, desktop
- **Browser detection**: Chrome, Firefox, Safari, etc.
- **Referrer tracking**: Track traffic sources
- **Time-based analytics**: Daily, weekly, monthly stats

## 🚀 Deployment

### Production Deployment

1. **Set environment variables**
   ```bash
   NODE_ENV=production
   MONGODB_URI=your-production-mongodb-uri
   BASE_URL=https://yourdomain.com
   ```

2. **Build and start**
   ```bash
   npm start
   ```

### Recommended Platforms

- **Railway**: Easy deployment with automatic HTTPS
- **Heroku**: Classic PaaS with MongoDB Atlas
- **DigitalOcean App Platform**: Modern deployment platform
- **AWS/GCP/Azure**: Full control with container deployment

## 🧪 Testing

```bash
# Run tests (when available)
npm test

# Health check
curl http://localhost:5000/health
```

## 📝 API Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional message"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    // Validation errors if any
  ]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@quicklinkpro.com or create an issue in the repository.

## 🔮 Roadmap

- [ ] User authentication and accounts
- [ ] Team collaboration features
- [ ] Custom domains
- [ ] Link password protection
- [ ] Webhook notifications
- [ ] Advanced analytics dashboard
- [ ] Link thumbnails and previews
- [ ] API rate limiting by user
- [ ] Link categorization and tagging
- [ ] Bulk link management tools
