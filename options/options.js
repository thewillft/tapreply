// Options page functionality for TapReply Chrome Extension
class TapReplyOptions {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSettings();
        this.updateApiSectionVisibility();
    }

    bindEvents() {
        // API provider change
        document.getElementById('apiProvider').addEventListener('change', () => {
            this.updateApiSectionVisibility();
        });

        // Test API connection
        document.getElementById('testApiBtn').addEventListener('click', () => {
            this.testApiConnection();
        });

        // Save settings
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveSettings();
        });

        // Reset to defaults
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetToDefaults();
        });

        // Form validation
        document.getElementById('openaiKey').addEventListener('input', () => {
            this.validateApiKey('openai');
        });

        document.getElementById('geminiKey').addEventListener('input', () => {
            this.validateApiKey('gemini');
        });
    }

    updateApiSectionVisibility() {
        const provider = document.getElementById('apiProvider').value;
        const openaiSection = document.getElementById('openaiSection');
        const geminiSection = document.getElementById('geminiSection');

        if (provider === 'openai') {
            openaiSection.style.display = 'block';
            geminiSection.style.display = 'none';
        } else {
            openaiSection.style.display = 'none';
            geminiSection.style.display = 'block';
        }
    }

    async loadSettings() {
        try {
            const settings = await chrome.storage.local.get([
                'apiKey',
                'apiProvider',
                'preferredTone',
                'replyLength',
                'autoDetectPlatform',
                'userKnowledge'
            ]);

            // Set form values
            document.getElementById('apiProvider').value = settings.apiProvider || 'openai';
            
            if (settings.apiProvider === 'gemini') {
                document.getElementById('geminiKey').value = settings.apiKey || '';
            } else {
                document.getElementById('openaiKey').value = settings.apiKey || '';
            }

            document.getElementById('defaultTone').value = settings.preferredTone || 'supportive';
            
            // Set radio button for reply length
            const replyLength = settings.replyLength || 'medium';
            document.querySelector(`input[name="replyLength"][value="${replyLength}"]`).checked = true;
            
            document.getElementById('autoDetectPlatform').checked = settings.autoDetectPlatform !== false;

            // Set knowledge base
            document.getElementById('userKnowledge').value = settings.userKnowledge || '';

        } catch (error) {
            console.error('Error loading settings:', error);
            this.showStatus('Error loading settings', 'error');
        }
    }

    async saveSettings() {
        try {
            const provider = document.getElementById('apiProvider').value;
            const apiKey = provider === 'openai' 
                ? document.getElementById('openaiKey').value.trim()
                : document.getElementById('geminiKey').value.trim();

            const settings = {
                apiProvider: provider,
                apiKey: apiKey,
                preferredTone: document.getElementById('defaultTone').value,
                replyLength: document.querySelector('input[name="replyLength"]:checked').value,
                autoDetectPlatform: document.getElementById('autoDetectPlatform').checked,
                userKnowledge: document.getElementById('userKnowledge').value.trim()
            };

            // Validate API key
            if (!apiKey) {
                this.showStatus('Please enter your API key', 'error');
                return;
            }

            // Save to storage
            await chrome.storage.local.set(settings);
            
            this.showStatus('Settings saved successfully!', 'success');
            
            // Update background script if needed
            chrome.runtime.sendMessage({ action: 'settingsUpdated', settings });

        } catch (error) {
            console.error('Error saving settings:', error);
            this.showStatus('Error saving settings', 'error');
        }
    }

    async testApiConnection() {
        const testBtn = document.getElementById('testApiBtn');
        const provider = document.getElementById('apiProvider').value;
        const apiKey = provider === 'openai' 
            ? document.getElementById('openaiKey').value.trim()
            : document.getElementById('geminiKey').value.trim();

        if (!apiKey) {
            this.showStatus('Please enter your API key first', 'error');
            return;
        }

        // Show testing state
        testBtn.classList.add('testing');
        testBtn.disabled = true;
        testBtn.innerHTML = '<span class="btn-icon">⏳</span>Testing...';

        try {
            // Send test request to background script
            const response = await chrome.runtime.sendMessage({
                action: 'testApiConnection',
                data: { provider, apiKey }
            });

            if (response.success) {
                testBtn.classList.remove('testing');
                testBtn.classList.add('success');
                testBtn.innerHTML = '<span class="btn-icon">✅</span>Connection Successful!';
            } else {
                testBtn.classList.remove('testing');
                testBtn.classList.add('error');
                testBtn.innerHTML = '<span class="btn-icon">❌</span>Connection Failed';
            }

            // Reset button after 3 seconds
            setTimeout(() => {
                testBtn.classList.remove('error', 'success');
                testBtn.disabled = false;
                testBtn.innerHTML = '<span class="btn-icon">🔍</span>Test Connection';
            }, 3000);

        } catch (error) {
            console.error('Error testing API:', error);
            // Show error state
            testBtn.classList.remove('loading', 'testing');
            testBtn.classList.add('error');
            testBtn.innerHTML = '<span class="btn-icon">❌</span>Connection Failed';
            
            // Reset button after 3 seconds
            setTimeout(() => {
                testBtn.classList.remove('error');
                testBtn.disabled = false;
                testBtn.innerHTML = '<span class="btn-icon">🔍</span>Test Connection';
            }, 3000);
        }
    }

    async resetToDefaults() {
        if (!confirm('Are you sure you want to reset all settings to defaults?')) {
            return;
        }

        try {
            const defaultSettings = {
                apiKey: '',
                apiProvider: 'openai',
                preferredTone: 'supportive',
                replyLength: 'medium',
                autoDetectPlatform: true,
                userKnowledge: ''
            };

            await chrome.storage.local.set(defaultSettings);
            
            // Reload form
            await this.loadSettings();
            
            this.showStatus('Settings reset to defaults', 'success');

        } catch (error) {
            console.error('Error resetting settings:', error);
            this.showStatus('Error resetting settings', 'error');
        }
    }

    validateApiKey(provider) {
        const keyInput = document.getElementById(`${provider}Key`);
        const key = keyInput.value.trim();
        
        let isValid = false;
        let message = '';

        if (provider === 'openai') {
            isValid = key.startsWith('sk-') && key.length > 20;
            message = isValid ? '' : 'OpenAI API keys start with "sk-" and are longer than 20 characters';
        } else if (provider === 'gemini') {
            isValid = key.startsWith('AIza') && key.length > 30;
            message = isValid ? '' : 'Gemini API keys start with "AIza" and are longer than 30 characters';
        }

        // Update input styling
        if (key && !isValid) {
            keyInput.style.borderColor = '#DC2626';
            keyInput.style.backgroundColor = '#FEF2F2';
        } else {
            keyInput.style.borderColor = '';
            keyInput.style.backgroundColor = '';
        }

        // Show/hide validation message
        let helpElement = keyInput.parentNode.querySelector('.validation-message');
        if (!helpElement && message) {
            helpElement = document.createElement('p');
            helpElement.className = 'validation-message form-help';
            helpElement.style.color = '#DC2626';
            keyInput.parentNode.appendChild(helpElement);
        }
        
        if (helpElement) {
            helpElement.textContent = message;
            helpElement.style.display = message ? 'block' : 'none';
        }
    }

    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('statusMessage');
        statusElement.textContent = message;
        statusElement.className = `status-message ${type}`;
        statusElement.style.display = 'block';

        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 3000);
        }
    }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TapReplyOptions();
}); 