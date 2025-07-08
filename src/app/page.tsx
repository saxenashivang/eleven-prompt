import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import PricingCard from "@/components/pricing-card";
import {
  ArrowUpRight,
  Brain,
  Palette,
  Target,
  Sparkles,
  MessageSquare,
  History,
  Chrome,
} from "lucide-react";
import { createClient } from "../../supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: plans, error } = await supabase.functions.invoke(
    "supabase-functions-get-plans",
  );

  const result = plans?.items;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Powerful AI Prompt Enhancement
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Transform your AI interactions with intelligent suggestions,
              real-time analysis, and seamless integration across all major AI
              platforms.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Brain className="w-6 h-6" />,
                title: "Real-time Analysis",
                description:
                  "Get instant feedback on clarity, specificity, and tone as you type",
                color: "text-purple-600",
              },
              {
                icon: <Palette className="w-6 h-6" />,
                title: "Color-coded Suggestions",
                description:
                  "Visual highlighting system for different types of improvements",
                color: "text-blue-600",
              },
              {
                icon: <Target className="w-6 h-6" />,
                title: "Platform Optimization",
                description:
                  "Tailored suggestions for ChatGPT, Claude, Gemini, and more",
                color: "text-green-600",
              },
              {
                icon: <Sparkles className="w-6 h-6" />,
                title: "One-click Enhancement",
                description:
                  "Apply all suggested improvements instantly with a single click",
                color: "text-yellow-600",
              },
              {
                icon: <History className="w-6 h-6" />,
                title: "Prompt History",
                description:
                  "Access and reuse your previous successful prompts",
                color: "text-indigo-600",
              },
              {
                icon: <MessageSquare className="w-6 h-6" />,
                title: "Template Library",
                description:
                  "Save and organize your best prompts for future use",
                color: "text-pink-600",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className={`${feature.color} mb-4`}>{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-purple-100 max-w-2xl mx-auto">
              Simple, seamless integration with your favorite AI platforms
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Chrome className="w-12 h-12 mx-auto mb-4 text-purple-200" />
              <h3 className="text-xl font-semibold mb-2">Install Extension</h3>
              <p className="text-purple-100">
                Add our Chrome extension with one click from the Chrome Web
                Store
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Brain className="w-12 h-12 mx-auto mb-4 text-blue-200" />
              <h3 className="text-xl font-semibold mb-2">Start Typing</h3>
              <p className="text-blue-100">
                Begin writing your prompt and watch real-time suggestions appear
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-200" />
              <h3 className="text-xl font-semibold mb-2">Get Better Results</h3>
              <p className="text-purple-100">
                Apply enhancements and enjoy more effective AI conversations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Start free and upgrade as you need more advanced features.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {result?.map((item: any) => (
              <PricingCard key={item.id} item={item} user={user} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Enhance Your AI Prompts?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already getting better results from
            their AI conversations.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-8 py-4 text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
          >
            Install Chrome Extension
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
