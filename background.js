// Background script for TapReply Chrome Extension
chrome.runtime.onInstalled.addListener(() => {
    console.log("TapReply installed");
    // Set initial state
    chrome.storage.local.set({
        preferredTone: 'supportive',
        apiKey: '',
        apiProvider: 'openai',
        replyLength: 'medium',
        autoDetectPlatform: true
    });
});

// Handle messages from popup and options
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'generateReply') {
        generateReply(request.data)
            .then(response => sendResponse(response))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
    }
    
    if (request.action === 'testApiConnection') {
        testApiConnection(request.data)
            .then(response => sendResponse(response))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
    
    if (request.action === 'settingsUpdated') {
        console.log('Settings updated:', request.settings);
        // Could trigger any necessary updates here
        sendResponse({ success: true });
        return true;
    }
});

async function generateReply(data) {
    try {
        const { content, tone, platform } = data;
        
        // Get API configuration from storage
        const config = await chrome.storage.local.get(['apiKey', 'apiProvider', 'replyLength']);
        
        if (!config.apiKey) {
            return {
                success: false,
                error: 'API key not configured. Please set your API key in the extension settings.'
            };
        }

        // Generate prompt based on platform and tone
        const prompt = generatePrompt(content, tone, platform, config.replyLength);
        
        // Call the appropriate API
        const reply = await callLLMAPI(prompt, config.apiKey, config.apiProvider);
        
        return {
            success: true,
            reply: reply
        };
    } catch (error) {
        console.error('Error generating reply:', error);
        return {
            success: false,
            error: error.message || 'Failed to generate reply'
        };
    }
}

async function testApiConnection(data) {
    try {
        const { provider, apiKey } = data;
        
        if (!apiKey) {
            return {
                success: false,
                error: 'No API key provided'
            };
        }

        // Create a simple test prompt
        const testPrompt = "Generate a simple test response. Just say 'API connection successful!'";
        
        // Test the API
        const response = await callLLMAPI(testPrompt, apiKey, provider);
        
        if (response && response.includes('successful')) {
            return {
                success: true,
                message: 'API connection test passed'
            };
        } else {
            return {
                success: false,
                error: 'Unexpected response from API'
            };
        }
    } catch (error) {
        console.error('API test failed:', error);
        return {
            success: false,
            error: error.message || 'API test failed'
        };
    }
}

function generatePrompt(content, tone, platform, replyLength = 'medium') {
    const toneInstructions = {
        supportive: "Write a supportive and encouraging reply that shows empathy and understanding.",
        analytical: "Write an analytical reply that provides thoughtful insights and constructive feedback.",
        witty: "Write a witty and engaging reply that's clever and entertaining while remaining respectful."
    };

    const platformContext = {
        linkedin: "This is for LinkedIn, so keep it professional and business-oriented.",
        twitter: "This is for Twitter/X, so keep it concise and engaging.",
        reddit: "This is for Reddit, so adapt to the community's tone and style."
    };

    const lengthInstructions = {
        short: "Keep the reply very concise (50-100 characters).",
        medium: "Keep the reply moderate in length (100-200 characters).",
        long: "You can write a longer, more detailed reply (200+ characters)."
    };

    return `You are an AI assistant helping users generate replies to social media posts.

${platformContext[platform] || ''}

${toneInstructions[tone]}

${lengthInstructions[replyLength] || lengthInstructions.medium}

Post content: "${content}"

Generate a natural, authentic reply that:
- Matches the specified tone
- Is appropriate for the platform
- Adds value to the conversation
- Sounds human and genuine
- Is not overly promotional or spammy
- Follows the specified length guidelines

Reply:`;
}

async function callLLMAPI(prompt, apiKey, provider) {
    if (provider === 'openai') {
        return await callOpenAI(prompt, apiKey);
    } else if (provider === 'gemini') {
        return await callGemini(prompt, apiKey);
    } else {
        throw new Error('Unsupported API provider');
    }
}

async function callOpenAI(prompt, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 150,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API request failed');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
}

async function callGemini(prompt, apiKey) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],
            generationConfig: {
                maxOutputTokens: 150,
                temperature: 0.7
            }
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Gemini API request failed');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
}