# MedTranscribe Proxy Server

This is a simple proxy server for MedTranscribe to handle API calls to OpenAI Whisper and Google Gemini APIs. It helps avoid CORS issues when running the app in a web browser.

## Why is this needed?

When running MedTranscribe in a web browser, direct API calls to OpenAI and Google are blocked by CORS (Cross-Origin Resource Sharing) policies. This proxy server acts as a middleman, forwarding your requests to these APIs and returning the responses to your web app.

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Create a new directory for the proxy server:
   ```
   mkdir medtranscribe-proxy
   cd medtranscribe-proxy
   ```

2. Copy the `proxy-server.js` and `proxy-server-package.json` files into this directory.

3. Rename the package.json file:
   ```
   mv proxy-server-package.json package.json
   ```

4. Install dependencies:
   ```
   npm install
   ```

### Running the Server

Start the server with:
```
npm start
```

For development with auto-restart on file changes:
```
npm run dev
```

The server will run on port 3001 by default. You can change this by setting the `PORT` environment variable.

## API Endpoints

### Whisper Transcription

- **URL**: `/api/whisper`
- **Method**: `POST`
- **Headers**:
  - `x-api-key`: Your OpenAI API key
  - `Content-Type`: `multipart/form-data`
- **Body**: FormData with:
  - `file`: Audio file to transcribe

### Gemini API

- **URL**: `/api/gemini`
- **Method**: `POST`
- **Headers**:
  - `x-api-key`: Your Google Gemini API key
  - `Content-Type`: `application/json`
- **Body**: JSON object following Gemini API format

## Troubleshooting

- **CORS errors still occurring**: Make sure the proxy server is running and the app is configured to use `http://localhost:3001` as the proxy URL.
- **API key errors**: Verify that your API keys are correctly set in your app's environment variables or settings.
- **Connection refused**: Ensure the proxy server is running and accessible from your web app.

## Security Considerations

This proxy server is intended for development and testing purposes only. For production use, consider:

1. Adding proper authentication
2. Implementing rate limiting
3. Using HTTPS
4. Deploying to a secure environment

## License

This proxy server is provided as part of the MedTranscribe application. 