
# AI Prompt Enhancer Chrome Extension

A Chrome extension that enhances AI prompts in real-time, similar to how Grammarly works for writing. The extension provides intelligent suggestions to improve prompt effectiveness across AI platforms like ChatGPT, Claude, and Gemini.

## Features

### 🎯 Core Functionality
- **Real-time Analysis**: Analyzes prompts as you type
- **Smart Suggestions**: Provides contextual improvements for clarity, specificity, and tone
- **Platform Optimization**: Tailored suggestions for different AI platforms
- **One-click Enhancement**: Apply suggestions instantly
- **User Authentication**: Secure login with subscription management

### 🌟 Key Components
- **Enhancement Icon**: Floating icon near text areas for easy access
- **Suggestion Panel**: Contextual popup with color-coded suggestions
- **Platform Detection**: Automatically detects ChatGPT, Claude, Gemini
- **Subscription Integration**: Premium features for subscribed users

## Installation

### Development Setup
1. Clone the repository
2. Navigate to `chrome-extension` folder
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the `chrome-extension` folder

### Production Build
1. Package the extension files
2. Submit to Chrome Web Store
3. Users can install from the store

## File Structure

```
chrome-extension/
├── manifest.json              # Extension configuration
├── popup.html                 # Extension popup UI
├── src/
│   ├── background.js          # Background service worker
│   ├── content.js             # Content script for web pages
│   ├── popup.js               # Popup functionality
│   ├── styles.css             # Extension styling
│   ├── api/
│   │   └── suggestions.js     # AI suggestions API
│   └── utils/
│       └── auth.js            # Authentication utilities
└── README.md                  # This file
```

## How It Works

### 1. Content Script Injection
- Automatically detects AI platform (ChatGPT, Claude, Gemini)
- Finds and monitors text input areas
- Adds enhancement icon near textboxes

### 2. Real-time Analysis
- Debounced text analysis (500ms delay)
- Sends text to background script for processing
- Generates contextual suggestions based on platform

### 3. Suggestion Display
- Shows floating panel with suggestions
- Color-coded by suggestion type:
  - 🔍 Clarity (green)
  - 🎯 Specificity (orange) 
  - 🎭 Tone (purple)
  - 📝 Structure (yellow)
  - ✨ Enhancement (pink)

### 4. User Authentication
- Integrates with existing Supabase authentication
- Stores auth tokens securely in Chrome storage
- Validates tokens and handles refresh

### 5. Subscription Management
- Checks user subscription status
- Provides different features based on plan
- Links to upgrade page for premium features

## Platform Support

### ChatGPT (chat.openai.com)
- Detects textarea elements
- Suggests step-by-step formatting
- Optimizes for detailed explanations

### Claude (claude.ai)
- Monitors contenteditable elements
- Encourages reasoning-based prompts
- Suggests analytical language

### Gemini (gemini.google.com)
- Finds various input selectors
- Promotes conversational tone
- Optimizes for understanding-focused prompts

## API Integration

### Authentication Flow
1. User enters credentials in popup
2. Background script authenticates with Supabase
3. Stores auth tokens in Chrome storage
4. Validates tokens on subsequent requests

### Suggestion Generation
1. Content script captures text input
2. Sends to background script with platform context
3. Background script calls suggestion API
4. Returns analyzed suggestions to content script
5. Content script displays suggestions in panel

### Subscription Verification
1. Background script checks user subscription
2. Queries Supabase subscriptions table
3. Updates UI based on subscription status
4. Limits features for free users

## Security Features

### Data Protection
- No sensitive data stored in extension
- Auth tokens encrypted in Chrome storage
- Secure HTTPS communication only

### Permissions
- Minimal required permissions
- Host permissions only for supported AI platforms
- No access to other websites

### Privacy
- Text analysis happens server-side
- No persistent storage of user prompts
- Respects user privacy settings

## Development

### Testing
1. Load extension in developer mode
2. Navigate to supported AI platforms
3. Test text input detection and suggestions
4. Verify authentication flow
5. Check subscription status integration

### Debugging
- Use Chrome DevTools for content script debugging
- Check background script in Extensions page
- Monitor network requests in DevTools
- View Chrome storage in Application tab

### Building
1. Ensure all files are properly structured
2. Test on all supported platforms
3. Verify manifest permissions
4. Package for distribution

## Configuration

### Environment Variables
Update the API_BASE_URL in relevant files:
- `src/background.js`
- `src/popup.js` 
- `src/utils/auth.js`

### Supabase Integration
Ensure proper Supabase configuration:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- Database tables (users, subscriptions)

## Troubleshooting

### Common Issues
1. **Extension not loading**: Check manifest.json syntax
2. **Text areas not detected**: Verify selectors for platform
3. **Authentication failing**: Check API endpoints and CORS
4. **Suggestions not appearing**: Verify background script communication

### Debug Steps
1. Check browser console for errors
2. Verify extension permissions
3. Test API endpoints manually
4. Check Chrome storage contents

## Future Enhancements

### Planned Features
- Support for more AI platforms
- Advanced suggestion algorithms
- Prompt templates and history
- Team collaboration features
- Analytics and usage insights

### Technical Improvements
- Offline suggestion caching
- Better error handling
- Performance optimizations
- Accessibility improvements

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Chrome extension documentation
3. Contact support through the main application

## License

This extension is part of the AI Prompt Enhancer platform and follows the same licensing terms.