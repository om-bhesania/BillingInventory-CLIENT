import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  HelpCircle, 
  Search, 
  BookOpen, 
  Video, 
  MessageCircle, 
  Phone, 
  Mail, 
  ChevronRight, 
  ChevronDown,
  Play,
  Download,
  Star,
  Clock,
  Users,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Info,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  tags: string[];
  lastUpdated: Date;
  helpful: number;
  notHelpful: number;
  videoUrl?: string;
  attachments?: { name: string; url: string; type: string }[];
}

interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  articleCount: number;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
  notHelpful: number;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  videoUrl?: string;
}

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  completed: boolean;
}

interface UserHelpSystemProps {
  className?: string;
  showSearch?: boolean;
  showCategories?: boolean;
  showTutorials?: boolean;
  showFAQ?: boolean;
  showContact?: boolean;
}

const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Learn the basics of using the dashboard',
    icon: BookOpen,
    color: 'text-blue-600',
    articleCount: 8
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Understanding your dashboard and metrics',
    icon: BarChart3,
    color: 'text-green-600',
    articleCount: 12
  },
  {
    id: 'real-time',
    name: 'Real-time Features',
    description: 'Live updates and real-time monitoring',
    icon: Wifi,
    color: 'text-purple-600',
    articleCount: 6
  },
  {
    id: 'mobile',
    name: 'Mobile App',
    description: 'Using the dashboard on mobile devices',
    icon: Smartphone,
    color: 'text-orange-600',
    articleCount: 4
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting',
    description: 'Common issues and solutions',
    icon: AlertTriangle,
    color: 'text-red-600',
    articleCount: 10
  },
  {
    id: 'advanced',
    name: 'Advanced Features',
    description: 'Power user tips and advanced functionality',
    icon: Lightbulb,
    color: 'text-yellow-600',
    articleCount: 7
  }
];

const sampleArticles: HelpArticle[] = [
  {
    id: 'dashboard-overview',
    title: 'Dashboard Overview',
    content: `Your dashboard is the central hub for monitoring your business performance. Here's what you'll find:

## Key Metrics
- **Revenue**: Your total sales and income
- **Orders**: Number of transactions processed
- **Customers**: Active customer count
- **Products**: Available product inventory

## Real-time Updates
The dashboard updates automatically with live data. Look for the green "Live" indicator to confirm real-time updates are active.

## Date Range Selection
Use the date picker to view data for specific periods. You can compare with previous periods to track growth.

## Mobile Access
The dashboard is fully responsive and works great on mobile devices. Swipe to navigate between sections.`,
    category: 'dashboard',
    difficulty: 'beginner',
    estimatedTime: 5,
    tags: ['dashboard', 'metrics', 'overview'],
    lastUpdated: new Date('2024-01-15'),
    helpful: 45,
    notHelpful: 2,
    videoUrl: 'https://example.com/dashboard-overview.mp4'
  },
  {
    id: 'real-time-setup',
    title: 'Setting Up Real-time Updates',
    content: `Real-time updates keep your dashboard current with live data. Here's how to set them up:

## Enable Real-time Updates
1. Click the "Settings" button in the top-right corner
2. Toggle "Real-time Updates" to ON
3. Ensure you have a stable internet connection

## Understanding Connection Status
- **Green "Live"**: Real-time updates are active
- **Yellow "Connecting"**: Establishing connection
- **Red "Offline"**: No connection, using cached data

## Troubleshooting Connection Issues
- Check your internet connection
- Refresh the page
- Clear browser cache
- Contact support if issues persist`,
    category: 'real-time',
    difficulty: 'intermediate',
    estimatedTime: 3,
    tags: ['real-time', 'connection', 'setup'],
    lastUpdated: new Date('2024-01-10'),
    helpful: 32,
    notHelpful: 1
  }
];

const sampleFAQs: FAQ[] = [
  {
    id: 'why-no-data',
    question: 'Why is my dashboard showing no data?',
    answer: 'This usually happens when:\n\n1. **Date Range**: Check if your selected date range has data\n2. **Permissions**: Ensure you have access to view the data\n3. **Connection**: Verify your internet connection is stable\n4. **Cache**: Try refreshing the page or clearing browser cache\n\nIf the issue persists, contact support.',
    category: 'troubleshooting',
    helpful: 28,
    notHelpful: 3
  },
  {
    id: 'mobile-issues',
    question: 'The dashboard doesn\'t work well on my phone',
    answer: 'For the best mobile experience:\n\n1. **Use the mobile app** if available\n2. **Update your browser** to the latest version\n3. **Enable JavaScript** in your browser settings\n4. **Check screen orientation** - landscape mode works better\n5. **Clear browser data** if pages load slowly\n\nTry these steps and let us know if you still have issues.',
    category: 'mobile',
    helpful: 19,
    notHelpful: 2
  },
  {
    id: 'real-time-not-working',
    question: 'Real-time updates stopped working',
    answer: 'Real-time updates may stop due to:\n\n1. **Network issues** - Check your internet connection\n2. **Browser limitations** - Some browsers limit WebSocket connections\n3. **Server maintenance** - Updates may be temporarily unavailable\n4. **Ad blockers** - Disable ad blockers that might block WebSocket connections\n\nTry refreshing the page or reconnecting to real-time updates.',
    category: 'real-time',
    helpful: 24,
    notHelpful: 1
  }
];

const sampleTutorials: Tutorial[] = [
  {
    id: 'first-dashboard',
    title: 'Your First Dashboard',
    description: 'Learn how to navigate and use your dashboard effectively',
    estimatedTime: 10,
    difficulty: 'beginner',
    steps: [
      {
        id: 'step-1',
        title: 'Welcome to Your Dashboard',
        description: 'Get familiar with the main dashboard layout and key sections',
        completed: false
      },
      {
        id: 'step-2',
        title: 'Understanding Metrics',
        description: 'Learn what each metric means and how to interpret the data',
        completed: false
      },
      {
        id: 'step-3',
        title: 'Date Range Selection',
        description: 'How to select different time periods and compare data',
        completed: false
      },
      {
        id: 'step-4',
        title: 'Real-time Updates',
        description: 'Enable and understand real-time data updates',
        completed: false
      }
    ],
    videoUrl: 'https://example.com/first-dashboard.mp4'
  }
];

export const UserHelpSystem: React.FC<UserHelpSystemProps> = ({
  className,
  showSearch = true,
  showCategories = true,
  showTutorials = true,
  showFAQ = true,
  showContact = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Filter articles based on search and category
  const filteredArticles = sampleArticles.filter(article => {
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleArticleClick = (article: HelpArticle) => {
    setSelectedArticle(article);
  };

  const handleFAQClick = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const handleTutorialStart = (tutorial: Tutorial) => {
    setCurrentTutorial(tutorial);
    setCurrentStep(0);
  };

  const handleTutorialNext = () => {
    if (currentTutorial && currentStep < currentTutorial.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleTutorialPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTutorialComplete = () => {
    if (currentTutorial) {
      // Mark tutorial as completed
      console.log(`Tutorial completed: ${currentTutorial.title}`);
      setCurrentTutorial(null);
      setCurrentStep(0);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderArticleCard = (article: HelpArticle) => {
    const category = helpCategories.find(cat => cat.id === article.category);
    const CategoryIcon = category?.icon || BookOpen;

    return (
      <Card 
        key={article.id} 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleArticleClick(article)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <CategoryIcon className={cn("h-4 w-4", category?.color)} />
              <CardTitle className="text-sm">{article.title}</CardTitle>
            </div>
            <Badge variant="outline" className={cn("text-xs", getDifficultyColor(article.difficulty))}>
              {article.difficulty}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            {category?.name} • {article.estimatedTime} min read
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {article.estimatedTime} min
              </span>
              <span className="flex items-center">
                <Star className="h-3 w-3 mr-1" />
                {article.helpful} helpful
              </span>
            </div>
            {article.videoUrl && (
              <div className="flex items-center text-blue-600">
                <Play className="h-3 w-3 mr-1" />
                Video
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderFAQItem = (faq: FAQ) => {
    const isExpanded = expandedFAQ === faq.id;
    
    return (
      <Card key={faq.id} className="mb-2">
        <CardHeader 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => handleFAQClick(faq.id)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{faq.question}</CardTitle>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="text-sm text-muted-foreground whitespace-pre-line">
              {faq.answer}
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>Was this helpful?</span>
                <Button size="sm" variant="outline" className="h-6 px-2">
                  👍 {faq.helpful}
                </Button>
                <Button size="sm" variant="outline" className="h-6 px-2">
                  👎 {faq.notHelpful}
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Help & Support</h2>
          <p className="text-muted-foreground">
            Find answers, tutorials, and get help with your dashboard
          </p>
        </div>
        <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <HelpCircle className="h-4 w-4 mr-2" />
              Quick Help
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Quick Help</DialogTitle>
              <DialogDescription>
                Get instant help with common questions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Tip:</strong> Use the search bar to quickly find what you're looking for.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex flex-col">
                  <BookOpen className="h-6 w-6 mb-2" />
                  <span>Documentation</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <Video className="h-6 w-6 mb-2" />
                  <span>Video Tutorials</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <MessageCircle className="h-6 w-6 mb-2" />
                  <span>Live Chat</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <Phone className="h-6 w-6 mb-2" />
                  <span>Call Support</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search help articles, FAQs, and tutorials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="articles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          {showFAQ && <TabsTrigger value="faq">FAQ</TabsTrigger>}
          {showTutorials && <TabsTrigger value="tutorials">Tutorials</TabsTrigger>}
          {showContact && <TabsTrigger value="contact">Contact</TabsTrigger>}
        </TabsList>

        <TabsContent value="articles" className="space-y-4">
          {/* Categories */}
          {showCategories && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All Categories
              </Button>
              {helpCategories.map((category) => {
                const CategoryIcon = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex items-center space-x-2"
                  >
                    <CategoryIcon className={cn("h-4 w-4", category.color)} />
                    <span>{category.name}</span>
                    <Badge variant="secondary" className="ml-1">
                      {category.articleCount}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          )}

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArticles.map(renderArticleCard)}
          </div>
        </TabsContent>

        {showFAQ && (
          <TabsContent value="faq" className="space-y-4">
            <div className="space-y-2">
              {sampleFAQs.map(renderFAQItem)}
            </div>
          </TabsContent>
        )}

        {showTutorials && (
          <TabsContent value="tutorials" className="space-y-4">
            {currentTutorial ? (
              <Card>
                <CardHeader>
                  <CardTitle>{currentTutorial.title}</CardTitle>
                  <CardDescription>{currentTutorial.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Step {currentStep + 1} of {currentTutorial.steps.length}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTutorialPrevious}
                        disabled={currentStep === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        onClick={currentStep === currentTutorial.steps.length - 1 ? handleTutorialComplete : handleTutorialNext}
                      >
                        {currentStep === currentTutorial.steps.length - 1 ? 'Complete' : 'Next'}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">{currentTutorial.steps[currentStep].title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {currentTutorial.steps[currentStep].description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sampleTutorials.map((tutorial) => (
                  <Card key={tutorial.id} className="cursor-pointer hover:shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Play className="h-4 w-4" />
                        <span>{tutorial.title}</span>
                      </CardTitle>
                      <CardDescription>{tutorial.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {tutorial.estimatedTime} min
                          </span>
                          <Badge variant="outline" className={cn("text-xs", getDifficultyColor(tutorial.difficulty))}>
                            {tutorial.difficulty}
                          </Badge>
                        </div>
                        <Button size="sm" onClick={() => handleTutorialStart(tutorial)}>
                          Start Tutorial
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {showContact && (
          <TabsContent value="contact" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>Live Chat</span>
                  </CardTitle>
                  <CardDescription>
                    Get instant help from our support team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    Start Chat
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Available 24/7 • Average response time: 2 minutes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Phone className="h-5 w-5" />
                    <span>Phone Support</span>
                  </CardTitle>
                  <CardDescription>
                    Speak directly with our support team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Call Now
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Mon-Fri 9AM-6PM EST • 1-800-DASHBOARD
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>Email Support</span>
                  </CardTitle>
                  <CardDescription>
                    Send us a detailed message
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Send Email
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    support@dashboard.com • Response within 24 hours
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ExternalLink className="h-5 w-5" />
                    <span>Community Forum</span>
                  </CardTitle>
                  <CardDescription>
                    Connect with other users and experts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Visit Forum
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    community.dashboard.com • 1,000+ active users
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedArticle.title}</DialogTitle>
              <DialogDescription>
                {helpCategories.find(cat => cat.id === selectedArticle.category)?.name} • 
                {selectedArticle.estimatedTime} min read
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none">
                {selectedArticle.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-2">
                    {paragraph}
                  </p>
                ))}
              </div>
              {selectedArticle.videoUrl && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Video Tutorial</h4>
                  <Button variant="outline" className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Watch Video
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>Was this helpful?</span>
                  <Button size="sm" variant="outline">
                    👍 {selectedArticle.helpful}
                  </Button>
                  <Button size="sm" variant="outline">
                    👎 {selectedArticle.notHelpful}
                  </Button>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
