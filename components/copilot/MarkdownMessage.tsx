'use client'

import { useMemo } from 'react'

interface MarkdownMessageProps {
  content: string
}

/**
 * Lightweight markdown renderer for Copilot chat messages.
 * Handles: paragraphs, bold, italic, inline code, bullet lists, numbered lists, headers.
 * No external dependencies — keeps bundle small.
 */
export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  const blocks = useMemo(() => parseBlocks(content), [content])

  return (
    <div className="space-y-2.5">
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  )
}

// ── Types ──

type BlockType =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: number; text: string }
  | { type: 'bullet-list'; items: string[] }
  | { type: 'numbered-list'; items: string[] }
  | { type: 'code-block'; code: string }
  | { type: 'hr' }

// ── Parser ──

function parseBlocks(raw: string): BlockType[] {
  const lines = raw.split('\n')
  const blocks: BlockType[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Empty line — skip
    if (line.trim() === '') {
      i++
      continue
    }

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line.trim())) {
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    // Code block
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = []
      i++ // skip opening fence
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing fence
      blocks.push({ type: 'code-block', code: codeLines.join('\n') })
      continue
    }

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/)
    if (headingMatch) {
      blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2] })
      i++
      continue
    }

    // Bullet list
    if (/^[\s]*[-*•]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[\s]*[-*•]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[\s]*[-*•]\s+/, ''))
        i++
      }
      blocks.push({ type: 'bullet-list', items })
      continue
    }

    // Numbered list
    if (/^[\s]*\d+[.)]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[\s]*\d+[.)]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[\s]*\d+[.)]\s+/, ''))
        i++
      }
      blocks.push({ type: 'numbered-list', items })
      continue
    }

    // Paragraph — collect consecutive non-empty, non-special lines
    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !/^[\s]*[-*•]\s/.test(lines[i]) &&
      !/^[\s]*\d+[.)]\s/.test(lines[i]) &&
      !/^[-*_]{3,}\s*$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', text: paraLines.join(' ') })
    }
  }

  return blocks
}

// ── Renderers ──

function Block({ block }: { block: BlockType }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p className="text-sm text-[#e5e7eb] leading-relaxed">
          <InlineMarkdown text={block.text} />
        </p>
      )

    case 'heading':
      if (block.level === 1) {
        return (
          <h3 className="text-sm font-semibold text-white mt-1">
            <InlineMarkdown text={block.text} />
          </h3>
        )
      }
      if (block.level === 2) {
        return (
          <h4 className="text-[13px] font-semibold text-[#d1d5db] mt-1">
            <InlineMarkdown text={block.text} />
          </h4>
        )
      }
      return (
        <h5 className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wide mt-1">
          <InlineMarkdown text={block.text} />
        </h5>
      )

    case 'bullet-list':
      return (
        <ul className="space-y-1.5 pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#e5e7eb] leading-relaxed">
              <span className="text-[#6366f1] mt-1.5 flex-shrink-0 text-[8px]">●</span>
              <span><InlineMarkdown text={item} /></span>
            </li>
          ))}
        </ul>
      )

    case 'numbered-list':
      return (
        <ol className="space-y-1.5 pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#e5e7eb] leading-relaxed">
              <span className="text-[#6366f1] text-xs font-medium mt-0.5 flex-shrink-0 w-4 text-right">
                {i + 1}.
              </span>
              <span><InlineMarkdown text={item} /></span>
            </li>
          ))}
        </ol>
      )

    case 'code-block':
      return (
        <pre className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-[#d1d5db] font-mono overflow-x-auto">
          {block.code}
        </pre>
      )

    case 'hr':
      return <hr className="border-[#2a2a2a] my-1" />
  }
}

/** Render inline markdown: **bold**, *italic*, `code`, [links](url) */
function InlineMarkdown({ text }: { text: string }) {
  const parts = parseInline(text)

  return (
    <>
      {parts.map((part, i) => {
        switch (part.type) {
          case 'bold':
            return <strong key={i} className="font-semibold text-white">{part.text}</strong>
          case 'italic':
            return <em key={i} className="italic text-[#d1d5db]">{part.text}</em>
          case 'code':
            return (
              <code key={i} className="px-1 py-0.5 rounded bg-[#1c1c1c] border border-[#2a2a2a] text-[#d1d5db] text-[12px] font-mono">
                {part.text}
              </code>
            )
          case 'link':
            return (
              <a
                key={i}
                href={part.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#818cf8] hover:text-[#a5b4fc] underline underline-offset-2 transition-colors"
              >
                {part.text}
              </a>
            )
          default:
            return <span key={i}>{part.text}</span>
        }
      })}
    </>
  )
}

type InlinePart =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'code'; text: string }
  | { type: 'link'; text: string; href: string }

function parseInline(text: string): InlinePart[] {
  const parts: InlinePart[] = []
  // Match: **bold**, *italic*, `code`, [text](url)
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // Push preceding text
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: text.slice(lastIndex, match.index) })
    }

    if (match[1]) {
      // **bold**
      parts.push({ type: 'bold', text: match[2] })
    } else if (match[3]) {
      // *italic*
      parts.push({ type: 'italic', text: match[4] })
    } else if (match[5]) {
      // `code`
      parts.push({ type: 'code', text: match[6] })
    } else if (match[7]) {
      // [text](url)
      parts.push({ type: 'link', text: match[8], href: match[9] })
    }

    lastIndex = regex.lastIndex
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push({ type: 'text', text: text.slice(lastIndex) })
  }

  return parts.length > 0 ? parts : [{ type: 'text', text }]
}
