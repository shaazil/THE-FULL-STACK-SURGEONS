#!/bin/bash

# MedTranscribe Setup Script
echo "🚀 Setting up MedTranscribe..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version is too old. Please install Node.js v16 or higher."
    exit 1
fi

# Install main project dependencies
echo "📦 Installing main project dependencies..."
npm install

# Set up proxy server
echo "🔄 Setting up proxy server..."
cd proxy-server || mkdir -p proxy-server
cd proxy-server

# Check if package.json exists, if not copy from template
if [ ! -f "package.json" ]; then
    echo "Creating package.json for proxy server..."
    cat > package.json << 'EOL'
{
  "name": "medtranscribe-proxy-server",
  "version": "1.0.0",
  "description": "Proxy server for MedTranscribe to handle API calls and avoid CORS issues",
  "main": "proxy-server.js",
  "scripts": {
    "start": "node proxy-server.js",
    "dev": "nodemon proxy-server.js"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "form-data": "^4.0.0",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=16.0.0"
  },
  "private": true
}
EOL
fi

# Install proxy server dependencies
echo "📦 Installing proxy server dependencies..."
npm install

# Create uploads directory
mkdir -p uploads

# Return to project root
cd ..

# Check if .env file exists, if not create from example
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "⚠️ Please edit the .env file with your API keys before running the application."
    else
        echo "❌ .env.example file not found. Please create a .env file manually."
    fi
fi

# Install Expo CLI globally if not already installed
if ! command -v expo &> /dev/null; then
    echo "📱 Installing Expo CLI globally..."
    npm install -g expo-cli
fi

echo ""
echo "✅ Setup complete! You can now run the application:"
echo ""
echo "To start the main application:"
echo "  npm start"
echo ""
echo "To start the proxy server (required for web):"
echo "  cd proxy-server && npm start"
echo ""
echo "For more information, see README.md and TROUBLESHOOTING.md"
echo "" 