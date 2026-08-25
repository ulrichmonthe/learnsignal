import type { ReactNode } from 'react'

// Minimal markdown renderer for Signal bodies.
//
// Renders to React text nodes — never dangerouslySetInnerHTML. The body is
// model-generated and, once the LinkedIn/publish loop grows, may include quoted
// material from the open web; injecting that as raw HTML would make every
// published issue an XSS vector.
//
// Supports the subset the Signals Writer is instructed to emit: ## / ### headings,
// bullet lists, ordered lists, **bold**, *italic*, and paragraphs.

function renderInline(text: string, key: string): ReactNode[] {
  // Split on bold first, then italic within the remainder.
  return text.split(/(\*\*[^*]+\*\*)/g).flatMap((chunk, i) => {
    if (chunk.startsWith('**') && chunk.endsWith('**')) {
      return [
        <strong key={`${key}-b${i}`} className="ws-strong">
          {chunk.slice(2, -2)}
        </strong>,
      ]
    }
    return chunk.split(/(\*[^*]+\*)/g).map((piece, j) =>
      piece.startsWith('*') && piece.endsWith('*') && piece.length > 2 ? (
        <em key={`${key}-i${i}-${j}`}>{piece.slice(1, -1)}</em>
      ) : (
        <span key={`${key}-t${i}-${j}`}>{piece}</span>
      ),
    )
  })
}

export function Markdown({ source }: { source: string }) {
  const blocks = String(source ?? '')
    .replace(/\r\n/g, '\n')
    .trim()
    .split(/\n{2,}/)

  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split('\n')

        const heading = block.match(/^(#{1,4})\s+([\s\S]+)$/)
        if (heading) {
          const level = heading[1].length
          const Tag = (level <= 2 ? 'h2' : 'h3') as 'h2' | 'h3'
          return (
            <Tag key={bi} className={level <= 2 ? 'ws-h2' : 'ws-h3'}>
              {renderInline(heading[2].trim(), `h${bi}`)}
            </Tag>
          )
        }

        if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
          return (
            <ul key={bi} className="ws-list">
              {lines.map((l, li) => (
                <li key={li}>{renderInline(l.replace(/^\s*[-*]\s+/, ''), `u${bi}-${li}`)}</li>
              ))}
            </ul>
          )
        }

        if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
          return (
            <ol key={bi} className="ws-list ws-list-ol">
              {lines.map((l, li) => (
                <li key={li}>{renderInline(l.replace(/^\s*\d+[.)]\s+/, ''), `o${bi}-${li}`)}</li>
              ))}
            </ol>
          )
        }

        if (/^>\s?/.test(block)) {
          return (
            <blockquote key={bi} className="ws-quote">
              {renderInline(block.replace(/^>\s?/gm, '').replace(/\n/g, ' '), `q${bi}`)}
            </blockquote>
          )
        }

        return (
          <p key={bi} className="ws-p">
            {renderInline(block.replace(/\n/g, ' '), `p${bi}`)}
          </p>
        )
      })}
    </>
  )
}
