# AVA

**AVA (Adaptive Verification Architecture)**

A Human-AI Decision Intelligence Workspace designed to transform questions into structured reasoning, experimentation, learning, and evolution.

---

## Vision

AVA is not a chatbot.

AVA is a decision workspace where humans and AI collaborate to:

- Verify questions
- Generate hypotheses
- Run reasoning workflows
- Compare multiple models
- Build consensus
- Create decisions
- Capture learning
- Evolve systems over time

---

## Current Status

UI Freeze Candidate

Progress: ~95%

---

## Workspace Architecture

### Header Layer

Global identity and controls.

- AVA branding
- Theme controls
- Language controls
- Authentication controls

### Sidebar Layer

Workspace navigation and project context.

- Workspace
- Snapshot
- JSON
- CLI Bridge
- Project utilities

### Main Workspace Layer

Primary decision workflow.

- Hero
- Question Studio
- Prompt Composer
- Multi-LLM Reasoning
- Consensus
- Decision Support

### Navigator Layer

Workflow navigation system.

Features:

- Active state tracking
- Floating navigation popup
- Start Beacon (+)
- Section navigation

---

## Key Discoveries

### Aurora Visibility

Initial assumption:

Aurora animation was too weak.

Actual cause:

Layout and card opacity layers were masking the Aurora layer.

Resolution:

Rebalancing transparency produced significantly better results than increasing animation complexity.

### Hero Philosophy

Hero is not part of the workflow.

Hero acts as:

- Identity layer
- Context layer
- Brand layer

The actual workflow begins at Question Studio.

### Navigator Philosophy

Navigator is not a menu.

Navigator is a workflow locator.

The first "+" marker acts as a Start Beacon guiding users into the decision process.

---

## Technology

- React
- Vite
- Glassmorphism UI
- Multi-LLM Orchestration Concepts

---

## Next Phase

### UX Sprint

Goal:

A first-time user should understand:

- Where to start
- What to do
- Where they currently are

within 3 seconds of opening AVA.

---

## Project Status

Current phase:

UI Freeze → UX Sprint

Future phases:

- Decision Engine
- Hypothesis Engine
- Experiment Engine
- Learning Engine
- Evolution Engine

---

Built through iterative exploration, observation, experimentation, and continuous refinement.