<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# QuickLink Pro Backend - Copilot Instructions

This is a Node.js Express backend for QuickLink Pro URL shortener service.

## Project Structure
- Express.js REST API server
- MongoDB database with Mongoose ODM
- JWT authentication for admin features
- Rate limiting and security middleware
- QR code generation capabilities
- Click analytics and tracking
- URL validation and sanitization

## Key Features
- URL shortening with custom aliases
- QR code generation for shortened URLs
- Click tracking and analytics
- Bulk URL processing
- Link expiration handling
- Geographic and device analytics
- Admin dashboard endpoints

## Development Guidelines
- Use async/await for all database operations
- Implement proper error handling with try-catch blocks
- Add input validation for all API endpoints
- Use middleware for authentication and rate limiting
- Follow RESTful API conventions
- Add comprehensive logging for debugging
- Implement proper CORS configuration
- Use environment variables for sensitive data

## Database Models
- Link model: stores URL data, analytics, and metadata
- Analytics model: stores detailed click tracking data
- User model: for admin authentication (optional)

## Security Considerations
- Rate limiting on all endpoints
- Input sanitization and validation
- CORS configuration for frontend integration
- Helmet.js for security headers
- MongoDB injection prevention
