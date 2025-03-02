# MedTranscribe Troubleshooting Guide

This document provides solutions to common issues you might encounter when setting up and running MedTranscribe.

## Table of Contents
- [API Connection Issues](#api-connection-issues)
- [Proxy Server Setup](#proxy-server-setup)
- [Mobile App Issues](#mobile-app-issues)
- [Web App Issues](#web-app-issues)
- [Authentication Problems](#authentication-problems)
- [Transcription Service](#transcription-service)

## API Connection Issues

### CORS Errors in Web Browser

**Issue**: When using the web version, you might see CORS errors in the console when trying to access the OpenAI Whisper or Google Gemini APIs directly.

**Solution**: This is expected behavior as browsers enforce CORS policies. Our application uses a proxy server to handle these API calls. Make sure the proxy server is running:

```bash
cd proxy-server
npm install  # Only needed first time
npm start
```

The proxy server should be running on http://localhost:3001 while you use the web application.

### API Key Configuration

**Issue**: Transcription fails with authentication errors.

**Solution**: Ensure your API keys are correctly configured:

1. Check that your `.env` file contains valid API keys:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_key_here
   OPENAI_API_KEY=your_openai_key_here
   ```

2. For web development, make sure these keys are accessible to the proxy server.

3. Verify your API keys are valid by testing them directly with the respective API services.

## Proxy Server Setup

### Module Not Found Errors

**Issue**: When starting the proxy server, you see errors like `Error: Cannot find module 'express'`.

**Solution**: This means the dependencies aren't installed. Run:

```bash
cd proxy-server
npm install
```

### Port Already in Use

**Issue**: Error message indicating port 3001 is already in use.

**Solution**: Either:
1. Stop the other process using port 3001:
   ```bash
   pkill -f "node proxy-server.js"
   ```
   
2. Or modify the `PORT` variable in `proxy-server.js` to use a different port (and update the `PROXY_SERVER_URL` in `src/services/transcriptionService.ts` accordingly).

### Proxy Server Not Responding

**Issue**: The application can't connect to the proxy server.

**Solution**:
1. Ensure the proxy server is running in a separate terminal window
2. Check for any error messages in the proxy server terminal
3. Verify the proxy server URL in `src/services/transcriptionService.ts` matches the actual running proxy server address

## Mobile App Issues

### Expo Build Errors

**Issue**: Errors when trying to start the Expo development server.

**Solution**:
1. Ensure you have the latest version of Expo CLI:
   ```bash
   npm install -g expo-cli
   ```
2. Clear the Expo cache:
   ```bash
   expo start -c
   ```

### Audio Recording Permissions

**Issue**: Unable to record audio on mobile devices.

**Solution**: The app should request permissions automatically, but if you denied them:
1. For iOS: Go to Settings > Privacy > Microphone > Enable for MedTranscribe
2. For Android: Go to Settings > Apps > MedTranscribe > Permissions > Enable Microphone

## Web App Issues

### Audio Recording in Browser

**Issue**: Unable to record audio in certain browsers.

**Solution**:
1. Ensure you're using a modern browser (Chrome, Firefox, Edge)
2. Make sure you've granted microphone permissions when prompted
3. For secure contexts, the app must be served over HTTPS (except for localhost)

### Transcription Not Working on Web

**Issue**: Recording works but transcription fails on web.

**Solution**:
1. Check browser console for errors
2. Ensure the proxy server is running
3. Verify API keys are correctly configured
4. Check network tab to see if requests to the proxy server are succeeding

## Authentication Problems

### Login Issues

**Issue**: Unable to log in or create an account.

**Solution**:
1. Ensure you have internet connectivity
2. Check if Firebase services are operational
3. Clear browser cookies and cache if using the web version
4. Try the "Forgot Password" option if you have an existing account

## Transcription Service

### Rate Limit Errors

**Issue**: You receive "rate limit exceeded" errors when transcribing.

**Solution**:
1. The application automatically handles rate limiting by switching between services
2. If both services are rate-limited, wait a few minutes before trying again
3. For development/testing, consider using shorter audio clips

### Transcription Quality Issues

**Issue**: Transcriptions are inaccurate or contain many errors.

**Solution**:
1. Ensure you're recording in a quiet environment
2. Speak clearly and at a moderate pace
3. Position the microphone closer to the speaker
4. For medical terminology, the system improves over time with usage

---

If you encounter any issues not covered in this guide, please contact our support team or open an issue on our GitHub repository. 