# UI Freeze Candidate Snapshot

Status: Phase 0 documentation snapshot.

This document records the current UI state before a possible UI freeze. It is not a PRD, not a decision log, and not a final UX definition.

## Completed Items

- The workspace shell is organized as left sidebar, main workspace, and right navigator.
- A global aurora layer exists behind the app content and is rendered through `.global-aurora` with four blob elements.
- Header auth controls have been normalized so login and signup behave as matching plain text controls.
- The hero area has been separated visually from work cards below it.
- Hero is treated as a static identity banner and is not part of the Navigator target list.
- Lower work sections remain functional cards for input, response, analysis, graph, and action flows.
- The right Navigator rail remains outside the main workspace flow.
- Navigator popup is positioned as a floating layer anchored to the Navigator, not as a layout participant.
- The first Navigator marker is a `+` Start Beacon. Other markers remain `-`.
- Popup hover behavior now increases only the hovered item visibility while preserving distance-based opacity on other items.

## Current Structure

- Header Layer: top navigation controls inside the main shell.
- Sidebar Layer: workspace selection, snapshot area, local status, and related controls.
- Main Workspace Layer: hero banner, question studio, prompt preview, model response sections, synthesis sections, decision tools.
- Navigator Layer: right-side vertical marker rail for workspace sections.
- Popup Layer: floating Navigator popup with section previews.
- Aurora Layer: fixed visual background behind application content.

## Major Findings

- Hero content is intentionally outside the Navigator model. It does not have a Navigator section id and is not represented in `navigatorItems`.
- The Navigator can affect perceived layout if its popup participates in grid width. The current implementation keeps popup behavior as an overlay.
- Right-edge clipping can appear when parent containers hide overflow or when the Navigator stacks above content. Current CSS uses final overrides to keep the app shell visible at the edges and to separate main content from the Navigator rail.
- Several UI experiments were implemented as final CSS overrides near the end of `src/App.css`; cascade order is currently significant.
- Work cards and the hero banner now have different visual roles: work cards are denser and more functional, while the hero is softer and symbolic.

## Next Steps

- Review the UI in the browser at desktop widths where the Navigator is visible.
- Confirm that opening the Navigator popup does not change main workspace width.
- Confirm Gemini/rightmost work cards are not clipped by the Navigator column.
- Decide whether to keep, reduce, or remove temporary aurora visibility/debug styling.
- Consolidate CSS overrides after visual acceptance, without changing behavior.
- Add a focused cleanup pass only after the UI freeze candidate is accepted.
