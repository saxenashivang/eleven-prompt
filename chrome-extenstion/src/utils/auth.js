// Authentication utilities for Chrome Extension

class AuthManager {
  constructor() {
    this.API_BASE_URL = "http://localhost:3000";
  }

  async authenticate(email, password) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const authData = await response.json();

        // Store authentication data
        await this.storeAuthData({
          user: authData.user,
          session: {
            access_token: authData.access_token,
            refresh_token: authData.refresh_token,
            expires_at: authData.expires_at,
          },
          access_token: authData.access_token,
        });

        return {
          success: true,
          user: authData.user,
          access_token: authData.access_token,
        };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Authentication failed");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async storeAuthData(authData) {
    try {
      await chrome.storage.local.set({
        authToken: authData.access_token,
        refreshToken: authData.session.refresh_token,
        userId: authData.user.id,
        userEmail: authData.user.email,
        expiresAt: authData.session.expires_at,
        sessionData: authData.session,
        authTimestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error storing auth data:", error);
      throw error;
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
        "sessionData",
        "authTimestamp",
      ]);

      // Check if token is expired using expires_at from Supabase
      if (result.expiresAt && Date.now() / 1000 > result.expiresAt) {
        await this.clearAuthData();
        return null;
      }

      return result.authToken ? result : null;
    } catch (error) {
      console.error("Error getting stored auth:", error);
      return null;
    }
  }

  async clearAuthData() {
    try {
      await chrome.storage.local.remove([
        "authToken",
        "refreshToken",
        "userId",
        "userEmail",
        "expiresAt",
        "sessionData",
        "authTimestamp",
      ]);
    } catch (error) {
      console.error("Error clearing auth data:", error);
    }
  }

  async validateToken(token) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/auth/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Token validation error:", error);
      return false;
    }
  }

  async refreshToken() {
    try {
      const storedAuth = await this.getStoredAuth();
      if (!storedAuth || !storedAuth.sessionData) {
        return null;
      }

      const supabaseClient = this.createSupabaseClient();

      const { data, error } = await supabaseClient.auth.refreshSession({
        refresh_token: storedAuth.sessionData.refresh_token,
      });

      if (error || !data.session) {
        await this.clearAuthData();
        return null;
      }

      // Store new session data
      await this.storeAuthData({
        user: data.user,
        session: data.session,
        access_token: data.session.access_token,
      });

      return {
        success: true,
        user: data.user,
        access_token: data.session.access_token,
      };
    } catch (error) {
      console.error("Token refresh error:", error);
      await this.clearAuthData();
      return null;
    }
  }

  createSupabaseClient() {
    // Since we can't import Supabase directly in extension context,
    // we'll use fetch API to interact with Supabase REST API
    return {
      auth: {
        signInWithPassword: async ({ email, password }) => {
          const response = await fetch(
            `${this.SUPABASE_URL}/auth/v1/token?grant_type=password`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: this.SUPABASE_ANON_KEY,
              },
              body: JSON.stringify({ email, password }),
            },
          );

          const data = await response.json();

          if (!response.ok) {
            return { data: null, error: data };
          }

          return {
            data: {
              user: data.user,
              session: data,
            },
            error: null,
          };
        },

        getUser: async (token) => {
          const response = await fetch(`${this.SUPABASE_URL}/auth/v1/user`, {
            headers: {
              Authorization: `Bearer ${token}`,
              apikey: this.SUPABASE_ANON_KEY,
            },
          });

          const data = await response.json();

          if (!response.ok) {
            return { data: { user: null }, error: data };
          }

          return { data: { user: data }, error: null };
        },

        refreshSession: async ({ refresh_token }) => {
          const response = await fetch(
            `${this.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: this.SUPABASE_ANON_KEY,
              },
              body: JSON.stringify({ refresh_token }),
            },
          );

          const data = await response.json();

          if (!response.ok) {
            return { data: { session: null }, error: data };
          }

          return {
            data: {
              session: data,
              user: data.user,
            },
            error: null,
          };
        },
      },
    };
  }

  // OAuth flow for future implementation
  async initiateOAuthFlow() {
    try {
      const authUrl = `${this.SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${chrome.identity.getRedirectURL()}`;

      const responseUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true,
      });

      // Parse the response URL to extract tokens
      const urlParams = new URLSearchParams(responseUrl.split("#")[1]);
      const accessToken = urlParams.get("access_token");
      const refreshToken = urlParams.get("refresh_token");

      if (accessToken) {
        // Store tokens and get user info
        const userResponse = await this.getUserInfo(accessToken);

        if (userResponse.success) {
          await this.storeAuthData({
            user: userResponse.user,
            session: { access_token: accessToken, refresh_token: refreshToken },
            access_token: accessToken,
          });

          return { success: true, user: userResponse.user };
        }
      }

      throw new Error("OAuth flow failed");
    } catch (error) {
      console.error("OAuth error:", error);
      return { success: false, error: error.message };
    }
  }

  async getUserInfo(token) {
    try {
      const response = await fetch(`${this.SUPABASE_URL}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: this.SUPABASE_ANON_KEY,
        },
      });

      if (response.ok) {
        const user = await response.json();
        return { success: true, user };
      }

      throw new Error("Failed to get user info");
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = AuthManager;
} else {
  window.AuthManager = AuthManager;
}
