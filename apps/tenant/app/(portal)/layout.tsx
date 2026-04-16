"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Receipt, ScrollText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SEED_QUOTES, SEED_INVOICES } from '@/lib/seed-data'

const TODAY = new Date('2026-04-15')

function getAttentionCounts() {
  const pendingQuotes = SEED_QUOTES.filter((q) => q.status === 'sent').length
  const overdueInvoices = SEED_INVOICES.filter(
    (inv) => inv.status === 'sent' && new Date(inv.dueDate) < TODAY
  ).length
  return { pendingQuotes, overdueInvoices }
}

const NAV_ITEMS = [
  { label: 'Quotes', href: '/quotes', icon: FileText, countKey: 'pendingQuotes' as const },
  { label: 'Contracts', href: '/contracts', icon: ScrollText, countKey: null },
  { label: 'Invoices', href: '/invoices', icon: Receipt, countKey: 'overdueInvoices' as const },
]

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const counts = getAttentionCounts()

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-background/95 backdrop-blur px-6">
        <div className="flex items-center gap-3 mr-8">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <span className="text-xs font-bold text-primary-foreground">g</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">gnomos</span>
          <span className="text-xs text-muted-foreground border-l border-border pl-3">Tenant Portal</span>
        </div>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon, countKey }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            const count = countKey ? counts[countKey] : 0
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="size-4" />
                {label}
                {count > 0 && (
                  <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {count}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            A
          </div>
          <span className="text-sm text-muted-foreground">Acme AI</span>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 bg-muted/30">
        {children}
      </main>
    </div>
  )
}
