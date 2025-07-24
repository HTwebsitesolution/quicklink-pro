const url = require('url');

/**
 * Validate if a string is a valid URL
 * @param {string} urlString - The URL string to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validateUrl = (urlString) => {
  try {
    const parsedUrl = new URL(urlString);
    
    // Check if protocol is http or https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Check if hostname exists
    if (!parsedUrl.hostname) {
      return false;
    }
    
    // Reject localhost and private IPs in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsedUrl.hostname.toLowerCase();
      
      // Reject localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        return false;
      }
      
      // Reject private IP ranges
      const privateIPRegex = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.|fe80:|::1|fc00:|fd00:)/;
      if (privateIPRegex.test(hostname)) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Sanitize URL by removing dangerous characters and normalizing
 * @param {string} urlString - The URL string to sanitize
 * @returns {string} - Sanitized URL
 */
const sanitizeUrl = (urlString) => {
  if (!urlString) return '';
  
  // Remove leading/trailing whitespace
  let sanitized = urlString.trim();
  
  // Add protocol if missing
  if (!sanitized.match(/^https?:\/\//i)) {
    sanitized = 'https://' + sanitized;
  }
  
  try {
    const parsedUrl = new URL(sanitized);
    
    // Normalize the URL
    sanitized = parsedUrl.href;
    
    // Remove fragment identifier for consistency (optional)
    // sanitized = sanitized.split('#')[0];
    
    // Limit URL length
    if (sanitized.length > 2048) {
      throw new Error('URL too long');
    }
    
    return sanitized;
  } catch (error) {
    throw new Error('Invalid URL format');
  }
};

/**
 * Extract domain from URL
 * @param {string} urlString - The URL string
 * @returns {string} - Domain name
 */
const extractDomain = (urlString) => {
  try {
    const parsedUrl = new URL(urlString);
    return parsedUrl.hostname;
  } catch (error) {
    return 'unknown';
  }
};

/**
 * Check if URL is safe (not in blacklist)
 * @param {string} urlString - The URL string to check
 * @returns {boolean} - True if safe, false if blacklisted
 */
const isSafeUrl = (urlString) => {
  // Basic blacklist - you can expand this
  const blacklistedDomains = [
    'malware.com',
    'phishing.com',
    'spam.com',
    // Add more as needed
  ];
  
  const blacklistedKeywords = [
    'malware',
    'virus',
    'phishing',
    // Add more as needed
  ];
  
  try {
    const parsedUrl = new URL(urlString);
    const hostname = parsedUrl.hostname.toLowerCase();
    const fullUrl = urlString.toLowerCase();
    
    // Check blacklisted domains
    for (const domain of blacklistedDomains) {
      if (hostname.includes(domain.toLowerCase())) {
        return false;
      }
    }
    
    // Check blacklisted keywords
    for (const keyword of blacklistedKeywords) {
      if (fullUrl.includes(keyword)) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get URL metadata (title, description, etc.)
 * @param {string} urlString - The URL to get metadata for
 * @returns {Promise<Object>} - URL metadata
 */
const getUrlMetadata = async (urlString) => {
  // This is a placeholder - you can integrate with services like:
  // - Open Graph API
  // - Link preview services
  // - Custom web scraping
  
  return {
    title: 'Web Page',
    description: 'A web page',
    image: null,
    domain: extractDomain(urlString),
  };
};

/**
 * Generate URL-safe slug from text
 * @param {string} text - Text to convert to slug
 * @returns {string} - URL-safe slug
 */
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim('-'); // Remove leading/trailing hyphens
};

module.exports = {
  validateUrl,
  sanitizeUrl,
  extractDomain,
  isSafeUrl,
  getUrlMetadata,
  generateSlug,
};
