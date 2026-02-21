# How to Add a Command

1. Add command in `src/cli.ts` (or command module when split).
2. Support `--format` and output through `printOut(envelope(...))`.
3. Use stable command name in envelope `command` field.
4. Add tests:
   - unit (parsing/logic)
   - integration (CLI behavior)
   - JSON contract snapshot
5. Update README command section.
