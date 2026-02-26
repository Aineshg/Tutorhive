import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile"
const MAX_MEMORY_ITEMS = 50
const MEMORY_FETCH_LIMIT = 20

export async function GET() {
  try {
    const cookieStore = cookies()
    const userId = cookieStore.get("user-id")?.value || null

    if (!userId) {
      return NextResponse.json({
        success: true,
        messages: [],
      })
    }

    const aiChatMemoryClient = prisma?.aIChatMemory ?? prisma?.aiChatMemory

    if (!aiChatMemoryClient) {
      console.error("AIChatMemory Prisma model is unavailable. Have you run `prisma generate` after updating the schema?")
      return NextResponse.json({
        success: true,
        messages: [],
      })
    }

    const storedMemories = await aiChatMemoryClient.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "asc" },
      take: MAX_MEMORY_ITEMS,
    })

    return NextResponse.json({
      success: true,
      messages: storedMemories.map((memory) => ({
        id: memory.id,
        role: memory.role,
        content: memory.content,
        createdAt: memory.created_at ? memory.created_at.toISOString() : null,
        metadata: memory.metadata ?? null,
      })),
    })
  } catch (error) {
    console.error("Groq chat history error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve AI chat memories",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ai/chat
 * Proxy chat completion requests to Groq API
 * Expected body: { messages: Array<{ type: "user" | "ai" | "system", content: string }>, prompt?: string }
 */
export async function POST(request) {
  try {
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "GROQ_API_KEY is not configured on the server",
        },
        { status: 500 }
      )
    }

    const body = await request.json().catch(() => null)

    if (!body || !Array.isArray(body.messages)) {
      return NextResponse.json(
        {
          success: false,
          message: "Request body must include a messages array",
        },
        { status: 400 }
      )
    }

    const systemPrompt =
      typeof body.systemPrompt === "string" && body.systemPrompt.trim().length > 0
        ? body.systemPrompt.trim()
        : "You are an AI study assistant helping students with tutoring questions. Keep responses concise, supportive, and actionable."

    const cookieStore = cookies()
    const userId = cookieStore.get("user-id")?.value || null

    let memorySystemMessages = []

    if (userId) {
      const aiChatMemoryClient = prisma?.aIChatMemory ?? prisma?.aiChatMemory

      if (!aiChatMemoryClient) {
        console.error("AIChatMemory Prisma model is unavailable. Skipping memory context injection.")
      } else {
        try {
          const storedMemories = await aiChatMemoryClient.findMany({
            where: { user_id: userId },
            orderBy: { created_at: "desc" },
            take: MEMORY_FETCH_LIMIT,
          })

          if (storedMemories.length > 0) {
            const orderedMemories = storedMemories.slice().reverse()
            const memoryContent = orderedMemories
              .map((memory) => `${memory.role === "assistant" ? "Assistant" : "User"}: ${memory.content}`)
              .join("\n")

            memorySystemMessages = [
              {
                role: "system",
                content: `Persistent notes from previous tutoring assistant conversations with this user. Use them only when relevant.\n${memoryContent}`,
              },
            ]
          }
        } catch (memoryError) {
          console.error("AI chat memory retrieval error:", memoryError)
        }
      }
    }

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...memorySystemMessages,
      ...body.messages
        .filter((message) => Boolean(message?.content))
        .map((message) => ({
          role: message.type === "ai" ? "assistant" : message.type === "system" ? "system" : "user",
          content: message.content,
        })),
    ]

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: body.model || DEFAULT_GROQ_MODEL,
        temperature: typeof body.temperature === "number" ? body.temperature : 0.7,
        max_tokens: typeof body.maxTokens === "number" ? body.maxTokens : 1024,
        messages: formattedMessages,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}))
      return NextResponse.json(
        {
          success: false,
          message: "Groq API request failed",
          details: errorPayload?.error?.message,
        },
        { status: response.status }
      )
    }

    const result = await response.json()
    const aiMessage = result?.choices?.[0]?.message?.content?.trim()

    if (!aiMessage) {
      return NextResponse.json(
        {
          success: false,
          message: "Groq API returned an empty response",
        },
        { status: 502 }
      )
    }

    if (userId) {
      const aiChatMemoryClient = prisma?.aIChatMemory ?? prisma?.aiChatMemory

      if (!aiChatMemoryClient) {
        console.error("AIChatMemory Prisma model is unavailable. Skipping memory persistence.")
      } else {
        const lastUserMessage = [...body.messages]
          .reverse()
          .find((message) => message?.type === "user" && typeof message?.content === "string" && message.content.trim().length > 0)

        const messagesToPersist = []

        if (lastUserMessage) {
          messagesToPersist.push({
            user_id: userId,
            role: "user",
            content: lastUserMessage.content.trim(),
          })
        }

        messagesToPersist.push({
          user_id: userId,
          role: "assistant",
          content: aiMessage,
        })

        try {
          if (messagesToPersist.length > 0) {
            await aiChatMemoryClient.createMany({ data: messagesToPersist })

            const staleMemories = await aiChatMemoryClient.findMany({
              where: { user_id: userId },
              orderBy: { created_at: "desc" },
              skip: MAX_MEMORY_ITEMS,
              select: { id: true },
            })

            if (staleMemories.length > 0) {
              await aiChatMemoryClient.deleteMany({
                where: { id: { in: staleMemories.map((memory) => memory.id) } },
              })
            }
          }
        } catch (memoryPersistError) {
          console.error("AI chat memory persistence error:", memoryPersistError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: {
        role: "assistant",
        content: aiMessage,
      },
      usage: result?.usage,
      model: result?.model,
    })
  } catch (error) {
    console.error("Groq chat route error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}


export async function DELETE() {
  try {
    const cookieStore = cookies()
    const userId = cookieStore.get("user-id")?.value || null

    if (!userId) {
      return NextResponse.json({
        success: true,
        cleared: false,
        message: "No authenticated user found; nothing to clear",
      })
    }

    const aiChatMemoryClient = prisma?.aIChatMemory ?? prisma?.aiChatMemory

    if (!aiChatMemoryClient) {
      console.error("AIChatMemory Prisma model is unavailable. Nothing was cleared.")
      return NextResponse.json({
        success: false,
        cleared: false,
        message: "AIChatMemory model unavailable",
      })
    }

    await aiChatMemoryClient.deleteMany({
      where: { user_id: userId },
    })

    return NextResponse.json({
      success: true,
      cleared: true,
    })
  } catch (error) {
    console.error("Groq chat memory delete error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to clear AI chat memories",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}


