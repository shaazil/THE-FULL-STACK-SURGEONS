// Simple Express proxy server to handle API calls and avoid CORS issues
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Proxy server is running');
});

// Proxy endpoint for OpenAI Whisper API
app.post('/api/whisper', upload.single('file'), async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    
    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...formData.getHeaders()
      },
      timeout: 30000
    });
    
    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json(response.data);
  } catch (error) {
    console.error('Whisper API proxy error:', error);
    
    // Clean up the uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data.error || 'Error from Whisper API',
        status: error.response.status
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Proxy endpoint for Gemini API
app.post('/api/gemini', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const requestData = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    if (!requestData || !requestData.contents) {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        timeout: 30000
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Gemini API proxy error:', error);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data.error || 'Error from Gemini API',
        status: error.response.status
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
}); 