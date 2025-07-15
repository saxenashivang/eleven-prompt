// Popup script for AI Prompt Enhancer

class PopupManager {
  constructor() {
    this.API_BASE_URL = "https://eleven-prompt.vercel.app";
    this.init();
  }

  async init() {
    this.bindEvents();
    await this.checkAuthStatus();
    this.loadStats();
  }

  bindEvents() {
    // Auth form events
    document.getElementById("show-auth-form").addEventListener("click", () => {
      this.showAuthForm();
    });

    document.getElementById("sign-in-btn").addEventListener("click", () => {
      this.handleSignIn();
    });

    document.getElementById("open-website").addEventListener("click", () => {
      chrome.tabs.create({ url: `${this.API_BASE_URL}/sign-up` });
    });

    document.getElementById("sign-out-btn").addEventListener("click", () => {
      this.handleSignOut();
    });

    // Link events
    document.getElementById("help-link").addEventListener("click", (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: `${this.API_BASE_URL}/help` });
    });

    document.getElementById("privacy-link").addEventListener("click", (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: `${this.API_BASE_URL}/privacy` });
    });

    // Form submission
    document.getElementById("auth-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSignIn();
    });

    // Enter key handling
    document.getElementById("password").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.handleSignIn();
      }
    });
  }

  async checkAuthStatus() {
    try {
      const authData = await chrome.storage.local.get([
        "authToken",
        "userId",
        "userEmail",
      ]);

      if (authData.authToken && authData.userId) {
        // Check if token is still valid
        const isValid = await this.validateToken(authData.authToken);

        if (isValid) {
          this.showDashboard(authData);
          await this.checkSubscriptionStatus(authData.userId);
        } else {
          // Token expired, clear storage
          await chrome.storage.local.clear();
          this.showAuthSection();
        }
      } else {
        this.showAuthSection();
      }
    } catch (error) {
      console.error("Auth check error:", error);
      this.showAuthSection();
    }
  }

  async validateToken(token) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/auth/validate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  showAuthSection() {
    document.getElementById("auth-section").style.display = "block";
    document.getElementById("dashboard-section").style.display = "none";
  }

  showDashboard(authData) {
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("dashboard-section").style.display = "block";

    // Update user info
    const userInfo = document.getElementById("user-info");
    userInfo.textContent = `Signed in as ${authData.userEmail}`;
  }

  showAuthForm() {
    document.getElementById("auth-form").style.display = "block";
    document.getElementById("show-auth-form").style.display = "none";
    document.getElementById("open-website").style.display = "none";
    document.getElementById("email").focus();
  }

  async handleSignIn() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      this.showError("Please enter both email and password");
      return;
    }

    this.setLoading(true);
    this.clearMessages();

    try {
      // Send authentication request to background script
      const response = await this.sendMessage({
        action: "authenticate",
        credentials: { email, password },
      });

      if (response.success) {
        this.showSuccess("Successfully signed in!");
        setTimeout(() => {
          this.checkAuthStatus();
        }, 1000);
      } else {
        this.showError(response.error || "Authentication failed");
      }
    } catch (error) {
      this.showError("Connection error. Please try again.");
    } finally {
      this.setLoading(false);
    }
  }

  async handleSignOut() {
    try {
      await chrome.storage.local.clear();
      this.showAuthSection();

      // Reset form
      document.getElementById("email").value = "";
      document.getElementById("password").value = "";
      document.getElementById("auth-form").style.display = "none";
      document.getElementById("show-auth-form").style.display = "block";
      document.getElementById("open-website").style.display = "block";

      this.clearMessages();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }

  async checkSubscriptionStatus(userId) {
    try {
      const response = await this.sendMessage({
        action: "checkSubscription",
        userId: userId,
      });

      this.updateSubscriptionUI(response);
    } catch (error) {
      console.error("Subscription check error:", error);
    }
  }

  updateSubscriptionUI(subscriptionData) {
    const icon = document.getElementById("subscription-icon");
    const text = document.getElementById("subscription-text");
    const description = document.getElementById("subscription-description");

    if (subscriptionData.hasSubscription) {
      icon.textContent = "👑";
      text.textContent = "Premium Plan";
      description.textContent =
        "Enjoy unlimited AI prompt enhancements and advanced suggestions.";
    } else {
      icon.textContent = "⭐";
      text.textContent = "Free Plan";
      description.textContent =
        "Upgrade to Premium for advanced suggestions and unlimited usage.";

      // Add upgrade button
      const upgradeBtn = document.createElement("button");
      upgradeBtn.className = "btn btn-primary";
      upgradeBtn.textContent = "Upgrade Now";
      upgradeBtn.style.marginTop = "8px";
      upgradeBtn.addEventListener("click", () => {
        chrome.tabs.create({ url: `${this.API_BASE_URL}/pricing` });
      });

      const subscriptionCard = document.getElementById("subscription-status");
      if (!subscriptionCard.querySelector(".btn")) {
        subscriptionCard.appendChild(upgradeBtn);
      }
    }
  }

  async loadStats() {
    try {
      const stats = await chrome.storage.local.get([
        "suggestionsCount",
        "enhancementsCount",
      ]);

      document.getElementById("suggestions-count").textContent =
        stats.suggestionsCount || 0;
      document.getElementById("enhancements-count").textContent =
        stats.enhancementsCount || 0;
    } catch (error) {
      console.error("Stats loading error:", error);
    }
  }

  setLoading(loading) {
    const btn = document.getElementById("sign-in-btn");
    const text = document.getElementById("sign-in-text");
    const loadingSpinner = document.getElementById("sign-in-loading");

    if (loading) {
      btn.disabled = true;
      text.style.display = "none";
      loadingSpinner.style.display = "inline-block";
    } else {
      btn.disabled = false;
      text.style.display = "inline";
      loadingSpinner.style.display = "none";
    }
  }

  showError(message) {
    const errorDiv = document.getElementById("error-message");
    errorDiv.innerHTML = `<div class="error">${message}</div>`;
  }

  showSuccess(message) {
    const successDiv = document.getElementById("success-message");
    successDiv.innerHTML = `<div class="success">${message}</div>`;
  }

  clearMessages() {
    document.getElementById("error-message").innerHTML = "";
    document.getElementById("success-message").innerHTML = "";
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

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PopupManager();
});
