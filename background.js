// Background script for TapReply Chrome Extension
chrome.runtime.onInstalled.addListener(() => {
    console.log("TapReply installed");
    // Set initial state
    chrome.storage.local.set({
        preferredTone: 'witty',
        apiKey: '',
        apiProvider: 'openai',
        replyLength: 'short',
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
        // console.log('Settings updated:', request.settings);
        // Could trigger any necessary updates here
        sendResponse({ success: true });
        return true;
    }
});

async function generateReply(data) {
    try {
        const { content, metadata, tone, platform } = data;
        
        const config = await chrome.storage.local.get(['apiKey', 'apiProvider', 'replyLength']);
        
        if (!config.apiKey) {
            return {
                success: false,
                error: 'API key not configured. Please set your API key in the extension settings.'
            };
        }

        const { systemPrompt, userPrompt } = generatePrompt(content, metadata, tone, platform, config.replyLength);
        const reply = await callLLMAPI(systemPrompt, userPrompt, config.apiKey, config.apiProvider);
        
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

        const testSystemPrompt = "You are a helpful AI assistant. Respond with exactly what the user asks for.";
        const testUserPrompt = "Generate a simple test response. Just say 'API connection successful!'";
        
        const response = await callLLMAPI(testSystemPrompt, testUserPrompt, apiKey, provider);
        
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

function generatePrompt(content, metadata, tone, platform, replyLength = 'medium') {
    const toneInstructions = {
        supportive: "Supportive, an encouraging reply that shows empathy and understanding towards the post content subject or author",
        analytical: "Analytical, a reply that provides thoughtful insights and constructive feedback, furthering the conversation by bringing value",
        witty: "Witty, an engaging reply that's clever and entertaining without being too cringe"
    };

    const platformContext = {
        // linkedin: "LinkedIn", // LinkedIn support temporarily disabled
        twitter: "Twitter/X",
        reddit: "Reddit"
    };

    const lengthInstructions = {
        short: "Keep the reply very tight, 1-2 sentences, 50-100 characters",
        medium: "Keep the reply moderate in length, 2-3 sentences, 100-200 characters",
        long: "You can write a longer, more detailed reply, 3-4 sentences, 200+ characters."
    };

    // Build platform-specific context based on metadata
    let platformSpecificContext = '';
    if (metadata) {
        // Loop through all metadata fields and add them to context
        for (const [key, value] of Object.entries(metadata)) {
            if (value !== null && value !== undefined) {
                if (typeof value === 'object') {
                    // Handle nested objects like engagement
                    for (const [nestedKey, nestedValue] of Object.entries(value)) {
                        if (nestedValue !== null && nestedValue !== undefined) {
                            platformSpecificContext += `\n${nestedKey}: ${nestedValue}`;
                        }
                    }
                } else {
                    platformSpecificContext += `\n${key}: ${value}`;
                }
            }
        }
    }

    const systemPrompt = `You're a clever social media user known for smart, tight, and dryly humorous replies. You are given social media post content and asked to write comments that sound like they came from a real, slightly cynical but insightful person. Avoid sounding like a chatbot, overly cheerful, helpful, or corporate. Avoid the use of "—" in your replies. Do not wrap your reply in quotes. Engage with the original post, add value or humor, and never explain yourself. Pay attention to queues from the user about what your reply should contain an how it should sound.

Example #1:

Content - "I wonder what kind of 10x engineer decided to make the "-> type" in functions a suggestion

It would've made more sense if it was actually checking for something gives editors / linters (Pylance, MyPy, Pyright, Ruff…) something to check; does absolutely nothing at runtime unless you add a library or code that reads the annotation and enforces it."

Reply - "If only there was a document, a Python improvement proposal of sorts, that describes the decisions that went into the design of type annotations. We'll probably never know what went through their minds"

Reply - "The flexibility lets Python stay dynamic, but yeah, runtime checks would be nice sometimes."

Reply - "It's intentional. Keeps Python flexible while letting static tools do the heavy lifting."`;

    const userPrompt = `Reply with a ${platformContext[platform]} comment, ${toneInstructions[tone]}. ${lengthInstructions[replyLength]}.

${platformSpecificContext}

Post: 
${content}`;

    return { systemPrompt, userPrompt };
}

async function callLLMAPI(system_prompt, user_prompt, apiKey, provider) {
    if (provider === 'openai') {
        return await callOpenAI(system_prompt, user_prompt, apiKey);
    } else if (provider === 'gemini') {
        return await callGemini(system_prompt, user_prompt, apiKey);
    } else {
        throw new Error('Unsupported API provider');
    }
}

async function callOpenAI(system_prompt, user_prompt, apiKey) {
    const messages = [];
    
    if (system_prompt) {
        messages.push({
            role: 'system',
            content: system_prompt
        });
    }
    
    messages.push({
        role: 'user',
        content: user_prompt
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4.1',
            messages: messages,
            temperature: 1.0
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API request failed');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
}

async function callGemini(system_prompt, user_prompt, apiKey) {
    let fullPrompt = '';
    
    if (system_prompt) {
        fullPrompt += system_prompt + '\n\n';
    }
    
    fullPrompt += user_prompt;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
        method: 'POST',
        headers: {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: fullPrompt
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 1.0,
                thinkingConfig: {
                    thinkingBudget: 0
                }
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