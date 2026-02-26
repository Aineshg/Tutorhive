"use client"

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  MessageSquare,
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Search,
} from "lucide-react";
import { usePathname } from "next/navigation";

// --- Utility ---
const cn = (...inputs) => inputs.filter(Boolean).flat().join(" ");

// --- DashboardNav Component ---
export function DashboardNav({ userType: propUserType, userName: propUserName }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const { user, loading } = useUser();
  const { unreadCount: unreadMessageCount } = useUnreadMessages();

  // Handle mounting to prevent hydration errors
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Close profile menu when clicking outside
  React.useEffect(() => {
    if (!profileMenuOpen) return

    const handleClickOutside = (event) => {
      const target = event.target
      const dropdown = document.querySelector('[data-slot="dropdown-menu-content"]')
      const trigger = document.querySelector('[data-slot="dropdown-menu-trigger"]')
      
      if (dropdown && trigger) {
        const isClickInside = dropdown.contains(target) || trigger.contains(target)
        if (!isClickInside) {
          setProfileMenuOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileMenuOpen])

  // Get cached user name from localStorage (client-side only, after mount)
  const [cachedUserName, setCachedUserName] = React.useState('')
  
  React.useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('user-data')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.data?.name) {
            setCachedUserName(parsed.data.name)
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }
  }, [mounted])

  // Update cached name when user data loads
  React.useEffect(() => {
    if (user?.name && user.name !== cachedUserName) {
      setCachedUserName(user.name)
    }
  }, [user?.name])

  const userType = propUserType || (user?.role === 'tutor' ? 'tutor' : 'student');
  const userName = propUserName || user?.name || cachedUserName || '';
  
  // Debug: Log the userName value
  React.useEffect(() => {
    if (mounted) {
      console.log('DashboardNav userName:', { userName, user: user?.name, cachedUserName, propUserName })
    }
  }, [mounted, userName, user?.name, cachedUserName, propUserName])
  
  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-serif font-bold text-primary">
              TutorHive
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      </header>
    )
  }

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const handleLogout = () => {
    // Clear authentication cookies
    document.cookie = "auth-token=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "user-role=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "user-id=; path=/; max-age=0; SameSite=Lax";
    // Clear user data cache
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user-data');
    }
    // Redirect to login
    router.push("/login");
  };

  const navLinks = [
    {
      label: "Dashboard",
      href: userType === "student" ? "/dashboard" : "/dashboard/tutor",
      icon: LayoutDashboard,
    },
    { label: "Sessions", href: "/sessions", icon: Calendar },
    { label: "Connections", href: "/connections", icon: Users },
    { label: "Inbox", href: "/inbox", icon: MessageSquare },
    { label: "Study Plans", href: "/study-plans", icon: FileText },
    ...(userType === "student"
      ? [{ label: "Find Tutors", href: "/tutors/ranking", icon: Search }]
      : []),
  ];

  // Helper function to check if a path is active
  const isActive = (href) => {
    if (href === "/dashboard" || href === "/dashboard/tutor") {
      return pathname === "/dashboard" || pathname === "/dashboard/tutor";
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-serif font-bold text-primary">
              TutorHive
            </h1>
          </Link>

          {/* --- Desktop Nav --- */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isInbox = link.label === "Inbox";
              const Icon = link.icon;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className="relative text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {isInbox ? (
                    <div className="flex items-center gap-2">
                      <span>{link.label}</span>
                      <div className="relative">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                        {unreadMessageCount > 0 && (
                          <span className="absolute -top-2 -right-2 h-4 min-w-4 px-1 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center leading-none z-10 shadow-sm">
                            {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    link.label
                  )}
                </Link>
              );
            })}
          </nav>

          {/* --- Right Side Icons --- */}
          <div className="flex items-center gap-4">
            <NotificationsDropdown />

            {/* --- Profile Dropdown --- */}
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger 
                  asChild
                  onClick={(e) => {
                    e.stopPropagation()
                    setProfileMenuOpen(!profileMenuOpen)
                  }}
                >
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full p-0"
                  >
                    <Avatar className="h-8 w-8">
                      {user?.avatar_url ? (
                        <AvatarImage src={user.avatar_url} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {userName && userName.trim().length > 0 ? userName.trim().charAt(0).toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                {profileMenuOpen && (
                  <DropdownMenuContent 
                    align="end"
                    isOpen={profileMenuOpen}
                    onClose={() => setProfileMenuOpen(false)}
                    className="mt-2"
                  >
                <DropdownMenuItem 
                  onClick={() => {
                    setProfileMenuOpen(false)
                    router.push("/profile")
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setProfileMenuOpen(false)
                    router.push("/settings")
                  }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setProfileMenuOpen(false)
                  handleLogout()
                }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
                  </DropdownMenuContent>
                )}
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* --- Mobile Bottom Navigation --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-50 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            const isInbox = link.label === "Inbox";
            
            return (
              <Link
                key={link.label}
                href={link.href}
                className="relative flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[60px] transition-colors"
              >
                <div className="relative">
                  <Icon
                    className={`h-5 w-5 transition-colors ${
                      active
                        ? "text-primary"
                        : "text-gray-500"
                    }`}
                  />
                  {isInbox && unreadMessageCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center leading-none shadow-sm">
                      {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    active ? "text-primary" : "text-gray-500"
                  }`}
                >
                  {link.label.split(" ")[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Add padding to bottom of page for mobile bottom nav */}
      <style jsx global>{`
        @media (max-width: 768px) {
          body {
            padding-bottom: 4rem;
          }
        }
      `}</style>
    </>
  );
}

// --- Wrapper App ---
export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav
        userType="tutor"
        userName="Dr. Anya Sharma"
      />
      <div className="container mx-auto p-8">
        <h2 className="text-xl font-semibold text-gray-800">
          Tutor Dashboard Content Placeholder
        </h2>
        <p className="text-gray-600 mt-2">
          Welcome back, Dr. Anya Sharma. Ready for your next session?
        </p>
      </div>
    </div>
  );
}
