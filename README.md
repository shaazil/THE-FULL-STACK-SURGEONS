# MedTranscribe

## 🏆 Hackathon Project: Revolutionizing Medical Transcription

MedTranscribe is an innovative mobile and web application designed to transform how healthcare professionals document patient encounters. By leveraging cutting-edge AI technologies, MedTranscribe provides accurate, real-time transcription of medical dictations, saving valuable time and improving documentation quality.

## 🌟 Key Features

- **Instant Voice-to-Text Transcription**: Record and automatically transcribe medical dictations with high accuracy
- **Multi-Platform Support**: Seamlessly works on both mobile devices (iOS/Android) and web browsers
- **AI-Powered Analysis**: Identifies key medical terms, procedures, and diagnoses
- **Secure Cloud Storage**: HIPAA-compliant storage of all transcriptions and notes
- **Offline Capability**: Record now, transcribe later when connection is available
- **Intelligent Segmentation**: Automatically divides transcriptions into logical sections

## 🚀 Technology Stack

- **Frontend**: React Native + Expo (for cross-platform mobile) and React (for web)
- **Backend**: Firebase Authentication and Supabase for data storage
- **AI Services**: 
  - OpenAI Whisper API for high-accuracy speech recognition
  - Google Gemini API for advanced text processing and medical term identification
- **Storage**: Supabase Storage for secure file management
- **Deployment**: Expo for mobile, Vercel for web application



## 🔧 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- API keys for OpenAI and Google Gemini

### Mobile App Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/medtranscribe.git
cd medtranscribe

# Install dependencies
npm install

# Create .env file with your API keys
cp .env.example .env
# Edit .env with your API keys

# Start the development server
npm start
```

### Web App Setup
```bash
# From the project root
cd web
npm install
npm start
```

### Proxy Server Setup (for Web Development)
```bash
# From the project root
cd proxy-server
npm install
npm start
```

## 🧪 Testing the Application

1. **Mobile**: Scan the QR code with Expo Go app after running `npm start`
2. **Web**: Navigate to `http://localhost:8082` in your browser
3. **Record a dictation**: Tap/click the microphone button and speak
4. **View transcription**: After processing, the AI-generated transcription will appear
5. **Edit and save**: Make any necessary corrections and save to your account

## 🔒 Security & Compliance

MedTranscribe is designed with healthcare privacy in mind:
- End-to-end encryption for all audio and transcription data
- HIPAA-compliant data storage and processing
- Secure authentication with multi-factor options
- Automatic session timeouts for added security
- No persistent storage of raw audio files after transcription

## 🔮 Future Enhancements

- Integration with major EHR systems (Epic, Cerner, etc.)
- Advanced medical terminology validation
- Specialty-specific AI models for improved accuracy
- Team collaboration features for medical practices
- Voice biometrics for enhanced security
- Dark Theme and UI enhancement.

## 👥 Team

- MOHAMMAD SHAZIL A M
- DHARUN PRASAD R 
- HARISH KUMAR P
- JASON T EASAW

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for their revolutionary Whisper API
- Google for the powerful Gemini language model
- The healthcare professionals who provided valuable feedback during development
- INTERNATIONAL HEALTHCARE HACKATHON for the opportunity to showcase this innovation

---

*Built with ❤️ for healthcare professionals everywhere* 
