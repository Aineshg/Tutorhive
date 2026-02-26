import React from "react"
import "./globals.css"
import { ActivityTracker } from "@/components/activity-tracker"
import { AIChatWidget } from "@/components/ai-chat-widget"

export const metadata = {
  title: "TutorHive - Personalized Learning Platform",
  description: "Connect with expert tutors for personalized learning experiences",
  generator: "v0.app",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ActivityTracker />
        {children}
        <AIChatWidget />
      </body>
    </html>
  )
}
