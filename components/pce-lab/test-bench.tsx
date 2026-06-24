'use client'

import { useState } from 'react'
import type { TestTicket, TicketResult, CharacterName } from '@/lib/pce-lab/types'

const CHARACTER_LABELS: Record<CharacterName, string> = {
  jordan: 'Jordan · Head of Customer Support',
  dev: 'Dev · Engineering',
  sara: 'Sara · CEO',
}

const CHARACTER_COLORS: Record<CharacterName, string> = {
  jordan: 'var(--accent)',
  dev: '#60a5fa',
  sara: '#f59e0b',
}

interface Props {
  brief: string
  character: CharacterName
  devNote?: string
  tickets: TestTicket[]
  ticketResults: TicketResult[]
  activeTicketId: string | null
  onSelectTicket: (id: string | null) => void
}

function TicketRow({
  ticket,
  result,
  isActive,
  onClick,
}: {
  ticket: TestTicket
  result: TicketResult | undefined
  isActive: boolean
  onClick: () => void
}) {
  const pass = result?.pass ?? false
  const passingCount = result?.criteriaResults.filter(c => c.pass).length ?? 0
  const totalCount = result?.criteriaResults.length ?? 0

  return (
    <div
      onClick={onClick}
      className="rounded-lg cursor-pointer transition-all"
      style={{
        padding: '12px 14px',
        border: isActive
          ? '0.5px solid rgba(200,240,64,0.4)'
          : '0.5px solid rgba(255,255,255,0.07)',
        background: isActive ? 'rgba(200,240,64,0.04)' : 'rgba(255,255,255,0.01)',
        marginBottom: '6px',
      }}
      onMouseEnter={e => {
        if (!isActive) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.14)'
      }}
      onMouseLeave={e => {
        if (!isActive) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'
      }}
    >
      <div className="flex items-start gap-3">
        {/* Pass/fail indicator */}
        <div
          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
          style={{
            background: result
              ? pass
                ? 'rgba(74,222,128,0.15)'
                : 'rgba(239,68,68,0.15)'
              : 'rgba(255,255,255,0.06)',
          }}
        >
          {result && (
            <span
              style={{
                fontSize: '10px',
                color: pass ? '#4ade80' : '#ef4444',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {pass ? '✓' : '×'}
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Customer name */}
          <p className="font-mono mb-0.5" style={{ fontSize: '9px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
            {ticket.customerName}
          </p>
          {/* Message */}
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: '1.5',
              fontFamily: 'var(--font-dm-sans)',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {ticket.message}
          </p>
        </div>

        {/* Criterion dots */}
        <div className="flex items-center gap-1 flex-shrink-0 mt-1">
          {result?.criteriaResults.map((cr, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              title={`${cr.criterion}: ${cr.note}`}
              style={{ background: cr.pass ? '#4ade80' : '#ef4444', opacity: 0.8 }}
            />
          ))}
          {!result && (
            <span className="font-mono" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>
              —
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function OutputInspector({ ticket, result }: { ticket: TestTicket; result: TicketResult | undefined }) {
  return (
    <div
      className="rounded-lg p-4 mt-4"
      style={{
        border: '0.5px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      <p className="font-mono uppercase mb-3" style={{ fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.35)' }}>
        Output Inspector · {ticket.customerName}
      </p>

      {/* Full message */}
      <div className="mb-4">
        <p className="font-mono uppercase mb-1" style={{ fontSize: '9px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)' }}>Ticket</p>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', fontFamily: 'var(--font-dm-sans)' }}>
          {ticket.message}
        </p>
      </div>

      {/* Context available */}
      {ticket.context && (
        <div className="mb-4">
          <p className="font-mono uppercase mb-1" style={{ fontSize: '9px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)' }}>
            Context available
          </p>
          <p
            className="font-mono rounded p-2"
            style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: '1.6',
              background: 'rgba(255,255,255,0.03)',
              border: '0.5px solid rgba(255,255,255,0.07)',
              maxHeight: '80px',
              overflow: 'hidden',
            }}
          >
            {ticket.context}
          </p>
        </div>
      )}

      {/* Expected output */}
      <div className="mb-4">
        <p className="font-mono uppercase mb-1" style={{ fontSize: '9px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)' }}>
          Expected output
        </p>
        <pre
          className="font-mono rounded p-2"
          style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.55)',
            lineHeight: '1.7',
            background: 'rgba(255,255,255,0.03)',
            border: '0.5px solid rgba(255,255,255,0.07)',
            whiteSpace: 'pre-wrap',
          }}
        >{JSON.stringify(ticket.groundTruth, null, 2)}</pre>
      </div>

      {/* Criteria breakdown */}
      {result && (
        <div>
          <p className="font-mono uppercase mb-2" style={{ fontSize: '9px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)' }}>
            Eval criteria
          </p>
          <div className="space-y-1.5">
            {result.criteriaResults.map((cr, i) => (
              <div key={i} className="flex items-start gap-2">
                <span
                  className="font-mono flex-shrink-0"
                  style={{ fontSize: '11px', color: cr.pass ? '#4ade80' : '#ef4444', marginTop: '1px' }}
                >
                  {cr.pass ? '✓' : '×'}
                </span>
                <div style={{ flex: 1 }}>
                  <span className="font-mono" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
                    {cr.criterion}
                  </span>
                  {!cr.pass && (
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.5', fontFamily: 'var(--font-dm-sans)', marginTop: '1px' }}>
                      {cr.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function TestBench({
  brief,
  character,
  devNote,
  tickets,
  ticketResults,
  activeTicketId,
  onSelectTicket,
}: Props) {
  const activeTicket = tickets.find(t => t.id === activeTicketId) ?? null
  const activeResult = ticketResults.find(r => r.ticketId === activeTicketId)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Mission brief — pinned at top */}
      <div
        className="flex-shrink-0 p-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center font-mono flex-shrink-0"
            style={{ background: `${CHARACTER_COLORS[character]}15`, fontSize: '11px', color: CHARACTER_COLORS[character] }}
          >
            {character === 'jordan' ? 'J' : character === 'dev' ? 'D' : 'S'}
          </div>
          <span className="font-mono" style={{ fontSize: '9px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
            {CHARACTER_LABELS[character]}
          </span>
        </div>
        <p
          className="font-display"
          style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', fontStyle: 'italic' }}
        >
          &ldquo;{brief}&rdquo;
        </p>
        {devNote && (
          <div
            className="mt-3 rounded p-2.5"
            style={{ background: 'rgba(96,165,250,0.07)', border: '0.5px solid rgba(96,165,250,0.2)' }}
          >
            <p className="font-mono uppercase mb-1" style={{ fontSize: '9px', letterSpacing: '0.1em', color: '#60a5fa' }}>Dev</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.55', fontFamily: 'var(--font-dm-sans)' }}>
              {devNote}
            </p>
          </div>
        )}
      </div>

      {/* Ticket list + inspector, scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="font-mono uppercase mb-3" style={{ fontSize: '9px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)' }}>
          Test Suite · {tickets.length} tickets
        </p>

        {tickets.map(ticket => (
          <TicketRow
            key={ticket.id}
            ticket={ticket}
            result={ticketResults.find(r => r.ticketId === ticket.id)}
            isActive={activeTicketId === ticket.id}
            onClick={() => onSelectTicket(activeTicketId === ticket.id ? null : ticket.id)}
          />
        ))}

        {/* Output inspector */}
        {activeTicket && (
          <OutputInspector ticket={activeTicket} result={activeResult} />
        )}
      </div>
    </div>
  )
}
