# Current Workspace Architecture

Status: Current-state description only.

This document describes the current workspace UI layers. It does not define final architecture or product requirements.

## Header Layer

The header is rendered inside `.main-shell` as `.top-nav`.

Current role:

- Holds theme, language, login, and signup controls.
- Login and signup are currently styled as matching plain text controls.
- Header controls are visually separate from content cards.
- Header does not own workspace content or Navigator state.

## Sidebar Layer

The sidebar is rendered as `.sidebar` in the left grid column.

Current role:

- Shows the AVA brand area.
- Contains workspace selection and workspace actions.
- Contains Snapshot Engine controls.
- Contains local save/status information.
- Sidebar internal card backgrounds have been made transparent in the current UI experiment.
- Sidebar scrollbar is hidden visually while preserving the sidebar's scroll behavior.

## Main Workspace Layer

The main workspace is rendered as `.main-shell`, containing `.dashboard` and `.workspace-content`.

Current role:

- Contains the static hero identity banner.
- Contains the functional work sections below the hero.
- Owns primary work surfaces such as question studio, prompt preview, model response cards, synthesis cards, human decision, and decision tools.
- Uses work-card styling for input, output, and action areas.
- Should not be covered by the Navigator rail.
- Should not change width when the Navigator popup opens.

## Hero Area

The hero is rendered as `.hero-card`.

Current role:

- Static identity banner.
- Symbolic visual layer with softer glass styling.
- Not an input surface.
- Not represented as a Navigator target.
- Visually differentiated from work cards through scale, spacing, and softer treatment.

## Navigator Layer

The Navigator is rendered as `.conversation-minimap` in the right grid column.

Current role:

- Provides section-level navigation for work sections.
- Uses a vertical marker rail.
- The first marker acts as a Start Beacon.
- The rail is currently positioned toward viewport center.
- Navigator should remain visually independent from the main workspace.

## Popup Layer

The popup is rendered as `.conversation-minimap__panel`.

Current role:

- Floating navigation layer anchored to the Navigator.
- Appears to the right of the Navigator.
- Does not participate in grid or flex layout width.
- Does not resize the main workspace when opened.
- Contains preview items that keep distance-based opacity by default.
- Hovered popup item becomes readable without changing layout size.

## Aurora Layer

The aurora is rendered as `.global-aurora`.

Current role:

- Fixed visual layer behind app content.
- Contains multiple moving blob elements.
- Used as background visibility context during current UI tuning.
- Current values include debug-strength visibility adjustments and may need later normalization.
