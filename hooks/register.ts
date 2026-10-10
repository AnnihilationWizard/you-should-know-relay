import { atom, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Forwarded } from '../types'

// The built-in plugin that draws the heads-up above the prompt. It sits in the
// builtin tier, beneath this mod, so its `$.store.set` calls pass through here.
const SOURCE = 'cc-plugin-you-should-know'
const KEEP = 50

const forwarded = atom(
  { plugin: 'you-should-know-relay', key: 'forwarded' } as const,
  [] as Forwarded,
)
// Kept in `$.store`, so a pause holds in every session until resumed.
const PAUSED = 'isPaused'
const readPaused = async ($: EngineInterface) => (await $.store.get(PAUSED)) === true

type Offer = { line: string; explanation: string | undefined; shownAt: number | undefined }

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

// The built-in keeps one entry per session under its "sessions" key; an entry
// whose `view.kind` is "offer" is the heads-up it shows now.
export const offerFor = (sessions: unknown, sessionId: string): Offer | undefined => {
  if (!Array.isArray(sessions)) return undefined
  const entry: unknown = sessions.find(s => isRecord(s) && s.id === sessionId)
  const view = isRecord(entry) ? entry.view : undefined
  if (!isRecord(view) || view.kind !== 'offer' || typeof view.line !== 'string') return undefined
  // Its lines end in an extra "." after a full-width stop ("…不到。.").
  const line = view.line.trim().replace(/([。！？])\.$/, '$1')
  if (line === '') return undefined
  return {
    line,
    explanation:
      typeof view.explanation === 'string' && view.explanation.trim() !== ''
        ? view.explanation.trim()
        : undefined,
    shownAt: typeof view.shownAt === 'number' ? view.shownAt : undefined,
  }
}

export const reminder = (offer: Offer) =>
  [
    '[you-should-know 轉送] Claude Code 內建的 you-should-know 外掛剛在提示框上方提醒使用者一件事，它判斷這是你還沒有明確告訴使用者的重點：',
    '',
    `「${offer.line}」`,
    ...(offer.explanation === undefined ? [] : ['', `外掛的補充說明：${offer.explanation}`]),
    '',
    '這段文字由 you-should-know-relay mod 自動轉送，不是使用者打的字。請在接下來的回覆中處理這一點：若屬實，向使用者明確說明，並考慮它對目前工作的影響；若你判斷不成立或已經說明過，簡短說明理由即可。',
  ].join('\n')

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'you-should-know-relay',
      description: '暫停或恢復把 you-should-know 的提醒轉給 Claude',
    })

    return next(e)
  })

  on('command.run', { command: 'you-should-know-relay' }, async $ => {
    const paused = !(await readPaused($))
    await $.store.set(PAUSED, paused)

    return {
      text: paused
        ? '已暫停：you-should-know 的提醒不再轉給 Claude（再執行一次 /you-should-know-relay 恢復）'
        : '已恢復：you-should-know 的提醒會自動轉給 Claude',
    }
  })

  on('store.set', { key: 'sessions' }, async ($, e, next) => {
    const result = await next(e)
    if (next.origin.plugin !== SOURCE) return result

    try {
      const offer = offerFor(e.value, await $.session.id())
      if (offer === undefined) return result

      // The built-in rewrites "sessions" many times while one heads-up shows.
      const id = `${offer.shownAt ?? ''}:${offer.line}`
      let isNew = false
      await update($, forwarded, list => {
        isNew = !list.includes(id)
        return isNew ? [...list, id].slice(-KEEP) : list
      })
      // A heads-up shown while paused is marked too, so resuming never sends it.
      if (!isNew || (await readPaused($))) return result

      try {
        await $.session.append({
          message: { type: 'user', content: [{ type: 'text', text: reminder(offer) }] },
        })
      } catch (error) {
        // Not appended: let a later write of the same heads-up try again.
        await update($, forwarded, list => list.filter(x => x !== id))
        throw error
      }
      $.ui.toast('you-should-know：已把這則提醒轉給 Claude')
    } catch (error) {
      $.ui.log(`you-should-know-relay: not forwarded: ${String(error)}`, { to: 'debug' })
    }
    return result
  })
}
