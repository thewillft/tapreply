// Content script for TapReply Chrome Extension
// This script runs on social media pages to help extract post content

console.log('TapReply content script loaded');

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractContent') {
        const content = extractPostContent();
        sendResponse({ content: content });
        return true; // Keep message channel open for async response
    }
});

function extractPostContent() {
    const url = window.location.href;
    
    // LinkedIn post content extraction
    if (url.includes('linkedin.com')) {
        return extractLinkedInContent();
    }
    
    // Twitter/X post content extraction
    if (url.includes('twitter.com') || url.includes('x.com')) {
        return extractTwitterContent();
    }
    
    // Reddit post content extraction
    if (url.includes('reddit.com')) {
        return extractRedditContent();
    }
    
    return null;
}

function extractLinkedInContent() {
    // Try multiple selectors for LinkedIn posts
    const selectors = [
        '[data-test-id="post-content"]',
        '.feed-shared-update-v2__description',
        '.feed-shared-text',
        '.feed-shared-update-v2__description-wrapper',
        '.feed-shared-text__text',
        '.break-words'
    ];
    
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
            return element.textContent.trim();
        }
    }
    
    // Fallback: look for any text content in the main feed area
    const feedElements = document.querySelectorAll('.feed-shared-update-v2, .feed-shared-post');
    for (const element of feedElements) {
        const textContent = element.textContent.trim();
        if (textContent.length > 50) {
            return textContent;
        }
    }
    
    return null;
}

function extractTwitterContent() {
    // Try multiple selectors for Twitter/X posts
    const selectors = [
        '[data-testid="tweetText"]',
        '.tweet-text',
        '[lang]',
        '.css-901oao',
        '.css-1dbjc4n'
    ];
    
    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
            const textContent = element.textContent.trim();
            if (textContent.length > 10 && textContent.length < 1000) {
                return textContent;
            }
        }
    }
    
    // Fallback: look for tweet containers
    const tweetContainers = document.querySelectorAll('[data-testid="tweet"], .tweet');
    for (const container of tweetContainers) {
        const textContent = container.textContent.trim();
        if (textContent.length > 50) {
            return textContent;
        }
    }
    
    return null;
}

function extractRedditContent() {
    const titleElement = document.querySelector('h1, .Post__title');
    const title = titleElement ? titleElement.textContent.trim() : '';

    const contentElement = document.querySelector('[id*="t3_"][id*="post-rtjson-content"]');
    const content = contentElement ? contentElement.textContent.trim() : '';

    let result = '';
    if (title) {
        result += title + '\n\n';
    }
    if (content) {
        result += content;
    }

    return result.trim() || null;
}

// Auto-extract content when page loads (for future use)
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for dynamic content to load
    setTimeout(() => {
        const content = extractPostContent();
        if (content) {
            console.log('TapReply: Content extracted successfully');
        }
    }, 2000);
});

// Listen for dynamic content changes
const observer = new MutationObserver((mutations) => {
    // Could be used to detect when new posts load
    // For now, just log that content changed
    console.log('TapReply: Page content changed');
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});
