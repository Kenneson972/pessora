# Claude Code Configuration - Karibloom — PESSORA

## Auto-Learn — Règle Karibloom (Toujours Active)

> Règle complète : voir `docs/kb-auto-learn.mdc`

- **DÉBUT DE SESSION** : Lire `docs/auto-learn/LEARNINGS.md` silencieusement et appliquer toutes les règles. Confirmer en 1 ligne : `✓ [N] apprentissages chargés.`
- **PENDANT LA SESSION** : Dès qu'une correction, préférence ou règle est détectée → capturer immédiatement dans `docs/auto-learn/` sans attendre qu'on le demande. Confirmer : `✓ Apprentissage noté : [règle]`
- **FIN DE SESSION** : Persister tous les nouveaux apprentissages automatiquement
- Les corrections de Kenneson sont des règles dures — ne jamais les répéter

## Behavioral Rules (Always Enforced)

- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) unless explicitly requested
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files

## File Organization

- Use `/src` for source code files
- Use `/docs` for documentation and markdown files
- Use `/config` for configuration files
