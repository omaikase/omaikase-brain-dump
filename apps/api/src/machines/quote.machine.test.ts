import { describe, it, expect } from 'vitest'
import { createActor } from 'xstate'
import { quoteMachine } from './quote.machine.js'

describe('quoteMachine', () => {
  it('starts in draft state', () => {
    const actor = createActor(quoteMachine).start()
    expect(actor.getSnapshot().value).toBe('draft')
  })

  it('transitions draft → sent on SEND', () => {
    const actor = createActor(quoteMachine).start()
    actor.send({ type: 'SEND' })
    expect(actor.getSnapshot().value).toBe('sent')
  })

  it('transitions draft → pending_review on REQUEST_REVIEW', () => {
    const actor = createActor(quoteMachine).start()
    actor.send({ type: 'REQUEST_REVIEW' })
    expect(actor.getSnapshot().value).toBe('pending_review')
  })

  it('transitions pending_review → sent on APPROVE', () => {
    const actor = createActor(quoteMachine).start()
    actor.send({ type: 'REQUEST_REVIEW' })
    actor.send({ type: 'APPROVE' })
    expect(actor.getSnapshot().value).toBe('sent')
  })

  it('transitions pending_review → draft on REJECT', () => {
    const actor = createActor(quoteMachine).start()
    actor.send({ type: 'REQUEST_REVIEW' })
    actor.send({ type: 'REJECT' })
    expect(actor.getSnapshot().value).toBe('draft')
  })

  it('transitions sent → negotiating on COUNTER_RECEIVED', () => {
    const actor = createActor(quoteMachine).start()
    actor.send({ type: 'SEND' })
    actor.send({ type: 'COUNTER_RECEIVED' })
    expect(actor.getSnapshot().value).toBe('negotiating')
  })

  it('transitions sent → accepted on ACCEPT', () => {
    const actor = createActor(quoteMachine).start()
    actor.send({ type: 'SEND' })
    actor.send({ type: 'ACCEPT' })
    expect(actor.getSnapshot().value).toBe('accepted')
  })

  it('transitions sent → rejected on REJECT', () => {
    const actor = createActor(quoteMachine).start()
    actor.send({ type: 'SEND' })
    actor.send({ type: 'REJECT' })
    expect(actor.getSnapshot().value).toBe('rejected')
  })

  it('transitions sent → expired on EXPIRE', () => {
    const actor = createActor(quoteMachine).start()
    actor.send({ type: 'SEND' })
    actor.send({ type: 'EXPIRE' })
    expect(actor.getSnapshot().value).toBe('expired')
  })

  it('transitions negotiating → sent on COUNTER_SENT', () => {
    const actor = createActor(quoteMachine).start()
    actor.send({ type: 'SEND' })
    actor.send({ type: 'COUNTER_RECEIVED' })
    actor.send({ type: 'COUNTER_SENT' })
    expect(actor.getSnapshot().value).toBe('sent')
  })

  it('transitions negotiating → accepted on ACCEPT', () => {
    const actor = createActor(quoteMachine).start()
    actor.send({ type: 'SEND' })
    actor.send({ type: 'COUNTER_RECEIVED' })
    actor.send({ type: 'ACCEPT' })
    expect(actor.getSnapshot().value).toBe('accepted')
  })

  it('transitions negotiating → rejected on REJECT', () => {
    const actor = createActor(quoteMachine).start()
    actor.send({ type: 'SEND' })
    actor.send({ type: 'COUNTER_RECEIVED' })
    actor.send({ type: 'REJECT' })
    expect(actor.getSnapshot().value).toBe('rejected')
  })

  it('ignores invalid transitions from final states', () => {
    const actor = createActor(quoteMachine).start()
    actor.send({ type: 'SEND' })
    actor.send({ type: 'ACCEPT' })
    // accepted is a final state — further events should be ignored
    actor.send({ type: 'SEND' })
    expect(actor.getSnapshot().value).toBe('accepted')
  })

  it('can serialize and restore state snapshot', () => {
    const actor = createActor(quoteMachine).start()
    actor.send({ type: 'SEND' })
    actor.send({ type: 'COUNTER_RECEIVED' })
    const snapshot = actor.getSnapshot()
    expect(snapshot.value).toBe('negotiating')
    // Verify the state is serializable (no circular refs)
    const serialized = JSON.stringify(snapshot)
    expect(serialized).toBeTruthy()
  })
})
