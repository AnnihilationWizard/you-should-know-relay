# Contributing

Thank you for helping improve you-should-know-relay. It is a small Claude Code mod written as a plugin of function hooks. Start with the [README](README.md).

## Report a bug

Use the [issue tracker](https://github.com/AnnihilationWizard/you-should-know-relay/issues). Include:

- The you-should-know-relay version, Claude Code version (`claude --version`) and operating system.
- The surface: terminal (fullscreen or classic renderer), desktop app or IDE.
- What happened: a heads-up that was not forwarded, one forwarded twice, or the pause not taking effect.
- Any transcript or `claude --debug` log line that names `you-should-know-relay`.

Never paste conversation text, source code or paths you are not allowed to share. Heads-ups quote your session, so redact them first. For security concerns, follow [SECURITY.md](SECURITY.md).

## Propose a change

Open an issue that describes the problem and the intended behavior before a broad change. Keep changes focused: the mod should only forward what you-should-know already shows, never change what it shows or start a turn on its own.

## Develop and verify

Run from the repository root:

```bash
claude plugin validate .
claude plugin test .
npx -p typescript@5 tsc -p .
```

The type-check needs the types Claude Code writes to `.claude-plugin/types/` the first time it loads the mod, for example with `claude --plugin-dir .`.

For behavior changes, add or update a test in `hooks/register.test.ts`. The tests stand in for the built-in plugin with an inline builtin-tier plugin that writes the same store key.

## Submit a pull request

- Explain the problem and the resulting behavior.
- List the checks you ran and their results.
- Update the README and CHANGELOG when behavior changes.
- Use a Conventional Commit message, such as `fix: skip a heads-up with an empty line`.
