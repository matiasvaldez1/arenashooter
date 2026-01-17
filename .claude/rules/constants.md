---
globs:
  - "shared/constants.js"
  - "shared/maps.js"
---

# Shared Constants Rules

- These files are imported by both client and server
- PLAYER_CLASSES defines character stats (health, speed, damage, abilities)
- ULTIMATES defines ultimate ability configs
- PERKS defines wave survival perk options
- MAPS in maps.js defines arena layouts and hazards
- Changes here affect game balance - test both game modes after edits
- Use SCREAMING_SNAKE_CASE for constant names
