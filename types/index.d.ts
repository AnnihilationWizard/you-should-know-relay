// `${shownAt}:${line}` of each heads-up already forwarded this session.
export type Forwarded = string[]

declare module 'claude-code' {
  interface PluginState {
    'you-should-know-relay': { forwarded: Forwarded }
  }
}
