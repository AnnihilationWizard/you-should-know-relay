import { describe, expect, mock, test } from 'claude-code/testing'
import type { Plugin } from 'claude-code/testing'
import type { On } from 'claude-code'

import { offerFor } from './register'

const SESSION = 'session-1'

// Stands in for a builtin-tier plugin: `/write-sessions <json>` stores its
// "sessions" key, as cc-plugin-you-should-know does when it shows a heads-up.
const writerNamed = (name: string): Plugin => ({
  name,
  tier: 'builtin',
  register(on) {
    on('session.start', async ($, e, next) => {
      await $.command.register({ name: 'write-sessions', description: 'Stores "sessions".' })
      return next(e)
    })
    on('command.run', { command: 'write-sessions' }, async ($, e) => {
      await $.store.set('sessions', JSON.parse(e.args))
      return { text: 'stored' }
    })
  },
})

const BUILTIN = writerNamed('cc-plugin-you-should-know')

const world = (on: On) => {
  mock.store(on)
  on('session.id', () => ({ value: SESSION }))
  on('ui.toast', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  return mock.session(on)
}

const offer = (line: string, shownAt: number, id = SESSION) => [
  { id: 'other-session', view: { kind: 'offer', line: 'Not this one.', shownAt: 1 } },
  { id, askedTurn: 't1', offeredTurn: 't1', tag: 'Heads up', view: { kind: 'offer', line, shownAt } },
]

const write = (value: unknown) =>
  ({
    command: 'write-sessions',
    args: JSON.stringify(value),
    origin: { kind: 'composer' },
    presentation: { isFullscreen: true, columns: 120 },
  }) as const

test('a heads-up is forwarded to Claude once', { plugins: [BUILTIN] }, async ($, on) => {
  const session = world(on)

  await $.command.run(write(offer('設定檔還沒有備份。.', 100)))
  // The built-in writes the same view again (prompt counts, debug checks).
  await $.command.run(write(offer('設定檔還沒有備份。.', 100)))

  const rows = session.appended()
  expect(rows.length).toBe(1)
  expect(rows[0]?.door).toBe('note')
  expect(rows[0]?.message.type).toBe('user')
  const text = JSON.stringify(rows[0]?.message.content)
  expect(text).toContain('「設定檔還沒有備份。」')
  expect(text).not.toContain('Not this one.')
})

test('each new heads-up is forwarded', { plugins: [BUILTIN] }, async ($, on) => {
  const session = world(on)

  await $.command.run(write(offer('First.', 100)))
  await $.command.run(write(offer('Second.', 200)))

  expect(session.appended().length).toBe(2)
})

test('views that are not an offer for this session are left alone', { plugins: [BUILTIN] }, async ($, on) => {
  const session = world(on)

  await $.command.run(write(offer('Elsewhere.', 100, 'other')))
  await $.command.run(write([{ id: SESSION, view: { kind: 'asked', line: 'Asked.', shownAt: 1 } }]))
  await $.command.run(write([{ id: SESSION }]))
  await $.command.run(write({ not: 'a list' }))

  expect(session.appended().length).toBe(0)
})

test('another plugin writing "sessions" is ignored', { plugins: [writerNamed('someone-else')] }, async ($, on) => {
  const session = world(on)

  await $.command.run(write(offer('Same shape.', 100)))

  expect(session.appended().length).toBe(0)
})

const TOGGLE = {
  command: 'you-should-know-relay',
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: true, columns: 120 },
} as const

test('/you-should-know-relay pauses and resumes forwarding', { plugins: [BUILTIN] }, async ($, on) => {
  const session = world(on)

  const paused = await $.command.run(TOGGLE)
  expect(paused).toEqual(expect.objectContaining({ text: expect.stringContaining('已暫停') }))
  await $.command.run(write(offer('While paused.', 100)))
  expect(session.appended().length).toBe(0)

  const resumed = await $.command.run(TOGGLE)
  expect(resumed).toEqual(expect.objectContaining({ text: expect.stringContaining('已恢復') }))
  // The heads-up shown during the pause is still up; it stays unsent.
  await $.command.run(write(offer('While paused.', 100)))
  expect(session.appended().length).toBe(0)

  await $.command.run(write(offer('After resuming.', 200)))
  expect(session.appended().length).toBe(1)
})

test('a pause saved by an earlier session still holds', { plugins: [BUILTIN] }, async ($, on) => {
  // Stands for the store as an earlier session's /you-should-know-relay left it.
  mock.store(on, { isPaused: true })
  on('session.id', () => ({ value: SESSION }))
  on('ui.toast', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  const session = mock.session(on)

  await $.command.run(write(offer('New session.', 100)))
  expect(session.appended().length).toBe(0)

  const resumed = await $.command.run(TOGGLE)
  expect(resumed).toEqual(expect.objectContaining({ text: expect.stringContaining('已恢復') }))
  await $.command.run(write(offer('Resumed.', 200)))
  expect(session.appended().length).toBe(1)
})

describe('offerFor', () => {
  test('keeps the explanation and drops an empty line', () => {
    const view = { kind: 'offer', line: 'Line.', explanation: ' Why. ', shownAt: 5 }
    expect(offerFor([{ id: 'a', view }], 'a')).toEqual({ line: 'Line.', explanation: 'Why.', shownAt: 5 })
    expect(offerFor([{ id: 'a', view: { ...view, line: '  ' } }], 'a')).toBeUndefined()
  })
})
