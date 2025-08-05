# Configuration

TapReply offers several configuration options to customize your AI-powered social media replies. This guide explains each setting and how it affects your experience.

## API Configuration

### AI Provider
Choose between two AI providers for generating your replies:

- **OpenAI (GPT-4.1)** - Default option, provides high-quality responses
- **Google Gemini (Gemini 2.5 Flash)** - Alternative AI model with fast response times

### API Keys
You'll need to provide an API key for your chosen provider:

#### OpenAI API Key
- **Format**: `sk-...` (starts with "sk-")
- **Where to get it**: [OpenAI Platform](https://platform.openai.com/api-keys)
- **Usage**: Used for GPT-4.1 model responses

#### Gemini API Key
- **Format**: `AIza...` (starts with "AIza")
- **Where to get it**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Usage**: Used for Gemini 2.5 Flash model responses

### Test Connection
Use the "Test Connection" button to verify your API key is working correctly before saving your settings.

## Default Preferences

### Reply Tone
Choose your preferred tone for AI-generated replies:

- **🤝 Supportive** - Encouraging and helpful responses
- **🧠 Analytical** - Thoughtful and data-driven replies
- **😄 Witty** - Humorous and engaging responses

### Reply Length
Set your preferred response length:

- **Short (50-100 characters)** - Concise, quick replies
- **Medium (100-200 characters)** - Balanced responses (default)
- **Long (200+ characters)** - Detailed, comprehensive replies

### Platform Detection
- **Auto-detect platform and adapt tone** - When enabled, TapReply automatically adjusts the tone based on the social media platform (LinkedIn, Twitter/X, Reddit, etc.)

### Reply Style
- **All lowercase replies** - When enabled, the LLM will be instructed to a provide
a reply consisting primarily of lowercase characters for a more casual style.

## Knowledge Base & Background

### Your Knowledge & Background
This is where you can provide information about yourself that helps create more personalized and relevant replies. Include:

- **Professional background and expertise**
- **Products or services you offer**
- **Industry knowledge and experience**
- **Personal interests or specializations**
- **Specific topics you're passionate about**

**Example:**
```
I'm a software engineer with 8 years of experience in web development, specializing in React and Node.js. I run a tech blog where I share coding tutorials and best practices. I'm passionate about open source projects and helping junior developers grow their skills.
```

This information helps TapReply generate replies that:
- Reference your expertise when relevant
- Mention your products/services naturally when appropriate
- Match your professional tone and style
- Align with your areas of knowledge

## Saving and Managing Settings

### Save Settings
Click the "Save Settings" button to store your configuration. Your settings are saved locally in your browser and will persist across sessions.

### Reset to Defaults
Use the "Reset to Defaults" button to restore all settings to their original values:
- AI Provider: OpenAI
- Default Tone: Supportive
- Reply Length: Medium
- Platform Detection: Enabled
- All Lowercase: Disabled
- Knowledge Base: Empty

## Privacy and Security

- **Local Storage**: All settings are stored locally in your browser
- **API Keys**: Your API keys are encrypted and never shared
- **No Data Collection**: TapReply doesn't collect or store your personal data
- **Secure API Calls**: All API requests are made directly from your browser to the AI provider

## Troubleshooting

### API Connection Issues
If you're having trouble with API connections:
1. Verify your API key is correct and active
2. Check your internet connection
3. Ensure you have sufficient API credits/quota
4. Try the "Test Connection" button to diagnose issues

### Settings Not Saving
If your settings aren't being saved:
1. Make sure you click the "Save Settings" button
2. Check that you have sufficient browser storage space
3. Try refreshing the options page

For more help, visit our [GitHub repository](https://github.com/thewillft/tapreply) or check the [Privacy Policy](privacy-policy.md). 