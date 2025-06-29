// Popup functionality for TapReply Chrome Extension
class TapReplyPopup {
    constructor() {
        this.currentTone = 'supportive';
        this.currentPlatform = null;
        this.currentContent = '';
        this.init();
    }

    init() {
        this.bindEvents();
        this.detectPlatform();
        this.loadUserPreferences();
        this.extractContent();
    }

    bindEvents() {
        // Tone selection
        document.querySelectorAll('.tone-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectTone(e.target.closest('.tone-btn').dataset.tone);
            });
        });

        // Generate button
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateReply();
        });

        // Copy button
        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyReply();
        });

        // Regenerate button
        document.getElementById('regenerateBtn').addEventListener('click', () => {
            this.generateReply();
        });

        // Retry button
        document.getElementById('retryBtn').addEventListener('click', () => {
            this.hideError();
            this.generateReply();
        });
    }

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
            }

            this.currentPlatform = platform;
            this.updatePlatformDisplay(platformIcon, platformName);
        } catch (error) {
            console.error('Error detecting platform:', error);
            this.updatePlatformDisplay('🌐', 'Unknown Platform');
        }
    }

    updatePlatformDisplay(icon, name) {
        document.getElementById('platformIcon').textContent = icon;
        document.getElementById('platformName').textContent = name;
    }

    async extractContent() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Send message to content script to extract post content
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'extractContent'
            });

            if (response && response.content) {
                this.currentContent = response.content;
                this.displayContent();
            } else {
                this.showError('No post content found. Please make sure you are on a social media post page.');
            }
        } catch (error) {
            console.error('Error extracting content:', error);
            this.showError('Unable to extract post content. Please refresh the page and try again.');
        }
    }

    displayContent() {
        if (this.currentContent) {
            const contentText = document.getElementById('contentText');
            const contentSection = document.getElementById('contentSection');
            
            // Truncate content if too long
            const truncatedContent = this.currentContent.length > 200 
                ? this.currentContent.substring(0, 200) + '...'
                : this.currentContent;
            
            contentText.textContent = truncatedContent;
            contentSection.style.display = 'block';
        }
    }

    selectTone(tone) {
        this.currentTone = tone;
        
        // Update UI
        document.querySelectorAll('.tone-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tone="${tone}"]`).classList.add('active');
        
        // Save preference
        chrome.storage.local.set({ preferredTone: tone });
    }

    async loadUserPreferences() {
        try {
            const result = await chrome.storage.local.get(['preferredTone']);
            if (result.preferredTone) {
                this.selectTone(result.preferredTone);
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    }

    async generateReply() {
        if (!this.currentContent) {
            this.showError('No post content available. Please refresh the page and try again.');
            return;
        }

        this.showLoading();
        this.hideError();
        this.hideReply();

        try {
            // Send message to background script to generate reply
            const response = await chrome.runtime.sendMessage({
                action: 'generateReply',
                data: {
                    content: this.currentContent,
                    tone: this.currentTone,
                    platform: this.currentPlatform
                }
            });

            if (response.success) {
                this.displayReply(response.reply);
            } else {
                this.showError(response.error || 'Failed to generate reply. Please try again.');
            }
        } catch (error) {
            console.error('Error generating reply:', error);
            this.showError('Network error. Please check your internet connection and try again.');
        }
    }

    displayReply(reply) {
        this.hideLoading();
        const replyText = document.getElementById('replyText');
        const replySection = document.getElementById('replySection');
        
        replyText.textContent = reply;
        replySection.style.display = 'block';
        
        // Scroll to reply section
        replySection.scrollIntoView({ behavior: 'smooth' });
    }

    async copyReply() {
        const replyText = document.getElementById('replyText').textContent;
        
        try {
            await navigator.clipboard.writeText(replyText);
            this.showCopySuccess();
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            this.showError('Failed to copy reply to clipboard.');
        }
    }

    showCopySuccess() {
        const copyBtn = document.getElementById('copyBtn');
        const originalText = copyBtn.innerHTML;
        
        copyBtn.innerHTML = '<span class="btn-icon">✅</span>Copied!';
        copyBtn.style.backgroundColor = '#10B981';
        copyBtn.style.borderColor = '#10B981';
        copyBtn.style.color = '#FFFFFF';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.backgroundColor = '';
            copyBtn.style.borderColor = '';
            copyBtn.style.color = '';
        }, 2000);
    }

    showLoading() {
        document.getElementById('loadingSection').style.display = 'block';
        document.getElementById('generateBtn').disabled = true;
    }

    hideLoading() {
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('generateBtn').disabled = false;
    }

    showError(message) {
        this.hideLoading();
        this.hideReply();
        
        document.getElementById('errorText').textContent = message;
        document.getElementById('errorSection').style.display = 'block';
    }

    hideError() {
        document.getElementById('errorSection').style.display = 'none';
    }

    hideReply() {
        document.getElementById('replySection').style.display = 'none';
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TapReplyPopup();
}); 