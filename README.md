# TutorHive - AI-Powered Tutoring Platform

A modern, responsive tutoring platform that connects students with expert tutors through an AI-enhanced learning experience. Built with Next.js 14, React 18, Tailwind CSS, and developed with AI assistance using GPT-5 model.

## Project Overview

TutorHive is a comprehensive tutoring platform designed to facilitate personalized learning experiences between students and qualified tutors. The platform leverages AI technology to provide intelligent study recommendations, progress tracking, and enhanced learning outcomes.

## Project deploy at : https://tutor-hive.vercel.app/

## Team Members

- **Gunturu, Ainesh** (1002248191) - Team Lead
- **Garikipati, Jahnavi** (1002200930) - Frontend + AI Researcher
- **Jawahar, Narain Sarathy** (1002223825) - Documentation + Tester
- **Katakam, Amruth Bhargav** (1002237703) - UX Designer
- **Khanapure, Sakshi Omprakash** (1002175905) - Scrum Reporter + Backend

## UTA Cloud Deployment:

    URL - https://axg8191.uta.cloud/
    Credentials - 
        student login
        email :- student@example.com
        password:- student123
        tutor login
        email:- tutor@example.com
        password:- tutor123

## Github Repo 
https://github.com/Jahnavi-Git-Hub/TutorHive

## Key Features

### For Students
- **Expert Tutor Matching**: Connect with qualified tutors specializing in various subjects
- **Flexible Scheduling**: Book sessions that fit your schedule with an intuitive calendar system
- **AI Study Assistant**: Get personalized study recommendations and progress tracking
- **Study Plans**: Create and follow AI-generated study plans tailored to your learning goals
- **Session Management**: Track upcoming and past tutoring sessions
- **Progress Tracking**: Monitor your learning progress with detailed analytics
- **Task Management**: Create and manage study tasks and assignments

### For Tutors
- **Tutor Registration**: Easy onboarding process with subject specialization
- **Student Management**: View and manage your students and sessions
- **Session Scheduling**: Set your availability and manage bookings
- **Performance Analytics**: Track your teaching performance and student outcomes
- **Profile Management**: Maintain your professional profile and credentials

### Platform Features
- **AI-Enhanced Learning**: Intelligent recommendations and personalized content
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- **Dark/Light Mode**: User preference-based theme switching
- **Real-time Chat**: Integrated communication system for students and tutors
- **Secure Authentication**: Role-based access control for students and tutors
- **Modern UI/UX**: Clean, intuitive interface built with modern design principles

## Technology Stack

### Frontend
- **React 18** - UI library
- **Tailwind CSS 4.1.9** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Recharts** - Data visualization
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **GPT-5 Model** - AI-assisted code generation and optimization

### Styling & Design
- **Custom CSS Variables** - Theme system with light/dark mode support
- **Fonts**: Source Sans 3 (primary), Playfair Display (headings), Geist Mono (code)
- **Color Palette**: 
  - Primary: Dark teal (#164e63)
  - Secondary: Indigo (#6366f1)
  - Accent: Orange (#d97706)
  - Background: White/Dark variants
  - Destructive: Red (#ef4444)

### Development Tools
- **TypeScript** - Type safety
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing
- **GPT-5 Model** - AI-assisted development and code optimization

### AI-Assisted Development Areas
- **Project Scaffolding**: AI-generated project structure and configuration
- **Component Generation**: AI-assisted creation of 50+ reusable UI components
- **Styling Implementation**: AI-powered Tailwind CSS class generation and responsive design
- **Testing Framework**: AI-generated test cases and component testing strategies
- **Code Optimization**: AI-assisted performance optimization and best practices implementation


## Project Structure

```
tutoring-platform/
├── app/                         
│   ├── ai-assistant/            # AI study assistant (AI-assisted)
│   │   └── page.jsx             # AI chat interface and tools
│   ├── connections/             # Student-tutor connections
│   ├── dashboard/               # Main dashboard (student & tutor) (AI-assisted)
│   │   ├── page.jsx             # Student dashboard with stats and quick actions
│   │   └── tutor/               # Tutor-specific dashboard
│   ├── login/                   # Authentication pages (AI-assisted)
│   │   └── page.jsx             # Login form with role selection
│   ├── register/                # User registration (AI-assisted)
│   │   └── page.jsx             # Registration form with validation
│   ├── sessions/                # Session management (AI-assisted)
│   │   ├── book/               # Session booking
│   │   ├── calendar/           # Calendar view
│   │   ├── [id]/               # Individual session pages
│   │   └── page.jsx             # Sessions overview and management
│   ├── study-plans/            # Study plan management (AI-assisted)
│   │   ├── create/             # Create study plans
│   │   ├── [id]/               # Individual study plans
│   │   └── page.jsx             # Study plans overview
│   ├── tasks/                  # Task management (AI-assisted)
│   │   ├── create/             # Task creation
│   │   └── page.jsx             # Task management interface
│   ├── tutors/                 # Tutor discovery and ranking
│   ├── tutor-registration/     # Tutor onboarding (AI-assisted)
│   │   └── page.jsx             # Tutor registration form
│   ├── profile/                # User profiles
│   ├── settings/               # User settings
│   ├── inbox/                  # Messaging system
│   ├── globals.css             # Global styles and theme (AI-assisted design system)
│   ├── layout.jsx              # Root layout (AI-assisted)
│   └── page.jsx                # Landing page (AI-assisted)
├── components/                  # Reusable UI components
│   ├── ui/                     # Base UI components (Radix UI) (AI-assisted)
│   │   ├── button.jsx          # Button component with variants
│   │   ├── card.jsx            # Card component with sections
│   │   ├── input.jsx           # Input component with validation
│   │   ├── form.jsx            # Form component with React Hook Form
│   │   ├── select.jsx          # Select dropdown component
│   │   ├── calendar.jsx        # Calendar component for scheduling
│   │   └── ...                 # 50+ other UI components
│   ├── ai-chat-widget.jsx      # AI chat interface (AI-assisted)
│   ├── ai-recommendations.jsx  # AI study recommendations (AI-assisted)
│   ├── dashboard-nav.jsx       # Navigation component (AI-assisted)
│   └── task-item.jsx           # Task display component
├── hooks/                      # Custom React hooks
├── lib/                        # Utility functions
├── public/                     # Static assets
├── styles/                     # Additional stylesheets
├── next.config.mjs             # Next.js configuration (AI-assisted)
├── package.json                # Dependencies and scripts (AI-assisted)
└── README.md                   # Project documentation
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm package manager

### Installation


1. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

2. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

3. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm run start
```

## Available Pages & Routes

### Public Pages
- `/` - Landing page with features and hero section
- `/login` - User authentication (Student/Tutor)
- `/register` - User registration
- `/forgot-password` - Password recovery

### Student Dashboard
- `/dashboard` - Main student dashboard
- `/sessions` - View all sessions
- `/sessions/book` - Book new sessions
- `/sessions/calendar` - Calendar view
- `/sessions/[id]` - Individual session details
- `/study-plans` - View study plans
- `/study-plans/create` - Create new study plan
- `/study-plans/[id]` - Individual study plan
- `/tasks` - Task management
- `/tasks/create` - Create new task
- `/tutors/ranking` - Browse and find tutors
- `/ai-assistant` - AI study assistant
- `/profile` - User profile
- `/settings` - Account settings
- `/inbox` - Messaging system
- `/connections` - Student-tutor connections

### Tutor Dashboard
- `/dashboard/tutor` - Tutor-specific dashboard
- `/tutor-registration` - Tutor onboarding process

## Design System

### Typography
- **Primary Font**: Source Sans 3 (sans-serif)
- **Heading Font**: Playfair Display (serif)
- **Code Font**: Geist Mono (monospace)

### Color Scheme
- **Primary**: Dark teal (#164e63) - Main brand color
- **Secondary**: Indigo (#6366f1) - Accent color
- **Accent**: Orange (#d97706) - Highlight color
- **Background**: White (#ffffff) / Dark (#252525)
- **Foreground**: Slate gray (#475569) / White
- **Destructive**: Red (#ef4444) - Error states

### Components
Built with Radix UI primitives for accessibility and consistency:

#### Core Re-usable React UI Components (`@/components/ui/`)
- **Button** - Multiple variants (default, destructive, outline, secondary, ghost, link)
- **Card** - Container with header, content, and footer sections
- **Input** - Form input with validation states and focus styles
- **Label** - Accessible form labels
- **Textarea** - Multi-line text input
- **Select** - Dropdown selection with search and grouping
- **Checkbox** - Custom checkbox with indeterminate state
- **Radio Group** - Radio button groups with keyboard navigation
- **Switch** - Toggle switch component
- **Slider** - Range input slider
- **Progress** - Progress bar with animated states
- **Badge** - Status indicators and labels
- **Avatar** - User profile images with fallbacks
- **Separator** - Visual dividers (horizontal/vertical)

#### Layout & Navigation
- **Sidebar** - Collapsible navigation sidebar
- **Navigation Menu** - Multi-level navigation with dropdowns
- **Breadcrumb** - Navigation breadcrumbs
- **Tabs** - Tabbed content organization
- **Accordion** - Collapsible content sections
- **Collapsible** - Simple collapsible content
- **Menubar** - Horizontal menu bar
- **Command** - Command palette with search
- **Scroll Area** - Custom scrollable areas

#### Overlays & Modals
- **Dialog** - Modal dialogs with backdrop
- **Alert Dialog** - Confirmation and alert modals
- **Sheet** - Slide-out panels (bottom, left, right, top)
- **Drawer** - Mobile-friendly slide-out drawer
- **Popover** - Floating content containers
- **Tooltip** - Contextual information tooltips
- **Hover Card** - Rich hover content cards
- **Context Menu** - Right-click context menus
- **Dropdown Menu** - Dropdown menus with icons and separators

#### Data Display
- **Table** - Data tables with sorting and selection
- **Chart** - Data visualization components (Recharts integration)
- **Calendar** - Date picker and calendar views
- **Carousel** - Image/content carousels
- **Aspect Ratio** - Maintain aspect ratios for media
- **Skeleton** - Loading state placeholders

#### Forms & Input
- **Form** - React Hook Form integration with validation
- **Input OTP** - One-time password input
- **Toggle** - Toggle buttons and groups
- **Toggle Group** - Grouped toggle buttons

#### Feedback & Notifications
- **Alert** - Alert messages with variants
- **Toast** - Toast notifications with actions
- **Toaster** - Toast container and management
- **Sonner** - Advanced toast notifications

#### Utilities
- **Resizable** - Resizable panels and containers
- **Pagination** - Page navigation controls
- **Use Mobile** - Mobile detection hook
- **Use Toast** - Toast management hook

#### Design Features
- Responsive design with mobile-first approach
- Dark/light mode support with CSS variables
- Accessibility compliance (WCAG 2.1)
- Keyboard navigation support
- Focus management and screen reader support
- Consistent spacing and typography
- Customizable theming system

## Configuration

### Configuration
- **Output**: Static export for deployment
- **Image Optimization**: Disabled for static export
- **TypeScript**: Enabled with build error tolerance
- **ESLint**: Configured with build error tolerance

### Tailwind CSS
- Custom color variables for theming
- Responsive breakpoints
- Custom animations and transitions
- Component-based styling approach

## Features in Detail

### AI Integration
- **Study Recommendations**: AI-powered personalized study suggestions
- **Progress Analysis**: Intelligent tracking of learning progress
- **Chat Assistant**: Real-time AI assistance for students
- **Smart Matching**: Algorithm-based tutor-student matching

### Session Management
- **Calendar Integration**: Visual scheduling interface
- **Booking System**: Easy session booking process
- **Session History**: Complete record of past sessions
- **Real-time Updates**: Live session status updates

### Study Planning
- **Custom Plans**: Create personalized study schedules
- **Goal Setting**: Define and track learning objectives
- **Progress Tracking**: Monitor completion and performance
- **AI Suggestions**: Intelligent plan recommendations

## Deployment

The project is configured for static export and can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

Build command: `npm run build`
Output directory: `out/`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is part of an academic assignment and is not intended for commercial use.
#   T u t o r h i v e  
 # Tutorhive
# Tutorhive
