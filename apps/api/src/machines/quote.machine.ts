import { createMachine } from 'xstate'

export const quoteMachine = createMachine({
  id: 'quote',
  initial: 'draft',
  states: {
    draft: {
      on: {
        SEND: 'sent',
        REQUEST_REVIEW: 'pending_review',
      },
    },
    pending_review: {
      on: {
        APPROVE: 'sent',
        REJECT: 'draft',
      },
    },
    sent: {
      on: {
        COUNTER_RECEIVED: 'negotiating',
        ACCEPT: 'accepted',
        REJECT: 'rejected',
        EXPIRE: 'expired',
      },
    },
    negotiating: {
      on: {
        COUNTER_SENT: 'sent',
        ACCEPT: 'accepted',
        REJECT: 'rejected',
      },
    },
    accepted: {
      type: 'final',
    },
    rejected: {
      type: 'final',
    },
    expired: {
      type: 'final',
    },
  },
})

// Export state names as a const for use in DB queries
export const QUOTE_STATES = [
  'draft', 'pending_review', 'sent', 'negotiating',
  'accepted', 'rejected', 'expired',
] as const

export type QuoteState = typeof QUOTE_STATES[number]
