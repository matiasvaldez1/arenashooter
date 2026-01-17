---
globs:
  - "shared/constants.js"
  - "shared/maps.js"
  - "shared/themes/**"
---

# Shared Constants Rules

- These files are imported by both client and server
- Character stats are now in `shared/themes/*.js` files
- PLAYER_CLASSES and MAPS are Proxy objects that read from active theme
- Use `getCharacter(id)`, `getActiveCharacters()` for theme-aware lookups
- PERKS defines wave survival perk options (theme-independent)
- Changes to themes affect game balance - test both game modes after edits
- Use SCREAMING_SNAKE_CASE for constant names

## Theme System

- `setActiveTheme('KPOP')` - Switch theme at runtime
- `getCharacterList()` - Get array of enabled character IDs
- Each theme defines: characters, maps, mobs, bosses
- Add new themes in `shared/themes/` and register in index.js
