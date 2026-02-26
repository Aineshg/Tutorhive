"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Brain, RotateCcw, Send, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const generateId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

const createInitialMessage = () => ({
  id: generateId(),
  type: "ai",
  content: "Hi! I'm here to help with your studies. What can I assist you with?",
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
})

export function AIChatWidget() {

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState(() => [createInitialMessage()])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false)
  const scrollAnchorRef = useRef(null)
  const inputRef = useRef(null)
  useEffect(() => {
    if (!scrollAnchorRef.current) return

    scrollAnchorRef.current.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!isOpen) return
    if (isLoading || isHistoryLoading || isResetting) return

    inputRef.current?.focus()
  }, [isOpen, isLoading, isHistoryLoading, isResetting, messages])

  useEffect(() => {
    if (!isOpen || hasLoadedHistory) return

    let isActive = true

    const fetchHistory = async () => {
      setIsHistoryLoading(true)

      try {
        const response = await fetch("/api/ai/chat", { cache: "no-store" })

        if (!response.ok) {
          throw new Error("Failed to load AI chat history")
        }

        const data = await response.json()
        const history = Array.isArray(data?.messages) ? data.messages : []

        if (!isActive) return

        if (history.length > 0) {
          const formattedHistory = history.map((entry) => {
            const createdAt = entry.createdAt || entry.created_at
            const timestamp = createdAt
              ? new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

            return {
              id: entry.id || generateId(),
              type: entry.role === "assistant" ? "ai" : "user",
              content: entry.content ?? "",
              timestamp,
            }
          })

          setMessages(formattedHistory)
        } else {
          setMessages([createInitialMessage()])
        }
      } catch (error) {
        console.error("AI chat history load error:", error)
        if (isActive) {
          setMessages([createInitialMessage()])
        }
      } finally {
        if (isActive) {
          setIsHistoryLoading(false)
          setHasLoadedHistory(true)
        }
      }
    }

    fetchHistory()

    return () => {
      isActive = false
    }
  }, [hasLoadedHistory, isOpen])

  // AI GENERATED: Message handling logic
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || isResetting || isHistoryLoading) return

    const userContent = inputValue.trim()
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    const newMessage = {
      id: generateId(),
      type: "user",
      content: userContent,
      timestamp,
    }

    const conversationHistory = [
      ...messages
        .filter((message) => !message?.isPending && typeof message?.content === "string" && message.content.trim().length > 0)
        .map(({ type, content }) => ({
          type: type === "ai" ? "ai" : type === "system" ? "system" : "user",
          content,
        })),
      { type: "user", content: userContent },
    ]

    const pendingMessageId = generateId()
    const pendingTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

    setMessages((prev) => [...prev, newMessage, { id: pendingMessageId, type: "ai", content: "Thinking...", timestamp: pendingTimestamp, isPending: true }])
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationHistory,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to connect to AI service")
      }

      const data = await response.json()
      const aiContent = data?.message?.content?.trim()

      if (!aiContent) {
        throw new Error("AI response was empty")
      }

      const aiTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

      setMessages((prev) =>
        prev.map((message) =>
          message.id === pendingMessageId
            ? { ...message, content: aiContent, timestamp: aiTimestamp, isPending: false }
            : message
        )
      )
    } catch (error) {
      console.error("AI chat error:", error)
      const fallbackMessage = "I'm having trouble responding right now. Please try again later."
      setMessages((prev) =>
        prev.map((message) =>
          message.id === pendingMessageId
            ? { ...message, content: fallbackMessage, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), isPending: false, isError: true }
            : message
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetConversation = async () => {
    if (isLoading || isResetting || isHistoryLoading) return

    setIsResetting(true)
    setMessages([createInitialMessage()])
    setInputValue("")
    setHasLoadedHistory(true)

    try {
      const response = await fetch("/api/ai/chat", { method: "DELETE" })

      if (!response.ok) {
        throw new Error("Failed to clear AI chat memories")
      }
    } catch (error) {
      console.error("AI chat reset error:", error)
    } finally {
      setIsResetting(false)
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed right-6 z-50 bottom-[calc(1.5rem+4rem)] md:bottom-6">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-shadow"
        >
          <Brain className="h-6 w-6" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed right-6 z-50 bottom-[calc(1.5rem+4rem)] md:bottom-6">
      <Card className="w-80 h-96 shadow-xl max-w-[calc(100vw-3rem)] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">AI Study Assistant</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleResetConversation} disabled={isLoading || isResetting || isHistoryLoading}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col h-80 overflow-hidden">
          <ScrollArea className="flex-1 pr-2 overflow-y-auto">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.type === "ai" && (
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary/10">
                        <Brain className="h-3 w-3 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[80%] p-2 rounded-lg text-xs ${
                      message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    } ${message.isError ? "border border-destructive" : ""}`}
                  >
                    <p
                      className={`${
                        message.isPending
                          ? "italic text-muted-foreground"
                          : message.isError
                            ? "text-destructive"
                            : ""
                      } whitespace-pre-wrap break-words`}
                    >
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={scrollAnchorRef} />
            </div>
          </ScrollArea>
          <div className="flex gap-2 mt-3">
            <Input
              ref={inputRef}
              placeholder="Ask me anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              className="text-xs"
              disabled={isLoading || isHistoryLoading || isResetting}
            />
            <Button size="sm" onClick={handleSendMessage} disabled={isLoading || isHistoryLoading || isResetting}>
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
