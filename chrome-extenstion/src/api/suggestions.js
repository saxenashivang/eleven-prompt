// AI Suggestions API

class SuggestionsAPI {
    constructor() {
      this.API_BASE_URL = "http://localhost:3000";
    }
  
    async analyzeSuggestions(text, platform, authToken) {
      try {
        // For demo purposes, we'll generate mock suggestions
        // In production, this would call your AI analysis API
        const suggestions = this.generateMockSuggestions(text, platform);
  
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 500));
  
        return { suggestions };
      } catch (error) {
        console.error("Suggestions API error:", error);
        return { suggestions: [] };
      }
    }
  
    generateMockSuggestions(text, platform) {
      const suggestions = [];
      const textLength = text.length;
      const words = text.split(" ");
  
      // Clarity suggestions
      if (text.includes("thing") || text.includes("stuff")) {
        suggestions.push({
          id: "clarity-1",
          type: "clarity",
          title: "Be more specific",
          description:
            'Replace vague terms like "thing" or "stuff" with specific nouns',
          replacement: text.replace(/\b(thing|stuff)\b/gi, "specific item"),
        });
      }
  
      // Length suggestions
      if (textLength < 20) {
        suggestions.push({
          id: "specificity-1",
          type: "specificity",
          title: "Add more context",
          description:
            "Provide more details to help the AI understand your request better",
          addition: " Please provide a detailed explanation with examples.",
        });
      }
  
      // Platform-specific suggestions
      if (platform === "chatgpt") {
        if (!text.toLowerCase().includes("step by step") && textLength > 50) {
          suggestions.push({
            id: "structure-1",
            type: "structure",
            title: "Request step-by-step format",
            description: "ChatGPT works well with structured requests",
            replacement: text + " Please provide a step-by-step explanation.",
          });
        }
      }
  
      if (platform === "claude") {
        if (!text.toLowerCase().includes("think") && textLength > 30) {
          suggestions.push({
            id: "enhancement-1",
            type: "enhancement",
            title: "Encourage reasoning",
            description: "Claude responds well to prompts that ask for reasoning",
            replacement: "Think carefully about this: " + text,
          });
        }
      }
  
      // Tone suggestions
      if (text.includes("!") || text.toUpperCase() === text) {
        suggestions.push({
          id: "tone-1",
          type: "tone",
          title: "Soften tone",
          description: "A more conversational tone often yields better results",
          replacement: text.replace(/!/g, ".").toLowerCase(),
        });
      }
  
      // Grammar and style
      if (
        words.length > 1 &&
        !text.endsWith(".") &&
        !text.endsWith("?") &&
        !text.endsWith("!")
      ) {
        suggestions.push({
          id: "structure-2",
          type: "structure",
          title: "Add punctuation",
          description:
            "Proper punctuation helps AI understand sentence boundaries",
          replacement: text + ".",
        });
      }
  
      // Advanced suggestions for longer text
      if (textLength > 100) {
        if (
          !text.toLowerCase().includes("format") &&
          !text.toLowerCase().includes("structure")
        ) {
          suggestions.push({
            id: "enhancement-2",
            type: "enhancement",
            title: "Specify output format",
            description: "Requesting a specific format improves response quality",
            addition: " Please format your response as a numbered list.",
          });
        }
      }
  
      return suggestions.slice(0, 5); // Limit to 5 suggestions
    }
  
    // Real API integration methods (for future implementation)
    async callRealAPI(text, platform, authToken) {
      const response = await fetch(
        `${this.API_BASE_URL}/api/suggestions/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            text,
            platform,
            timestamp: Date.now(),
          }),
        },
      );
  
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
  
      return await response.json();
    }
  
    // Platform-specific optimization
    getPlatformOptimizations(platform) {
      const optimizations = {
        chatgpt: {
          preferredStructure: "step-by-step",
          maxLength: 2000,
          suggestedPhrases: [
            "step by step",
            "explain in detail",
            "provide examples",
          ],
        },
        claude: {
          preferredStructure: "reasoning-based",
          maxLength: 3000,
          suggestedPhrases: ["think about", "consider", "analyze"],
        },
        gemini: {
          preferredStructure: "conversational",
          maxLength: 1500,
          suggestedPhrases: ["help me understand", "explain", "show me"],
        },
      };
  
      return optimizations[platform] || optimizations.chatgpt;
    }
  }
  
  // Export for use in other scripts
  if (typeof module !== "undefined" && module.exports) {
    module.exports = SuggestionsAPI;
  } else {
    window.SuggestionsAPI = SuggestionsAPI;
  }
  