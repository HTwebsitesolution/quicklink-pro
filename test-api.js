// Quick API test script
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAPI() {
  try {
    console.log('🧪 Testing QuickLink Pro API...\n');
    
    // Test 1: Health Check
    console.log('1️⃣ Health Check:');
    const healthResponse = await fetch('http://localhost:5000/health');
    const healthData = await healthResponse.json();
    console.log('✅', healthData);
    console.log('');
    
    // Test 2: Shorten URL
    console.log('2️⃣ URL Shortening:');
    const shortenResponse = await fetch('http://localhost:5000/api/url/shorten', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        originalUrl: 'https://www.google.com',
        description: 'Test Google Link'
      })
    });
    
    const shortenData = await shortenResponse.json();
    console.log('✅', shortenData);
    console.log('');
    
    if (shortenData.success && shortenData.data) {
      const shortCode = shortenData.data.shortCode;
      
      // Test 3: Get Link Info
      console.log('3️⃣ Link Information:');
      const infoResponse = await fetch(`http://localhost:5000/api/url/info/${shortCode}`);
      const infoData = await infoResponse.json();
      console.log('✅', infoData);
      console.log('');
      
      // Test 4: Generate QR Code
      console.log('4️⃣ QR Code Generation:');
      const qrResponse = await fetch(`http://localhost:5000/api/url/qr/${shortCode}`);
      const qrData = await qrResponse.json();
      console.log('✅ QR Code generated:', qrData.success ? 'SUCCESS' : 'FAILED');
      console.log('');
      
      // Test 5: Analytics Dashboard
      console.log('5️⃣ Analytics Dashboard:');
      const analyticsResponse = await fetch('http://localhost:5000/api/analytics/dashboard');
      const analyticsData = await analyticsResponse.json();
      console.log('✅', analyticsData);
    }
    
    console.log('\n🎉 All API tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();
