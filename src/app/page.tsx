"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, BookOpen, Zap, Shield, ArrowRight, CheckCircle2 } from "lucide-react";
import { usePublicPrefetch } from "@/lib/hooks/use-public-prefetch";
import { HomeHeader } from "@/components/common/HomeHeader";
import { Footer } from "@/components/common/Footer";

// Features data
const primaryFeatures = [
  {
    title: "AI-Powered Content Filtering",
    description: "Set your keywords and let AI automatically filter and curate content from across the web. Get only the content that matches",
    highlight: "your interests",
    additionalText: "without the noise.",
    icon: Zap,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    stats: [
      { value: "100+", label: "Content sources supported" },
      { value: "Smart", label: "AI-powered matching" },
    ],
    span: 2,
  },
  {
    title: "Multi-Source Import",
    description:
      "Instantly sync content from YouTube, Twitter, Reddit, and RSS feeds. Your personalized newsletter in one place.",
    icon: Users,
    iconBg: "bg-secondary/10",
    iconColor: "text-secondary",
    badges: ["YouTube", "Twitter/X", "Reddit", "RSS"],
    span: 1,
  },
];

const secondaryFeatures = [
  {
    title: "Keyword-Based Filtering",
    description: "Define keywords and topics to automatically filter relevant content from your sources.",
    icon: BookOpen,
    iconColor: "text-primary",
  },
  {
    title: "Automated Delivery",
    description: "Schedule your newsletter delivery and get curated content delivered to your inbox.",
    icon: Zap,
    iconColor: "text-secondary",
  },
  {
    title: "Smart Organization",
    description: "AI organizes and prioritizes content based on relevance and your preferences.",
    icon: Shield,
    iconColor: "text-primary",
  },
];

export default function HomePage() {
  const { prefetchDiscover } = usePublicPrefetch();

  return (
    <main className="min-h-screen bg-background">
      <HomeHeader />

      {/* Hero Section */}
      <section className="relative isolate overflow-hidden pt-20">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />

        {/* Decorative blur */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary/30 to-purple-400/30 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="container mx-auto px-4 py-24 sm:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Launch badge */}
            <Badge className="mb-6" variant="outline">
              <CheckCircle2 className="mr-1.5 h-3 w-3" />
              AI-powered content curation
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              You Choose. We Curate.
              <span className="block mt-2 bg-gradient-to-r text-primary bg-clip-text">Your Custom Newsletter.</span>
            </h1>

            <p className="mt-8 text-lg sm:text-xl leading-8 text-muted-foreground max-w-2xl mx-auto">
              Create your own curated newsletter. Set your keywords, connect your sources,
              and get only the content that matters to you.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register/creator">
                <Button size="lg" className="min-w-[200px] group">
                  Create Your Feed
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/discover" onMouseEnter={prefetchDiscover} onFocus={prefetchDiscover}>
                <Button size="lg" variant="outline" className="min-w-[200px]">
                  Discover Feeds
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Section Separator */}
      <div className="relative py-8">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center">
          <div className="bg-background px-4">
            <Badge variant="secondary">Platform Features</Badge>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-background" />

        <div className="container mx-auto px-4 relative">
          {/* Section Header */}
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Content Curation Made
              <span className="text-primary"> Effortless</span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Stop scrolling through endless feeds. Let AI find and organize the content you care about
              based on your custom keywords and preferences.
            </p>
          </div>

          {/* Primary Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            {primaryFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={idx}
                  className={`p-8 hover:shadow-2xl transition-all duration-300 ${
                    feature.span === 2
                      ? "lg:col-span-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${feature.iconBg}`}>
                      <Icon className={`h-8 w-8 ${feature.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`${feature.span === 2 ? "text-2xl" : "text-xl"} font-bold mb-3`}
                      >
                        {feature.title}
                      </h3>
                      <p
                        className={`text-muted-foreground mb-4 ${feature.span === 2 ? "text-lg" : ""}`}
                      >
                        {feature.description}
                        {feature.highlight && (
                          <span className="font-semibold text-foreground">
                            {" "}
                            {feature.highlight}
                          </span>
                        )}
                        {feature.additionalText && ` ${feature.additionalText}`}
                      </p>

                      {feature.stats && (
                        <div className="grid grid-cols-2 gap-4 mt-6">
                          {feature.stats.map((stat, i) => (
                            <div key={i} className="p-4 bg-background/60 rounded-lg">
                              <div className="text-3xl font-bold text-primary">{stat.value}</div>
                              <div className="text-sm text-muted-foreground">{stat.label}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {feature.badges && (
                        <div className="flex flex-wrap gap-2">
                          {feature.badges.map((badge, i) => (
                            <Badge key={i} variant="outline">
                              {badge}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Secondary Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {secondaryFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={idx}
                  className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                >
                  <Icon
                    className={`h-10 w-10 ${feature.iconColor} mb-4 transition-transform group-hover:scale-110`}
                  />
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gradient Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

        <div className="container mx-auto px-4 text-center relative">
          <Badge className="mb-6" variant="secondary">
            Get Started Today
          </Badge>

          <h2 className="text-3xl sm:text-4xl font-bold mb-6 max-w-2xl mx-auto">
            Ready to Create Your Personalized Newsletter?
          </h2>

          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join users who stay informed with AI-curated content tailored to their interests
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register/creator">
              <Button size="lg" className="min-w-[180px] group">
                Create Your Feed
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/login/creator">
              <Button size="lg" variant="outline" className="min-w-[180px]">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
