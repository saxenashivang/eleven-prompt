// Background script for AI Prompt Enhancer

class BackgroundService {
  constructor() {
    this.API_BASE_URL = "http://localhost:3000";
    this.init();
  }

  init() {
    chrome.runtime.onInstalled.addListener(() => {
      console.log("AI Prompt Enhancer installed");
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case "authenticate":
          const authResult = await this.authenticateUser(request.credentials);
          sendResponse(authResult);
          break;
        case "checkSubscription":
          const subscriptionStatus = await this.checkSubscription(
            request.userId,
          );
          sendResponse(subscriptionStatus);
          break;
        case "analyzeSuggestions":
          const suggestions = await this.analyzeSuggestions(
            request.text,
            request.platform,
          );
          sendResponse(suggestions);
          break;
        case "getStoredAuth":
          const storedAuth = await this.getStoredAuth();
          sendResponse(storedAuth);
          break;
        default:
          sendResponse({ error: "Unknown action" });
      }
    } catch (error) {
      console.error("Background script error:", error);
      sendResponse({ error: error.message });
    }
  }

  async authenticateUser(credentials) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const authData = await response.json();
        await chrome.storage.local.set({
          authToken: authData.access_token,
          refreshToken: authData.refresh_token,
          userId: authData.user.id,
          userEmail: authData.user.email,
          expiresAt: authData.expires_at,
          authTimestamp: Date.now(),
        });
        return { success: true, user: authData.user };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || "Authentication failed",
        };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async checkSubscription(userId) {
    try {
      const { authToken } = await chrome.storage.local.get(["authToken"]);

      if (!authToken) {
        return { hasSubscription: false };
      }

      const response = await fetch(
        `${this.API_BASE_URL}/api/subscription/check`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ userId }),
        },
      );

      if (response.ok) {
        const subscriptionData = await response.json();
        return {
          hasSubscription: subscriptionData.hasSubscription,
          plan: subscriptionData.plan,
          active: subscriptionData.active,
        };
      } else {
        console.error("Subscription check failed:", response.status);
        return { hasSubscription: false };
      }
    } catch (error) {
      console.error("Subscription check error:", error);
      return { hasSubscription: false };
    }
  }

  async analyzeSuggestions(text, platform) {
    try {
      const { authToken } = await chrome.storage.local.get(["authToken"]);

      if (!authToken) {
        return { suggestions: [], error: "Authentication required" };
      }

      const response = await fetch(
        `${this.API_BASE_URL}/api/suggestions/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ text, platform }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        return {
          suggestions: data.suggestions || [],
          hasSubscription: data.hasSubscription,
          platform: data.platform,
        };
      } else {
        console.error("Suggestion analysis failed:", response.status);
        return { suggestions: [] };
      }
    } catch (error) {
      console.error("Suggestion analysis error:", error);
      return { suggestions: [] };
    }
  }

  async getStoredAuth() {
    try {
      const result = await chrome.storage.local.get([
        "authToken",
        "refreshToken",
        "userId",
        "userEmail",
        "expiresAt",
        "authTimestamp",
      ]);

      // Check if token is expired
      if (result.expiresAt && Date.now() / 1000 > result.expiresAt) {
        // Token expired, try to refresh or clear storage
        await chrome.storage.local.clear();
        return {};
      }

      return result;
    } catch (error) {
      return {};
    }
  }
}

new BackgroundService();
