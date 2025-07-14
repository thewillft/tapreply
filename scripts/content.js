// Content script for TapReply Chrome Extension
// This script runs on social media pages to help extract post content

console.log('TapReply content script loaded');

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractContent') {
        const contentData = extractPostContent();
        sendResponse({ contentData: contentData, readyState: document.readyState });
        return true; // Keep message channel open for async response
    }
});

function extractPostContent() {
    const url = window.location.href;
    const adapter = getPlatformAdapter(url);
    if (adapter) {
        return adapter.extractContentData();
    }
    return null;
}

// Auto-extract content when page loads (for future use)
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for dynamic content to load
    setTimeout(() => {
        const contentData = extractPostContent();
        if (contentData && contentData.content) {
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
