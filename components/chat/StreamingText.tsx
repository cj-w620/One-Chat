'use client'

interface StreamingTextProps {
  content: string
  isStreaming?: boolean
}

export function StreamingText({ content, isStreaming = false }: StreamingTextProps) {
  return (
    <span className="inline">
      {content}
      {isStreaming && (
        <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse" />
      )}
    </span>
  )
}
