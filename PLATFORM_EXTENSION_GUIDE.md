# Platform Extension Guide

This guide explains how to add support for new social media platforms to the TapReply extension using the adapter pattern.


## Architecture Overview

The extension uses a **Platform Adapter Pattern** to abstract platform-specific content extraction. This makes it easy to add new platforms without modifying the core logic.

### Key Components

1. **PlatformAdapter** (Base class) - Abstract interface for all platform adapters
2. **Platform-specific adapters** - Concrete implementations for each platform
3. **Factory function** - `getPlatformAdapter(url)` - Returns the appropriate adapter based on URL
4. **Content script** - Uses the adapter to extract content and metadata
5. **Background script** - Uses metadata to generate better prompts

### Data Structure

The extracted data follows this structure:
```javascript
{
    content: "The actual post content text",
    platform: "linkedin|twitter|reddit|etc",
    metadata: {
        // Platform-specific metadata fields
        author: "username",
        postType: "text|image|video|etc",
        engagement: { /* engagement metrics */ },
        // ... other platform-specific fields
    }
}
```

The `content` and `platform` fields are common across all platforms and are extracted at the adapter level, while `metadata` contains platform-specific information.


## Adding a New Platform

### Step 1: Create a New Adapter Class

Create a new class that extends `PlatformAdapter` in `scripts/platform-adapters.js`:

```javascript
class InstagramAdapter extends PlatformAdapter {
    constructor() {
        super();
        this.platform = 'instagram';
    }

    extractContent() {
        // Implement Instagram-specific content extraction
        const selectors = [
            '[data-testid="post-caption"]',
            '.caption',
            '.post-content'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        
        return null;
    }

    extractMetadata() {
        return {
            author: this.extractAuthor(),
            postType: this.extractPostType(),
            engagement: this.extractEngagement(),
            hashtags: this.extractHashtags()
        };
    }

    extractAuthor() {
        const authorElement = document.querySelector('[data-testid="post-author"]');
        return authorElement ? authorElement.textContent.trim() : null;
    }

    extractPostType() {
        if (document.querySelector('.video-post')) return 'video';
        if (document.querySelector('.carousel-post')) return 'carousel';
        return 'image';
    }

    extractEngagement() {
        const engagement = {};
        
        const likesElement = document.querySelector('[data-testid="likes-count"]');
        if (likesElement) {
            engagement.likes = likesElement.textContent.trim();
        }
        
        const commentsElement = document.querySelector('[data-testid="comments-count"]');
        if (commentsElement) {
            engagement.comments = commentsElement.textContent.trim();
        }
        
        return Object.keys(engagement).length > 0 ? engagement : null;
    }

    extractHashtags() {
        const hashtagElements = document.querySelectorAll('a[href^="/explore/tags/"]');
        return Array.from(hashtagElements).map(el => el.textContent.trim());
    }
}
```

### Step 2: Update the Factory Function

Add your new platform to the `getPlatformAdapter` function:

```javascript
function getPlatformAdapter(url) {
    if (url.includes('linkedin.com')) {
        return new LinkedInAdapter();
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
        return new TwitterAdapter();
    } else if (url.includes('reddit.com')) {
        return new RedditAdapter();
    } else if (url.includes('instagram.com')) {
        return new InstagramAdapter();
    }
    return null;
}
```

### Step 3: Update Manifest Permissions

Add the new platform's URL pattern to `manifest.json`:

```json
{
  "content_scripts": [
    {
      "matches": [
        "*://*.linkedin.com/*",
        "*://*.twitter.com/*",
        "*://*.x.com/*",
        "*://*.reddit.com/*",
        "*://*.instagram.com/*"
      ],
      "js": ["scripts/platform-adapters.js", "scripts/content.js"],
      "run_at": "document_idle"
    }
  ]
}
```

### Step 4: Update Platform Detection

If you want the popup to detect and display the new platform, update `popup.js`:

```javascript
async detectPlatform() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tab.url;
        
        let platform = 'unknown';
        let platformIcon = '🌐';
        let platformName = 'Unknown Platform';

        if (url.includes('linkedin.com')) {
            platform = 'linkedin';
            platformIcon = '💼';
            platformName = 'LinkedIn';
        } else if (url.includes('twitter.com') || url.includes('x.com')) {
            platform = 'twitter';
            platformIcon = '🐦';
            platformName = 'Twitter/X';
        } else if (url.includes('reddit.com')) {
            platform = 'reddit';
            platformIcon = '🤖';
            platformName = 'Reddit';
        } else if (url.includes('instagram.com')) {
            platform = 'instagram';
            platformIcon = '📷';
            platformName = 'Instagram';
        }

        this.currentPlatform = platform;
        this.updatePlatformDisplay(platformIcon, platformName);
    } catch (error) {
        console.error('Error detecting platform:', error);
        this.updatePlatformDisplay('🌐', 'Unknown Platform');
    }
}
```


## Platform-Specific Metadata Examples

### Reddit
- `subreddit`: The subreddit name (e.g., "programming")
- `author`: The post author's username
- `postType`: Type of post ("text", "image", "video", "link")
- `engagement`: Object with `upvotes` and `comments` counts
- `flair`: Post flair/tag

### Twitter/X
- `author`: The tweet author's name
- `isRetweet`: Boolean indicating if it's a retweet
- `engagement`: Object with `likes` and `retweets` counts

### LinkedIn
- `author`: The post author's name
- `postType`: Type of post ("text", "article", "job", "image")
- `engagement`: Engagement count


## Best Practices

1. **Fallback Logic**: Include fallback extraction methods when primary selectors fail
2. **Error Handling**: Return `null` for missing data rather than throwing errors
3. **Consistent Structure**: Follow the same metadata structure as existing adapters when possible
4. **Testing**: Test your adapter on different post types and UI variations


## Benefits of This Architecture

1. **Extensibility**: Easy to add new platforms without touching core logic
2. **Maintainability**: Platform-specific code is isolated and easy to update
3. **Consistency**: All platforms follow the same interface
4. **Rich Context**: Platform-specific metadata enables better prompt generation
5. **Future-Proof**: New platforms can be added without breaking existing functionality 