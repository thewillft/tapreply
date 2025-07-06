# TapReply

AI-powered Chrome extension used to generate smart, tone-aware replies for social media posts — with just a tap.


## Features

- **Multi-Platform Support**: Works on LinkedIn, Twitter/X, and Reddit, with plans to add more later
- **Smart Content Extraction**: Automatically extracts post content and platform-specific metadata for best possible replies
- **Tone-Aware Replies**: Generate supportive, analytical, or witty replies, with plans to add custom tones soon
- **Platform-Optimized**: Replies are tailored to each platform's culture and context, whether it be professional or more casual
- **Extensible Architecture**: Easy to add support for new platforms in the future with basic programming knowledge

## Supported Platforms

### Reddit
- Community-aware replies with subreddit context
- Identifies post type (text, image, video, link)
- Captures post flair and engagement metrics

### Twitter/X
- Concise and engaging tweets
- Detects retweets vs original posts
- Extracts engagement metrics (likes, retweets)
- Optimizes for character limits and platform style

### LinkedIn
- Professional posts with business context
- Identifies post types (job, article, image, text)
- Maintains business-appropriate tone


## Installation

### Chrome Web Store
1. WIP

### Packed
1. WIP

### Unpacked
1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory
5. The TapReply extension should now appear


## Usage

1. Navigate to a supported social media platform (LinkedIn, Reddit, Twitter/X, ...)
2. Click the TapReply extension icon in the Chrome extensions dropdown (pin it for ease of use)
3. Select your preferred tone (supportive, analytical, or witty)
4. Click "Generate Reply" to create a context-aware reply to the current social media post
5. Copy and paste the generated reply, editing as you wish before sending it


## Configuration

This can be done via the extension's options page, found through the chrome browser or by clicking the gear icon in the footer of the extension's popup. The following fields can be configured there:

- **API Provider**: Choose between OpenAI and Google Gemini
- **API Key**: Set your preferred LLM API key
- **Reply Length**: Short, medium, or long replies
- **Default Tone**: Set your preferred default tone


## Architecture

The extension follows a modular architecture with clear separation of concerns:

- **Background Script** (`background.js`): Service worker handling LLM API calls and other operations in the background
- **Content Scripts** (`scripts/`): Injected into web pages to extract post content and metadata using platform-specific adapters
- **Popup Interface** (`popup/`): User interface for tone selection and reply generation
- **Options Page** (`options/`): Configuration interface for API settings and preferences
- **Manifest** (`manifest.json`): Extension configuration and permissions declaration


## Adding New Platforms

The extension is designed to be easily extensible. The general idea is that a new platform adapter class (responsible for platform-specific post content extraction) is created and added to the factory function, making it automatically used when you navigate to that platform's website. See [PLATFORM_EXTENSION_GUIDE.md](PLATFORM_EXTENSION_GUIDE.md) for more detailed instructions on adding support for new social media platforms.
