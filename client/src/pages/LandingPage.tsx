import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, Zap, Shield, BarChart3, QrCode, Sparkles, ArrowRight, Check } from "lucide-react";
import { Link } from "wouter";
import { Header } from "@/components/Header";

export default function LandingPage() {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Create short URLs in milliseconds with our optimized infrastructure"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Password protection, link expiration, and malicious URL detection"
    },
    {
      icon: BarChart3,
      title: "Deep Analytics",
      description: "Track clicks, devices, locations, and referrers in real-time"
    },
    {
      icon: QrCode,
      title: "Custom QR Codes",
      description: "Generate branded QR codes with logos and custom colors"
    }
  ];

  const stats = [
    { value: "1M+", label: "Links Created" },
    { value: "50M+", label: "Clicks Tracked" },
    { value: "99.9%", label: "Uptime" },
    { value: "<50ms", label: "Avg Redirect" }
  ];

  const pricingTiers = [
    {
      name: "Free",
      price: "£0",
      period: "/month",
      description: "Perfect for personal projects",
      features: [
        "50 links per month",
        "Basic analytics",
        "sfs.link domain",
        "QR code generation"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Pro",
      price: "£15",
      period: "/month",
      description: "For growing businesses",
      features: [
        "1,000 links per month",
        "Advanced analytics",
        "Custom branding",
        "API access (500 req/day)",
        "Link health monitoring",
        "Priority support"
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "£79",
      period: "/month",
      description: "For serious scale",
      features: [
        "Unlimited links",
        "Custom domain",
        "White-label option",
        "Unlimited API access",
        "Team collaboration",
        "Dedicated support",
        "99.9% SLA",
        "Webhooks & integrations"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen">
      <Header showActions={false} />
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-block">
              <span className="glass-panel px-4 py-2 text-sm font-medium text-gold inline-flex items-center gap-2 rounded-full">
                <Sparkles className="h-4 w-4" />
                The most beautiful URL shortener
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-gradient-gold">Premium</span> URL Shortening
              <br />
              With Golden Circuits
            </h1>

            <p className="text-xl md:text-2xl text-muted mb-8 leading-relaxed">
              Create stunning short links with real-time analytics, custom QR codes,
              and enterprise-grade features. All wrapped in a luxurious interface.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/dashboard">
                <Button size="lg" className="btn-primary text-lg px-8 py-6 group">
                  Start Creating Links
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="btn-outline text-lg px-8 py-6">
                View Demo
              </Button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 glass-card border-gold p-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-gradient-gold mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-marble">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient-gold">Powerful Features</span>
            </h2>
            <p className="text-xl text-muted max-w-2xl mx-auto">
              Everything you need to manage, track, and optimize your links
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="glass-card border-gold hover-elevate text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center gold-glow">
                    <feature.icon className="h-8 w-8 text-gold" />
                  </div>
                  <CardTitle className="text-xl text-gold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple. <span className="text-gradient-gold">Powerful.</span> Beautiful.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="glass-card border-gold p-8 mb-4 mx-auto w-20 h-20 flex items-center justify-center rounded-full">
                <span className="text-3xl font-bold text-gradient-gold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gold">Paste Your URL</h3>
              <p className="text-muted">Enter any long URL you want to shorten</p>
            </div>

            <div className="text-center">
              <div className="glass-card border-gold p-8 mb-4 mx-auto w-20 h-20 flex items-center justify-center rounded-full gold-glow">
                <span className="text-3xl font-bold text-gradient-gold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gold">Customize</h3>
              <p className="text-muted">Add custom slug, QR code, and settings</p>
            </div>

            <div className="text-center">
              <div className="glass-card border-gold p-8 mb-4 mx-auto w-20 h-20 flex items-center justify-center rounded-full">
                <span className="text-3xl font-bold text-gradient-gold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gold">Share & Track</h3>
              <p className="text-muted">Share your link and watch analytics roll in</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-marble">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Choose Your <span className="text-gradient-gold">Premium Plan</span>
            </h2>
            <p className="text-xl text-muted max-w-2xl mx-auto">
              Start free, upgrade when you need more power
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <Card
                key={index}
                className={`glass-card border-gold hover-elevate relative ${
                  tier.popular ? 'ring-2 ring-gold shadow-gold-lg' : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gold text-black px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl text-gold mb-2">{tier.name}</CardTitle>
                  <div className="mb-2">
                    <span className="text-5xl font-bold text-gradient-gold">{tier.price}</span>
                    <span className="text-muted">{tier.period}</span>
                  </div>
                  <CardDescription className="text-muted">
                    {tier.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={tier.popular ? "btn-primary w-full" : "btn-outline w-full"}
                    size="lg"
                  >
                    {tier.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <Card className="glass-card border-gold p-12 text-center max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Create Your First
              <br />
              <span className="text-gradient-gold">Premium Link?</span>
            </h2>
            <p className="text-xl text-muted mb-8 max-w-2xl mx-auto">
              Join thousands of businesses using SFS Link to manage their URLs beautifully
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="btn-primary text-lg px-12 py-6 gold-glow">
                Get Started Free
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gold/30">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gold rounded-md flex items-center justify-center">
                <Link2 className="h-5 w-5 text-black" />
              </div>
              <span className="text-xl font-bold text-gradient-gold">SFS Link</span>
            </div>

            <div className="text-sm text-muted">
              © 2025 SmartFlow Systems. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
