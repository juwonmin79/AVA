# Current Navigation Model

Status: Current-state description only.

This document records how navigation currently works. It does not define a final navigation philosophy or PRD.

## Navigator Scope

The Navigator represents work sections only.

Current Navigator targets include:

- Question Studio
- Final Prompt Preview
- GPT response
- Claude response
- Gemini response
- Consensus
- Conflict
- Unique Insight
- Human Decision
- Decision Tools

Hero is not part of this flow.

## Hero Exclusion

Hero is currently treated as a static identity banner.

Current behavior:

- Hero is not listed in `navigatorItems`.
- Hero is not rendered with a Navigator section id.
- Hero is not used as a scroll target for the Navigator.
- Hero visually sits above the work flow but does not participate in work-section navigation.

## Start Beacon

The first Navigator marker is currently displayed as `+`.

Current role:

- Marks the beginning of the work flow.
- Uses AVA-adjacent violet and blue gradient treatment.
- Has a slow breathing gradient.
- Keeps `+` form after navigation starts.
- Uses a quieter breathing state after first Navigator interaction.

Other markers remain `-`.

## Navigator Rail

The rail is the compact vertical marker surface in the right-side Navigator column.

Current role:

- Gives a quick visual map of the work sections.
- Tracks current active section by distance-based emphasis.
- Is positioned toward viewport center rather than forced to match a specific card height.
- Should not cover main workspace cards.

## Popup Navigation Layer

The popup is a floating layer attached to the Navigator.

Current behavior:

- Opens to the right of the Navigator.
- Does not affect main workspace layout width.
- Does not participate in grid/flex sizing.
- Contains work-section preview items.
- Preserves distance-based opacity in the default state.
- On hover, only the hovered item becomes more readable.

## Current Constraints

- Main workspace width should remain unchanged when popup opens or closes.
- Hero remains outside the Navigator flow.
- Popup is an overlay, not a layout column.
- Work cards remain the meaningful navigation targets.
