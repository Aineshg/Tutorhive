import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  Calendar,
  Brain,
  Star,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { DashboardNav } from "@/components/dashboard-nav";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b border-border bg-white/70 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-serif font-bold text-primary">
                TutorHive
              </h1>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Find Tutors
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-6">
            AI-Powered Learning Platform
          </Badge>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-balance mb-6">
            Personalized Learning with Expert{" "}
            <span className="text-primary">Tutors</span>
          </h1>
          <p className="text-xl text-muted-foreground text-pretty mb-8 max-w-2xl mx-auto">
            Connect with qualified tutors, schedule personalized sessions, and track your progress with AI-enhanced study plans tailored to your learning goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/register">
                Start Learning Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 bg-transparent">
              <Link href="/tutors/ranking">Browse Tutors</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-card/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold mb-4">
              Why Choose TutorHive?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our platform combines expert tutoring with cutting-edge AI to create the most effective learning experience.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="font-serif">Expert Tutors</CardTitle>
                <CardDescription>
                  Connect with qualified tutors who specialize in your subject area and learning style.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Calendar className="h-12 w-12 text-secondary mb-4" />
                <CardTitle className="font-serif">Flexible Scheduling</CardTitle>
                <CardDescription>
                  Book sessions that fit your schedule with our intuitive calendar system.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Brain className="h-12 w-12 text-accent mb-4" />
                <CardTitle className="font-serif">AI-Enhanced Learning</CardTitle>
                <CardDescription>
                  Get personalized study recommendations and progress tracking powered by AI.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Assistant Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-serif font-bold mb-6">
                Realtime Q&A AI Chatbot
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Get instant answers to your questions with our advanced AI chatbot that provides real-time query resolution and automatically summarizes your learning sessions for better retention.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                  <span>Instant answers to academic questions 24/7</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                  <span>Real-time query resolution during study sessions</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                  <span>Automatic session summaries and key takeaways</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                  <span>Smart learning insights and recommendations</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Card className="text-center p-6">
                <div className="text-3xl font-bold text-primary mb-2">500+</div>
                <div className="text-muted-foreground">Expert Tutors</div>
              </Card>
              <Card className="text-center p-6">
                <div className="text-3xl font-bold text-secondary mb-2">10k+</div>
                <div className="text-muted-foreground">Students Helped</div>
              </Card>
              <Card className="text-center p-6">
                <div className="text-3xl font-bold text-accent mb-2">95%</div>
                <div className="text-muted-foreground">Success Rate</div>
              </Card>
              <Card className="text-center p-6">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                  <span className="text-3xl font-bold">4.9</span>
                </div>
                <div className="text-muted-foreground">Average Rating</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="text-lg font-serif font-bold text-primary">TutorHive</span>
              </div>
              <p className="text-muted-foreground">
                Connecting students with expert tutors for personalized learning experiences.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <div className="space-y-2 text-muted-foreground">
                <div><Link href="/tutors/ranking" className="hover:text-foreground transition-colors">Find Tutors</Link></div>
                <div><Link href="/subjects" className="hover:text-foreground transition-colors">Subjects</Link></div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <div className="space-y-2 text-muted-foreground">
                <div><Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></div>
                <div><Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link></div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <div className="space-y-2 text-muted-foreground">
                <div><Link href="/about" className="hover:text-foreground transition-colors">About</Link></div>
                <div><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></div>
              </div>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>© 2025 TutorHive. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
