// QuickLink Pro Frontend Integration
// Replace your existing localStorage-based functions with these API calls

const API_BASE_URL = 'http://localhost:5000/api';

class QuickLinkAPI {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Helper method for API calls
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Shorten a single URL
  async shortenUrl(urlData) {
    return await this.makeRequest('/url/shorten', {
      method: 'POST',
      body: JSON.stringify(urlData),
    });
  }

  // Bulk shorten URLs
  async bulkShortenUrls(urls, prefix = '') {
    return await this.makeRequest('/url/bulk-shorten', {
      method: 'POST',
      body: JSON.stringify({ urls, prefix }),
    });
  }

  // Get link information
  async getLinkInfo(shortCode) {
    return await this.makeRequest(`/url/info/${shortCode}`);
  }

  // Update link
  async updateLink(shortCode, updateData) {
    return await this.makeRequest(`/url/update/${shortCode}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Delete link
  async deleteLink(shortCode) {
    return await this.makeRequest(`/url/delete/${shortCode}`, {
      method: 'DELETE',
    });
  }

  // Generate QR code
  async generateQR(shortCode) {
    return await this.makeRequest(`/url/qr/${shortCode}`);
  }

  // Get link analytics
  async getLinkAnalytics(shortCode, days = 30) {
    return await this.makeRequest(`/analytics/link/${shortCode}?days=${days}`);
  }

  // Get dashboard stats
  async getDashboardStats() {
    return await this.makeRequest('/analytics/dashboard');
  }

  // Get detailed analytics
  async getDetailedAnalytics(shortCode) {
    return await this.makeRequest(`/analytics/link/${shortCode}/detailed`);
  }

  // Get top links
  async getTopLinks(limit = 10, period = 'all') {
    return await this.makeRequest(`/analytics/top-links?limit=${limit}&period=${period}`);
  }

  // Admin: Get all links
  async getAllLinks(page = 1, limit = 20, search = '') {
    return await this.makeRequest(`/admin/links?page=${page}&limit=${limit}&search=${search}`);
  }

  // Admin: Get system stats
  async getSystemStats() {
    return await this.makeRequest('/admin/stats');
  }
}

// Initialize API client
const api = new QuickLinkAPI();

// Updated functions for your existing frontend
async function shortenUrl(event) {
  event.preventDefault();
  
  const originalUrl = document.getElementById('originalUrl').value;
  const customAlias = document.getElementById('customAlias').value;
  const expiration = document.getElementById('expiration').value;
  const description = document.getElementById('description').value;
  
  const urlData = {
    originalUrl,
    customAlias: customAlias || undefined,
    expiration: expiration || undefined,
    description: description || undefined,
  };
  
  try {
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Shortening...';
    submitBtn.disabled = true;
    
    const response = await api.shortenUrl(urlData);
    
    // Display result
    document.getElementById('shortUrl').value = response.data.shortUrl;
    document.getElementById('singleResult').style.display = 'block';
    
    // Generate QR code
    generateQRCode(response.data.shortUrl);
    
    // Reset form
    document.getElementById('urlForm').reset();
    
    // Reset button
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    
  } catch (error) {
    alert('Error: ' + error.message);
    
    // Reset button on error
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Shorten URL & Generate QR';
    submitBtn.disabled = false;
  }
}

async function bulkShorten(event) {
  event.preventDefault();
  
  const urlList = document.getElementById('urlList').value.trim().split('\n').filter(url => url.trim());
  const prefix = document.getElementById('bulkPrefix').value;
  
  try {
    const response = await api.bulkShortenUrls(urlList, prefix);
    
    // Display results
    displayBulkResults(response.data.results);
    document.getElementById('bulkResults').style.display = 'block';
    
    // Show errors if any
    if (response.data.errors.length > 0) {
      console.warn('Some URLs failed to shorten:', response.data.errors);
    }
    
    // Reset form
    document.getElementById('bulkForm').reset();
    
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function updateAnalytics() {
  try {
    const response = await api.getDashboardStats();
    const data = response.data;
    
    document.getElementById('totalLinks').textContent = data.overview.totalLinks;
    document.getElementById('totalClicks').textContent = data.overview.totalClicks.toLocaleString();
    document.getElementById('todayClicks').textContent = data.overview.todayClicks.toLocaleString();
    document.getElementById('avgClicks').textContent = data.overview.avgClicksPerLink;
    
  } catch (error) {
    console.error('Error updating analytics:', error);
  }
}

async function displayLinks() {
  try {
    const response = await api.getAllLinks();
    const links = response.data.links;
    const container = document.getElementById('linkList');
    
    if (links.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No links created yet.</p>';
      return;
    }
    
    container.innerHTML = links.map(link => `
      <div class="link-item">
        <div class="link-info">
          <div class="link-short">${link.shortUrl || `${window.location.origin}/${link.shortCode}`}</div>
          <div class="link-original">${link.originalUrl}</div>
          <div class="link-stats">${link.clicks} clicks • Created ${formatDate(link.createdAt)}${link.expiration ? ' • Expires ' + formatDate(link.expiration) : ''}</div>
        </div>
        <div class="link-actions">
          <button class="action-btn copy-btn" onclick="copyText('${link.shortUrl || `${window.location.origin}/${link.shortCode}`}')">Copy</button>
          <button class="action-btn edit-btn" onclick="editLink('${link.shortCode}')">Edit</button>
          <button class="action-btn delete-btn" onclick="deleteLink('${link.shortCode}')">Delete</button>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error displaying links:', error);
  }
}

async function editLink(shortCode) {
  try {
    const linkInfo = await api.getLinkInfo(shortCode);
    const newDescription = prompt('Edit description:', linkInfo.data.description || '');
    
    if (newDescription !== null) {
      await api.updateLink(shortCode, { description: newDescription });
      displayLinks(); // Refresh the list
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function deleteLink(shortCode) {
  if (confirm('Are you sure you want to delete this link?')) {
    try {
      await api.deleteLink(shortCode);
      displayLinks(); // Refresh the list
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }
}

// Initialize analytics on page load
document.addEventListener('DOMContentLoaded', function() {
  updateAnalytics();
});

// Export for use in your existing code
window.QuickLinkAPI = QuickLinkAPI;
window.api = api;
