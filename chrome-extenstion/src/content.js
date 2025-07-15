// Content script for AI Prompt Enhancer

class AIPromptEnhancer {
  constructor() {
    this.isInitialized = false;
    this.currentTextarea = null;
    this.suggestionPanel = null;
    this.userAuth = null;
    this.subscriptionStatus = null;
    this.platform = this.detectPlatform();
    this.suggestions = [];
    this.debounceTimer = null;

    this.init();
  }

  async init() {
    if (this.isInitialized) return;

    // Wait for page to load
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setup());
    } else {
      this.setup();
    }
  }

  async setup() {
    try {
      // Get authentication status
      this.userAuth = await this.sendMessage({ action: "getStoredAuth" });

      if (this.userAuth.authToken) {
        // Check subscription status
        this.subscriptionStatus = await this.sendMessage({
          action: "checkSubscription",
          userId: this.userAuth.userId,
        });
      }

      // Find and monitor text areas
      this.findAndMonitorTextareas();

      // Create suggestion panel
      this.createSuggestionPanel();

      this.isInitialized = true;
      console.log("AI Prompt Enhancer initialized");
    } catch (error) {
      console.error("Setup error:", error);
    }
  }

  detectPlatform() {
    const hostname = window.location.hostname;
    if (hostname.includes("openai.com")) return "chatgpt";
    if (hostname.includes("google.com")) return "gemini";
    if (hostname.includes("claude.ai")) return "claude";
    return "unknown";
  }

  findAndMonitorTextareas() {
    const selectors = this.getTextareaSelectors();

    // Use MutationObserver to watch for dynamically added textareas
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.checkForTextareas(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Check existing textareas
    this.checkForTextareas(document);
  }

  getTextareaSelectors() {
    const selectors = {
      chatgpt: [
        'textarea[placeholder*="message"]',
        'textarea[data-id="root"]',
        "#prompt-textarea",
      ],
      gemini: [
        'textarea[placeholder*="Enter a prompt"]',
        ".ql-editor",
        "textarea",
      ],
      claude: [
        'textarea[placeholder*="Talk to Claude"]',
        ".ProseMirror",
        "textarea",
      ],
      unknown: ["textarea", '[contenteditable="true"]'],
    };

    return selectors[this.platform] || selectors.unknown;
  }

  checkForTextareas(container) {
    const selectors = this.getTextareaSelectors();

    selectors.forEach((selector) => {
      const elements = container.querySelectorAll
        ? container.querySelectorAll(selector)
        : [container].filter((el) => el.matches && el.matches(selector));

      elements.forEach((element) => {
        if (!element.dataset.aiEnhancerAttached) {
          this.attachToTextarea(element);
        }
      });
    });
  }

  attachToTextarea(textarea) {
    textarea.dataset.aiEnhancerAttached = "true";

    // Add event listeners
    textarea.addEventListener("focus", () => this.onTextareaFocus(textarea));
    textarea.addEventListener("blur", () => this.onTextareaBlur(textarea));
    textarea.addEventListener("input", () => this.onTextareaInput(textarea));
    textarea.addEventListener("keyup", () => this.onTextareaInput(textarea));

    // Add enhancement icon
    this.addEnhancementIcon(textarea);
  }

  addEnhancementIcon(textarea) {
    const icon = document.createElement("div");
    icon.className = "ai-enhancer-icon";
    icon.innerHTML = "✨";
    icon.title = "AI Prompt Enhancer";

    icon.addEventListener("click", () => {
      this.showSuggestionPanel(textarea);
    });

    // Position icon relative to textarea
    const rect = textarea.getBoundingClientRect();
    icon.style.position = "absolute";
    icon.style.top = `${rect.top + window.scrollY - 5}px`;
    icon.style.right = `${window.innerWidth - rect.right + 5}px`;
    icon.style.zIndex = "10000";

    document.body.appendChild(icon);

    // Update position on scroll/resize
    const updatePosition = () => {
      const newRect = textarea.getBoundingClientRect();
      icon.style.top = `${newRect.top + window.scrollY - 5}px`;
      icon.style.right = `${window.innerWidth - newRect.right + 5}px`;
    };

    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);
  }

  onTextareaFocus(textarea) {
    this.currentTextarea = textarea;
    if (this.userAuth.authToken) {
      this.showSuggestionPanel(textarea);
    } else {
      this.showAuthPrompt(textarea);
    }
  }

  onTextareaBlur(textarea) {
    // Delay hiding to allow clicking on suggestions
    setTimeout(() => {
      if (this.suggestionPanel && !this.suggestionPanel.matches(":hover")) {
        this.hideSuggestionPanel();
      }
    }, 200);
  }

  onTextareaInput(textarea) {
    if (!this.userAuth.authToken) return;

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.analyzeText(textarea);
    }, 500);
  }

  async analyzeText(textarea) {
    const text = textarea.value || textarea.textContent || "";
    if (text.length < 10) return; // Don't analyze very short text

    try {
      const result = await this.sendMessage({
        action: "analyzeSuggestions",
        text: text,
        platform: this.platform,
      });

      this.suggestions = result.suggestions || [];
      this.updateSuggestionPanel();
    } catch (error) {
      console.error("Text analysis error:", error);
    }
  }

  createSuggestionPanel() {
    this.suggestionPanel = document.createElement("div");
    this.suggestionPanel.className = "ai-enhancer-panel";
    this.suggestionPanel.style.display = "none";
    document.body.appendChild(this.suggestionPanel);
  }

  showSuggestionPanel(textarea) {
    if (!this.suggestionPanel) return;

    const rect = textarea.getBoundingClientRect();
    this.suggestionPanel.style.position = "absolute";
    this.suggestionPanel.style.top = `${rect.bottom + window.scrollY + 5}px`;
    this.suggestionPanel.style.left = `${rect.left + window.scrollX}px`;
    this.suggestionPanel.style.width = `${Math.max(300, rect.width)}px`;
    this.suggestionPanel.style.display = "block";
    this.suggestionPanel.style.zIndex = "10001";

    this.updateSuggestionPanel();
  }

  hideSuggestionPanel() {
    if (this.suggestionPanel) {
      this.suggestionPanel.style.display = "none";
    }
  }

  updateSuggestionPanel() {
    if (!this.suggestionPanel) return;

    let content = "";

    if (!this.userAuth.authToken) {
      content = `
        <div class="auth-prompt">
          <h3>🔐 Sign in to enhance your prompts</h3>
          <p>Get intelligent suggestions to improve your AI prompts</p>
          <button class="auth-button" onclick="window.aiEnhancer.openAuthPopup()">Sign In</button>
        </div>
      `;
    } else if (!this.subscriptionStatus?.hasSubscription) {
      content = `
        <div class="subscription-prompt">
          <h3>⭐ Upgrade for Premium Suggestions</h3>
          <p>Get advanced AI prompt enhancements</p>
          <button class="upgrade-button" onclick="window.aiEnhancer.openUpgradePopup()">Upgrade Now</button>
        </div>
      `;
    } else if (this.suggestions.length === 0) {
      content = `
        <div class="no-suggestions">
          <p>✨ Start typing to get suggestions...</p>
        </div>
      `;
    } else {
      content = `
        <div class="suggestions-header">
          <h3>💡 Suggestions</h3>
        </div>
        <div class="suggestions-list">
          ${this.suggestions
            .map(
              (suggestion) => `
            <div class="suggestion-item ${suggestion.type}" onclick="window.aiEnhancer.applySuggestion('${suggestion.id}')">
              <div class="suggestion-type">${this.getSuggestionIcon(suggestion.type)}</div>
              <div class="suggestion-content">
                <div class="suggestion-title">${suggestion.title}</div>
                <div class="suggestion-description">${suggestion.description}</div>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
        <div class="suggestions-footer">
          <button class="apply-all-button" onclick="window.aiEnhancer.applyAllSuggestions()">Apply All</button>
        </div>
      `;
    }

    this.suggestionPanel.innerHTML = content;
  }

  getSuggestionIcon(type) {
    const icons = {
      clarity: "🔍",
      specificity: "🎯",
      tone: "🎭",
      structure: "📝",
      enhancement: "✨",
    };
    return icons[type] || "💡";
  }

  applySuggestion(suggestionId) {
    const suggestion = this.suggestions.find((s) => s.id === suggestionId);
    if (!suggestion || !this.currentTextarea) return;

    // Apply the suggestion to the textarea
    const currentText =
      this.currentTextarea.value || this.currentTextarea.textContent || "";
    const enhancedText = this.applyTextEnhancement(currentText, suggestion);

    if (this.currentTextarea.value !== undefined) {
      this.currentTextarea.value = enhancedText;
    } else {
      this.currentTextarea.textContent = enhancedText;
    }

    // Trigger input event
    this.currentTextarea.dispatchEvent(new Event("input", { bubbles: true }));

    // Remove applied suggestion
    this.suggestions = this.suggestions.filter((s) => s.id !== suggestionId);
    this.updateSuggestionPanel();
  }

  applyAllSuggestions() {
    if (!this.currentTextarea || this.suggestions.length === 0) return;

    let currentText =
      this.currentTextarea.value || this.currentTextarea.textContent || "";

    this.suggestions.forEach((suggestion) => {
      currentText = this.applyTextEnhancement(currentText, suggestion);
    });

    if (this.currentTextarea.value !== undefined) {
      this.currentTextarea.value = currentText;
    } else {
      this.currentTextarea.textContent = currentText;
    }

    this.currentTextarea.dispatchEvent(new Event("input", { bubbles: true }));

    this.suggestions = [];
    this.updateSuggestionPanel();
  }

  applyTextEnhancement(text, suggestion) {
    // This is a simplified implementation
    // In a real scenario, you'd have more sophisticated text processing
    switch (suggestion.type) {
      case "clarity":
        return suggestion.replacement || text;
      case "specificity":
        return text + " " + (suggestion.addition || "");
      case "tone":
        return suggestion.replacement || text;
      case "structure":
        return suggestion.replacement || text;
      default:
        return suggestion.replacement || text;
    }
  }

  openAuthPopup() {
    chrome.runtime.sendMessage({ action: "openAuthPopup" });
  }

  openUpgradePopup() {
    window.open(
      "https://sleepy-goldwasser6-evtdm.view-3.tempo-dev.app/pricing",
      "_blank",
    );
  }

  showAuthPrompt(textarea) {
    this.showSuggestionPanel(textarea);
  }

  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Initialize the enhancer
window.aiEnhancer = new AIPromptEnhancer();
