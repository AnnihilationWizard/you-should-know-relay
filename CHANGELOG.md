# Changelog

## [1.0.0] - 2026-10-10

Initial release of you-should-know-relay by AnnihilationWizard.

- Each heads-up the built-in you-should-know plugin shows is forwarded to Claude as a conversation note it reads, once per heads-up, for the current session only.
- The heads-up stays on screen as before; a toast confirms each forward.
- `/you-should-know-relay` pauses or resumes forwarding. The pause applies to every session at once and is kept across restarts; heads-ups shown while paused are never sent later.
- Marketplace file so the repository installs with `/plugin install you-should-know-relay --marketplace AnnihilationWizard/you-should-know-relay`.
- Tests for forwarding, de-duplication, ignored writes and the pause, run with `claude plugin test`.
- English README with a before-and-after illustration, contribution guidance and security notes.

Built on Claude Code's early-access function-hooks mod API and tested against Claude Code 2.1.295.

[1.0.0]: https://github.com/AnnihilationWizard/you-should-know-relay/releases/tag/v1.0.0
