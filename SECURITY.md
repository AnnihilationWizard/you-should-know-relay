# Security Notes

you-should-know-relay only copies heads-ups the built-in you-should-know plugin already shows into the conversation Claude reads. These notes describe what it can reach; they do not establish a support SLA.

## What the mod does

- It hooks `store.set` and reacts only to the built-in `cc-plugin-you-should-know` plugin writing its `sessions` key. It passes that write on unchanged.
- For a new heads-up in the current session, it appends one user-role note to the main conversation with `$.session.append` and shows a toast.
- It registers the `/you-should-know-relay` command. Its own plugin store holds one value, whether forwarding is paused; the session's state holds the list of heads-ups already forwarded.
- It does not read or write your files, run processes, make network requests, change settings or start a turn.

A forwarded heads-up becomes part of the conversation: it is sent to the model with later requests and kept in the session transcript, like the rest of the session. Pause forwarding with `/you-should-know-relay` when you do not want that.

## Report a security concern

If this repository offers GitHub private vulnerability reporting, use the **Report a vulnerability** option on its [Security page](https://github.com/AnnihilationWizard/you-should-know-relay/security). This document does not assume that the option is enabled.

If no private reporting option is available, open a minimal issue asking the maintainer to arrange a private channel. Do not publish exploit details, credentials or private code in that issue.

Include the affected version, Claude Code version, environment, steps to reproduce and impact. No response-time or supported-version guarantee is currently stated.
