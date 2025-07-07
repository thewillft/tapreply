// Platform adapters for TapReply Chrome Extension
// This file provides an abstraction layer for platform-specific content extraction

class PlatformAdapter {
    constructor() {
        this.platform = null;
    }

    // Abstract method - should be implemented by subclasses
    extractContent() {
        throw new Error('extractContent must be implemented by subclass');
    }

    // Abstract method - should be implemented by subclasses
    extractMetadata() {
        throw new Error('extractMetadata must be implemented by subclass');
    }

    // Common method to get content, platform, and metadata
    extractContentData() {
        return {
            platform: this.platform,
            content: this.extractContent(),
            metadata: this.extractMetadata()
        };
    }
}

// LinkedIn support temporarily disabled
/*
class LinkedInAdapter extends PlatformAdapter {
    constructor() {
        super();
        this.platform = 'linkedin';
    }

    extractContent() {
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

    extractMetadata() {
        return {
            author: this.extractAuthor(),
            postType: this.extractPostType(),
            engagement: this.extractEngagement()
        };
    }

    extractAuthor() {
        const authorSelectors = [
            '.feed-shared-actor__name',
            '.feed-shared-actor__title',
            '[data-test-id="post-author"]'
        ];
        
        for (const selector of authorSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        return null;
    }

    extractPostType() {
        if (document.querySelector('.job-card-container')) return 'job';
        if (document.querySelector('.feed-shared-article')) return 'article';
        if (document.querySelector('.feed-shared-image')) return 'image';
        return 'text';
    }

    extractEngagement() {
        const likesElement = document.querySelector('.social-details-social-counts__reactions-count');
        return likesElement ? likesElement.textContent.trim() : null;
    }
}
*/

class TwitterAdapter extends PlatformAdapter {
    constructor() {
        super();
        this.platform = 'twitter';
    }

    extractContent() {
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

    extractMetadata() {
        return {
            author: this.extractAuthor(),
            isRetweet: this.extractIsRetweet(),
            engagement: this.extractEngagement()
        };
    }

    extractAuthor() {
        const authorSelectors = [
            '[data-testid="User-Name"]',
            '.css-1dbjc4n.r-1wbh5a2.r-dnmrzs',
            '.css-901oao.css-bfa6kz.r-1re7ezh.r-18u37iz.r-1qd0xha.r-a023e6.r-16dba41.r-ad9z0x.r-bcqeeo.r-qvutc0'
        ];
        
        for (const selector of authorSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        return null;
    }

    extractIsRetweet() {
        return document.querySelector('[data-testid="socialContext"]') !== null;
    }

    extractEngagement() {
        const engagement = {};
        
        // Likes
        const likeButton = document.querySelector('[data-testid="like"]');
        if (likeButton) {
            const likeCount = likeButton.querySelector('[data-testid="app-text-transition-container"]');
            if (likeCount) {
                engagement.likes = likeCount.textContent.trim();
            }
        }
        
        // Retweets
        const retweetButton = document.querySelector('[data-testid="retweet"]');
        if (retweetButton) {
            const retweetCount = retweetButton.querySelector('[data-testid="app-text-transition-container"]');
            if (retweetCount) {
                engagement.retweets = retweetCount.textContent.trim();
            }
        }
        
        return Object.keys(engagement).length > 0 ? engagement : null;
    }
}

class RedditAdapter extends PlatformAdapter {
    constructor() {
        super();
        this.platform = 'reddit';
    }

    extractContent() {
        const titleElement = document.querySelector('h1, .Post__title');
        const title = titleElement ? titleElement.textContent.trim() : '';

        const contentElement = document.querySelector('[id*="t3_"][id*="post-rtjson-content"]');
        const content = contentElement ? contentElement.textContent.trim() : '';

        let fullContent = '';
        if (title) {
            fullContent += title + '\n\n';
        }
        if (content) {
            fullContent += content;
        }

        return fullContent.trim() || null;
    }

    extractMetadata() {
        return {
            subreddit: this.extractSubreddit(),
            author: this.extractAuthor(),
            postType: this.extractPostType(),
            engagement: this.extractEngagement(),
            flair: this.extractFlair()
        };
    }

    extractSubreddit() {
        // Use the specific selector for subreddit name based on the HTML structure
        const subredditElement = document.querySelector('a.subreddit-name');
        if (subredditElement && subredditElement.textContent.trim()) {
            return subredditElement.textContent.trim();
        }
        
        // Fallback: extract from URL
        const url = window.location.href;
        const urlMatch = url.match(/\/r\/([^\/]+)/);
        if (urlMatch) {
            return urlMatch[1];
        }
        
        return null;
    }

    extractAuthor() {
        const authorSelectors = [
            'a[href^="/user/"]',
            '.Post__author',
            '[data-testid="post-author"]'
        ];
        
        for (const selector of authorSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                const text = element.textContent.trim();
                return text.replace(/^u\//, '');
            }
        }
        return null;
    }

    extractPostType() {
        if (document.querySelector('.Post__image')) return 'image';
        if (document.querySelector('.Post__video')) return 'video';
        if (document.querySelector('.Post__link')) return 'link';
        if (document.querySelector('.Post__text')) return 'text';
        return 'text';
    }

    extractEngagement() {
        const engagement = {};
        
        // Upvotes
        const upvoteElement = document.querySelector('[data-testid="post-upvote"]');
        if (upvoteElement) {
            const upvoteText = upvoteElement.textContent.trim();
            if (upvoteText) {
                engagement.upvotes = upvoteText;
            }
        }
        
        // Comments
        const commentElement = document.querySelector('[data-testid="post-comment"]');
        if (commentElement) {
            const commentText = commentElement.textContent.trim();
            if (commentText) {
                engagement.comments = commentText;
            }
        }
        
        return Object.keys(engagement).length > 0 ? engagement : null;
    }

    extractFlair() {
        const flairElement = document.querySelector('.Post__flair, .flair');
        return flairElement ? flairElement.textContent.trim() : null;
    }
}

// Factory function to get the appropriate adapter based on URL
function getPlatformAdapter(url) {
    // LinkedIn support temporarily disabled
    // if (url.includes('linkedin.com')) {
    //     return new LinkedInAdapter();
    // } else 
    if (url.includes('twitter.com') || url.includes('x.com')) {
        return new TwitterAdapter();
    } else if (url.includes('reddit.com')) {
        return new RedditAdapter();
    }
    return null;
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PlatformAdapter, /* LinkedInAdapter, */ TwitterAdapter, RedditAdapter, getPlatformAdapter };
} 