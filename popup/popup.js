// Popup functionality for TapReply Chrome Extension
class TapReplyPopup {
    constructor() {
        this.currentTone = 'supportive';
        this.currentPlatform = null;
        this.currentContent = '';
        this.currentMetadata = null;
        this.init();
    }

    init() {
        this.disableGenerateButton();
        this.bindEvents();
        this.detectPlatform();
        this.loadUserPreferences();
        setTimeout(() => {
            this.extractContent();
        }, 2000);
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

        // Error settings button
        document.getElementById('errorSettingsBtn').addEventListener('click', () => {
            this.openOptions();
        });

        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openOptions();
        });

        // Github repo button
        document.getElementById('githubBtn').addEventListener('click', () => {
            this.openGitHub();
        });

        // Help button
        document.getElementById('helpBtn').addEventListener('click', () => {
            this.openHelp();
        });

        // Feedback (issues) button
        document.getElementById('feedbackBtn').addEventListener('click', () => {
            this.openFeedback();
        });
    }

    async detectPlatform() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const url = tab.url;
            
            let platform = 'unknown';
            let platformIcon = '🌐';
            let platformName = 'Unknown Platform';

                    // LinkedIn support temporarily disabled
        // if (url.includes('linkedin.com')) {
        //     platform = 'linkedin';
        //     platformIcon = '💼';
        //     platformName = 'LinkedIn';
        // } else 
        if (url.includes('twitter.com') || url.includes('x.com')) {
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

    updatePlatformDisplayFromData(platform) {
        let platformIcon = '🌐';
        let platformName = 'Unknown Platform';

        switch (platform) {
            // LinkedIn support temporarily disabled
            // case 'linkedin':
            //     platformIcon = '💼';
            //     platformName = 'LinkedIn';
            //     break;
            case 'twitter':
                platformIcon = '🐦';
                platformName = 'Twitter/X';
                break;
            case 'reddit':
                platformIcon = '🤖';
                platformName = 'Reddit';
                break;
        }

        this.updatePlatformDisplay(platformIcon, platformName);
    }

    async extractContent() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Send message to content script to extract post content
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'extractContent'
            });

            if (response && response.contentData) {
                if (response.contentData.platform) {
                    this.currentPlatform = response.contentData.platform;
                    this.updatePlatformDisplayFromData(this.currentPlatform);
                }
                if (response.contentData.content) {
                    this.currentContent = response.contentData.content;
                    this.currentMetadata = response.contentData.metadata;
                    this.displayContent();
                    this.enableGenerateButton();
                } else {
                    this.showError('No post content found on this page. Please navigate to a specific post and try again.');
                }
            } else {
                this.showError('No post content found. Please make sure you are on a social media post page.');
            }
        } catch (error) {
            // Check if it's a connection error (content script not available)
            if (error.message && (error.message.includes('Could not establish connection') || 
                                 error.message.includes('Receiving end does not exist'))) {
                this.handleUnsupportedPlatform();
            } else {
                this.showError('Unable to extract post content. Please refresh the page and try again.');
            }
        }
    }

    handleUnsupportedPlatform() {
        this.updatePlatformDisplayFromData('unsupported');
        this.disableGenerateButton();
        this.currentContent = '';
        this.currentMetadata = null;
        this.hideContent();
    }

    disableGenerateButton() {
        const generateBtn = document.getElementById('generateBtn');
        generateBtn.disabled = true;
        generateBtn.style.opacity = '0.5';
        generateBtn.style.cursor = 'not-allowed';
        generateBtn.title = 'TapReply only works on Twitter/X and Reddit. Please navigate to a supported platform.';
    }

    enableGenerateButton() {
        const generateBtn = document.getElementById('generateBtn');
        generateBtn.disabled = false;
        generateBtn.style.opacity = '1';
        generateBtn.style.cursor = 'pointer';
        generateBtn.title = '';
    }

    hideContent() {
        const contentSection = document.getElementById('contentSection');
        if (contentSection) {
            contentSection.style.display = 'none';
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
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn.disabled) {
            return;
        }

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
                    metadata: this.currentMetadata,
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
        
        // Show settings button if it's an API key configuration error
        const errorSettingsBtn = document.getElementById('errorSettingsBtn');
        if (message.includes('API key not configured') || message.includes('API key')) {
            errorSettingsBtn.style.display = 'flex';
        } else {
            errorSettingsBtn.style.display = 'none';
        }
    }

    hideError() {
        document.getElementById('errorSection').style.display = 'none';
    }

    hideReply() {
        document.getElementById('replySection').style.display = 'none';
    }

    openOptions() {
        chrome.runtime.openOptionsPage();
    }

    openGitHub() {
        chrome.tabs.create({ url: 'https://github.com/thewillft/tapreply' });
    }

    openHelp() {
        chrome.tabs.create({ url: 'https://github.com/thewillft/tapreply#readme' });
    }

    openFeedback() {
        chrome.tabs.create({ url: 'https://github.com/thewillft/tapreply/issues' });
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TapReplyPopup();
}); 