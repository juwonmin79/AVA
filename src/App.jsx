import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const storageKey = 'ava-council-workspaces'

const projectTemplates = [
  {
    id: 'ava',
    name: 'AVA',
    projectPrompt:
      'AVA Council의 제품 범위, 구현 속도, 판단 품질 사이의 균형을 평가하라.',
    question:
      'AVA Council을 로컬 전용 Human-AI Decision Workspace로 설계할 때 가장 적절한 첫 릴리스 범위는 무엇인가?',
  },
  {
    id: 'graymug',
    name: 'GrayMug',
    projectPrompt:
      'GrayMug의 브랜드 명확성, 포지셔닝, 차별화 전략을 우선적으로 검토하라.',
    question:
      'GrayMug가 초기 시장에서 더 강한 인상을 만들기 위해 가장 먼저 정리해야 할 브랜드 판단은 무엇인가?',
  },
  {
    id: 'bd-strategy',
    name: 'BD Strategy',
    projectPrompt:
      '제휴 파이프라인, GTM 순서, 사업개발 실행 리스크 관점에서 판단하라.',
    question:
      'BD Strategy 워크스페이스에서 가장 먼저 검토해야 할 파트너십 우선순위는 무엇인가?',
  },
]

const navigatorItems = [
  { id: 'question-studio', label: '질문', shortLabel: '질문', type: 'question' },
  {
    id: 'final-prompt-preview',
    label: '프롬프트',
    shortLabel: '프롬프트',
    type: 'finalPrompt',
  },
  { id: 'gpt-response', label: 'GPT', shortLabel: 'GPT', type: 'gptResponse' },
  {
    id: 'claude-response',
    label: 'Claude',
    shortLabel: 'Claude',
    type: 'claudeResponse',
  },
  {
    id: 'gemini-response',
    label: 'Gemini',
    shortLabel: 'Gemini',
    type: 'geminiResponse',
  },
  { id: 'consensus', label: '합의', shortLabel: '합의', type: 'consensus' },
  { id: 'conflict', label: '충돌', shortLabel: '충돌', type: 'conflict' },
  {
    id: 'unique-insight',
    label: '통찰',
    shortLabel: '통찰',
    type: 'uniqueInsight',
  },
  {
    id: 'human-decision',
    label: '판단',
    shortLabel: '판단',
    type: 'humanDecision',
  },
  {
    id: 'decision-tools',
    label: '결정 도구',
    shortLabel: '도구',
    type: 'decisionTools',
  },
]

const stopWords = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'from',
  'into',
  'your',
  'their',
  'have',
  'will',
  'about',
  'should',
  'would',
  'could',
  'there',
  'which',
  'when',
  'what',
  'where',
  'while',
  'through',
  'across',
  'because',
  'use',
  'using',
  'used',
  'only',
  'than',
  'then',
  'them',
  'they',
  'model',
  'models',
  'response',
  'panel',
  'local',
  'area',
  'here',
  'once',
  'also',
  'need',
  'needs',
  'make',
  'made',
  'more',
  'most',
  'very',
  'just',
  'over',
  'each',
  'high',
  'low',
  'tool',
  'tools',
  'system',
  'council',
])

const conflictSignals = [
  {
    label: '속도 대 깊이',
    a: ['fast', 'faster', 'quick', 'ship', 'lean', 'simple', 'lightweight', 'mvp'],
    b: ['deep', 'thorough', 'detailed', 'comprehensive', 'robust', 'rigorous'],
  },
  {
    label: '자동화 대 인간 통제',
    a: ['automate', 'automation', 'autonomous', 'hands-off'],
    b: ['human', 'manual', 'review', 'approval', 'operator', 'judgment'],
  },
  {
    label: '확장 대 집중',
    a: ['broad', 'platform', 'expand', 'multi', 'suite'],
    b: ['focus', 'narrow', 'specific', 'single', 'core'],
  },
]

function createDefaultProviderSettings() {
  return {
    gpt: {
      enabled: true,
      modelName: 'gpt-4.1',
      role: '종합 전략가',
      temperature: 0.4,
      maxTokens: 1600,
    },
    claude: {
      enabled: true,
      modelName: 'claude-sonnet',
      role: '리스크 검토자',
      temperature: 0.35,
      maxTokens: 1600,
    },
    gemini: {
      enabled: true,
      modelName: 'gemini-pro',
      role: '대안 탐색자',
      temperature: 0.45,
      maxTokens: 1600,
    },
  }
}

function normalizeProviderSettings(providerSettings) {
  const defaults = createDefaultProviderSettings()
  const source = providerSettings || {}

  return {
    gpt: {
      ...defaults.gpt,
      ...(source.gpt || {}),
    },
    claude: {
      ...defaults.claude,
      ...(source.claude || {}),
    },
    gemini: {
      ...defaults.gemini,
      ...(source.gemini || {}),
    },
  }
}

function createWorkspaceData(template = {}) {
  return {
    globalPrompt:
      template.globalPrompt ||
      '당신은 다중 모델 전략 위원회다. 핵심 쟁점, 명시적 트레이드오프, 실행 가능한 권고안을 간결하게 정리하라.',
    projectPrompt: template.projectPrompt || '',
    question: template.question || '',
    finalPrompt: template.finalPrompt || '',
    gptResponse: template.gptResponse || '',
    claudeResponse: template.claudeResponse || '',
    geminiResponse: template.geminiResponse || '',
    consensus: template.consensus || '',
    conflict: template.conflict || '',
    uniqueInsight: template.uniqueInsight || '',
    humanDecision: template.humanDecision || '',
    claims: normalizeClaims(template.claims),
    decisionGraph: normalizeDecisionGraph(template.decisionGraph),
    decisionNodes: normalizeDecisionNodes(template.decisionNodes),
    hypotheses: normalizeHypotheses(template.hypotheses),
    experiments: normalizeExperiments(template.experiments),
    learnings: normalizeLearnings(template.learnings),
    evolutions: normalizeEvolutions(template.evolutions),
    strategies: normalizeStrategies(template.strategies),
    conversationAnchors: normalizeConversationAnchors(template.conversationAnchors),
    providerSettings: normalizeProviderSettings(template.providerSettings),
  }
}

function createClearedWorkspaceData() {
  return {
    globalPrompt: '',
    projectPrompt: '',
    question: '',
    finalPrompt: '',
    gptResponse: '',
    claudeResponse: '',
    geminiResponse: '',
    consensus: '',
    conflict: '',
    uniqueInsight: '',
    humanDecision: '',
    claims: [],
    decisionGraph: {
      nodes: [],
      edges: [],
    },
    decisionNodes: {
      nodes: [],
      links: [],
    },
    hypotheses: [],
    experiments: [],
    learnings: [],
    evolutions: [],
    strategies: [],
    conversationAnchors: [],
    providerSettings: createDefaultProviderSettings(),
  }
}

function normalizeClaims(claims) {
  if (!Array.isArray(claims)) {
    return []
  }

  return claims.map((claim) => ({
    id: claim.id || `claim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    workspaceId: claim.workspaceId || '',
    cycleId: claim.cycleId || '',
    source: claim.source || 'human',
    text: claim.text || '',
    stance: claim.stance || 'unknown',
    status: claim.status || 'pending',
    confidence: claim.confidence || 'unknown',
    evidence: claim.evidence || '',
    tags: Array.isArray(claim.tags) ? claim.tags : [],
    decisionReason: claim.decisionReason || '',
    decidedAt: claim.decidedAt || null,
    createdAt: claim.createdAt || new Date().toISOString(),
    updatedAt: claim.updatedAt || claim.createdAt || new Date().toISOString(),
    linkedTimelineEventId: claim.linkedTimelineEventId || null,
  }))
}

function normalizeDecisionGraph(decisionGraph) {
  const graph = decisionGraph || {}

  return {
    nodes: Array.isArray(graph.nodes)
      ? graph.nodes.map((node) => ({
          id: node.id || `node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          workspaceId: node.workspaceId || '',
          cycleId: node.cycleId || '',
          claimId: node.claimId || '',
          source: node.source || 'human',
          label: node.label || '',
          stance: node.stance || 'unknown',
          createdAt: node.createdAt || new Date().toISOString(),
        }))
      : [],
    edges: Array.isArray(graph.edges)
      ? graph.edges.map((edge) => ({
          id: edge.id || `edge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          workspaceId: edge.workspaceId || '',
          cycleId: edge.cycleId || '',
          fromClaimId: edge.fromClaimId || '',
          toClaimId: edge.toClaimId || '',
          relation: edge.relation || 'unknown',
          createdAt: edge.createdAt || new Date().toISOString(),
          updatedAt: edge.updatedAt || edge.createdAt || new Date().toISOString(),
        }))
      : [],
  }
}

function normalizeDecisionNodes(decisionNodes) {
  const graph = decisionNodes || {}

  return {
    nodes: Array.isArray(graph.nodes)
      ? graph.nodes.map((node) => ({
          id:
            node.id ||
            `decision-node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          workspaceId: node.workspaceId || '',
          cycleId: node.cycleId || '',
          title: node.title || '',
          description: node.description || '',
          type: node.type || 'decision',
          confidence: node.confidence || 'medium',
          status: node.status || 'active',
          createdAt: node.createdAt || new Date().toISOString(),
          updatedAt: node.updatedAt || node.createdAt || new Date().toISOString(),
        }))
      : [],
    links: Array.isArray(graph.links)
      ? graph.links.map((link) => ({
          id:
            link.id ||
            `decision-link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          workspaceId: link.workspaceId || '',
          cycleId: link.cycleId || '',
          fromNodeId: link.fromNodeId || '',
          toNodeId: link.toNodeId || '',
          relation: link.relation || 'supports',
          createdAt: link.createdAt || new Date().toISOString(),
          updatedAt: link.updatedAt || link.createdAt || new Date().toISOString(),
        }))
      : [],
  }
}

function normalizeHypotheses(hypotheses) {
  if (!Array.isArray(hypotheses)) {
    return []
  }

  return hypotheses.map((hypothesis) => ({
    id:
      hypothesis.id || `hypothesis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    workspaceId: hypothesis.workspaceId || '',
    cycleId: hypothesis.cycleId || '',
    title: hypothesis.title || '',
    description: hypothesis.description || '',
    status: hypothesis.status || 'active',
    linkedClaimIds: Array.isArray(hypothesis.linkedClaimIds)
      ? hypothesis.linkedClaimIds
      : [],
    linkedDecisionIds: Array.isArray(hypothesis.linkedDecisionIds)
      ? hypothesis.linkedDecisionIds
      : [],
    confidence: hypothesis.confidence || 'unknown',
    createdAt: hypothesis.createdAt || new Date().toISOString(),
    updatedAt: hypothesis.updatedAt || hypothesis.createdAt || new Date().toISOString(),
  }))
}

function normalizeExperiments(experiments) {
  if (!Array.isArray(experiments)) {
    return []
  }

  return experiments.map((experiment) => ({
    id:
      experiment.id || `experiment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    workspaceId: experiment.workspaceId || '',
    hypothesisId: experiment.hypothesisId || '',
    linkedHypothesisIds: Array.isArray(experiment.linkedHypothesisIds)
      ? experiment.linkedHypothesisIds
      : experiment.hypothesisId
        ? [experiment.hypothesisId]
        : [],
    title: experiment.title || '',
    description: experiment.description || '',
    expectedOutcome: experiment.expectedOutcome || '',
    actualOutcome: experiment.actualOutcome || '',
    status: experiment.status || 'planned',
    linkedClaimIds: Array.isArray(experiment.linkedClaimIds)
      ? experiment.linkedClaimIds
      : [],
    createdAt: experiment.createdAt || new Date().toISOString(),
    updatedAt: experiment.updatedAt || experiment.createdAt || new Date().toISOString(),
    completedAt: experiment.completedAt || null,
  }))
}

function normalizeLearnings(learnings) {
  if (!Array.isArray(learnings)) {
    return []
  }

  return learnings.map((learning) => ({
    id: learning.id || `learning-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    workspaceId: learning.workspaceId || '',
    experimentId: learning.experimentId || '',
    hypothesisId: learning.hypothesisId || '',
    title: learning.title || '',
    summary: learning.summary || '',
    result: learning.result || 'inconclusive',
    impact: learning.impact || 'medium',
    nextAction: learning.nextAction || '',
    linkedClaimIds: Array.isArray(learning.linkedClaimIds) ? learning.linkedClaimIds : [],
    createdAt: learning.createdAt || new Date().toISOString(),
    updatedAt: learning.updatedAt || learning.createdAt || new Date().toISOString(),
  }))
}

function normalizeEvolutions(evolutions) {
  if (!Array.isArray(evolutions)) {
    return []
  }

  return evolutions.map((evolution) => ({
    id: evolution.id || `evolution-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    workspaceId: evolution.workspaceId || '',
    learningId: evolution.learningId || '',
    fromHypothesisId: evolution.fromHypothesisId || '',
    toHypothesisId: evolution.toHypothesisId || '',
    nextExperimentId: evolution.nextExperimentId || '',
    type: evolution.type || 'refine',
    reason: evolution.reason || '',
    createdAt: evolution.createdAt || new Date().toISOString(),
    updatedAt: evolution.updatedAt || evolution.createdAt || new Date().toISOString(),
  }))
}

function normalizeStrategies(strategies) {
  if (!Array.isArray(strategies)) {
    return []
  }

  return strategies.map((strategy) => ({
    id:
      strategy.id || `strategy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    workspaceId: strategy.workspaceId || '',
    cycleId: strategy.cycleId || '',
    title: strategy.title || '',
    description: strategy.description || '',
    status: strategy.status || 'draft',
    linkedDecisionNodeIds: Array.isArray(strategy.linkedDecisionNodeIds)
      ? strategy.linkedDecisionNodeIds
      : [],
    createdAt: strategy.createdAt || new Date().toISOString(),
    updatedAt: strategy.updatedAt || strategy.createdAt || new Date().toISOString(),
  }))
}

function normalizeConversationAnchors(conversationAnchors) {
  if (!Array.isArray(conversationAnchors)) {
    return []
  }

  return conversationAnchors.map((anchor, index) => ({
    id:
      anchor.id ||
      `conversation-anchor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sourceId: anchor.sourceId || '',
    sourceType: anchor.sourceType || 'question',
    label: anchor.label || '',
    summary: anchor.summary || '',
    positionIndex:
      typeof anchor.positionIndex === 'number' ? anchor.positionIndex : index,
    createdAt: anchor.createdAt || '',
  }))
}

function createWorkspace(name, template = {}) {
  return {
    id: `workspace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    data: createWorkspaceData(template),
    snapshots: Array.isArray(template.snapshots) ? template.snapshots : [],
    timeline: Array.isArray(template.timeline) ? template.timeline : [],
  }
}

function normalizeWorkspaceImport(inputWorkspace, existingWorkspaceIds = []) {
  if (!inputWorkspace || typeof inputWorkspace !== 'object') {
    throw new Error('가져올 작업공간 형식이 올바르지 않습니다.')
  }

  const originalId = typeof inputWorkspace.id === 'string' ? inputWorkspace.id : ''
  const needsNewId = !originalId || existingWorkspaceIds.includes(originalId)
  const workspaceId = needsNewId
    ? `workspace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    : originalId

  const originalName =
    typeof inputWorkspace.name === 'string' && inputWorkspace.name.trim()
      ? inputWorkspace.name.trim()
      : '가져온 작업공간'

  const name =
    needsNewId && existingWorkspaceIds.includes(originalId)
      ? `${originalName} (Imported)`
      : originalName

  const snapshots = Array.isArray(inputWorkspace.snapshots)
    ? inputWorkspace.snapshots.map((snapshot) => ({
        ...snapshot,
        data: snapshot?.data ? createWorkspaceData(snapshot.data) : undefined,
      }))
    : []

  const timelineBase = Array.isArray(inputWorkspace.timeline) ? inputWorkspace.timeline : []
  const timeline = normalizeTimelineEvents(timelineBase, workspaceId)

  return {
    id: workspaceId,
    name,
    data: createWorkspaceData(inputWorkspace.data),
    snapshots,
    timeline,
  }
}

function createSnapshotId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createSnapshot(data) {
  const titleSource = data.question.trim() || '제목 없는 스냅샷'
  const snapshotData = createWorkspaceData(data)

  return {
    id: createSnapshotId(),
    title: titleSource.slice(0, 50),
    createdAt: new Date().toISOString(),
    data: snapshotData,
    question: data.question,
    finalPrompt: data.finalPrompt,
    gptResponse: data.gptResponse,
    claudeResponse: data.claudeResponse,
    geminiResponse: data.geminiResponse,
    consensus: data.consensus,
    conflict: data.conflict,
    uniqueInsight: data.uniqueInsight,
    humanDecision: data.humanDecision,
  }
}

function createTimelineEventId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `timeline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createClaimId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `claim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createGraphNodeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createGraphEdgeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `edge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createDecisionNodeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `decision-node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createDecisionNodeLinkId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `decision-link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createHypothesisId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `hypothesis-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createExperimentId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `experiment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createLearningId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `learning-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createEvolutionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `evolution-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createStrategyId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `strategy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createDecisionCycleId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `cycle-${crypto.randomUUID()}`
  }

  return `cycle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getTimelineCategory(type) {
  switch (type) {
    case 'prompt_created':
      return 'input'
    case 'model_response_updated':
      return 'model_response'
    case 'analysis_executed':
      return 'analysis'
    case 'human_decision_updated':
      return 'human_decision'
    case 'snapshot_saved':
      return 'snapshot'
    default:
      return 'input'
  }
}

function getTimelineCategoryLabel(category) {
  switch (category) {
    case 'input':
      return '입력'
    case 'model_response':
      return '모델 응답'
    case 'analysis':
      return '분석'
    case 'human_decision':
      return '인간 판단'
    case 'snapshot':
      return '스냅샷'
    default:
      return '기록'
  }
}

function createTimelineEvent({
  workspaceId,
  type,
  title,
  summary,
  relatedSnapshotId = null,
  cycleId = null,
  category,
}) {
  return {
    id: createTimelineEventId(),
    workspaceId,
    type,
    category: category || getTimelineCategory(type),
    title,
    summary,
    timestamp: new Date().toISOString(),
    relatedSnapshotId,
    cycleId,
  }
}

function normalizeTimelineEvents(timeline, workspaceId) {
  let activeCycleId = null

  return timeline.map((event, index) => {
    if (event.cycleId) {
      activeCycleId = event.cycleId
    } else if (event.type === 'prompt_created' || !activeCycleId) {
      activeCycleId = `legacy-cycle-${workspaceId}-${index}`
    }

    return {
      ...event,
      workspaceId: event.workspaceId || workspaceId,
      category: event.category || getTimelineCategory(event.type),
      cycleId: event.cycleId || activeCycleId,
    }
  })
}

function createInitialStorage() {
  const workspaces = projectTemplates.map((project) =>
    createWorkspace(project.name, {
      projectPrompt: project.projectPrompt,
      question: project.question,
    })
  )

  return {
    workspaces,
    activeWorkspaceId: workspaces[0].id,
  }
}

function readWorkspaceStorage() {
  if (typeof window === 'undefined') {
    return createInitialStorage()
  }

  const raw = window.localStorage.getItem(storageKey)

  if (!raw) {
    return createInitialStorage()
  }

  try {
    const parsed = JSON.parse(raw)

    if (
      !parsed ||
      !Array.isArray(parsed.workspaces) ||
      parsed.workspaces.length === 0
    ) {
      return createInitialStorage()
    }

    const workspaces = parsed.workspaces.map((workspace) => ({
      id: workspace.id,
      name: workspace.name || '이름 없는 작업공간',
      data: createWorkspaceData(workspace.data),
      snapshots: Array.isArray(workspace.snapshots) ? workspace.snapshots : [],
      timeline: normalizeTimelineEvents(
        Array.isArray(workspace.timeline) ? workspace.timeline : [],
        workspace.id
      ),
    }))

    const activeWorkspaceId =
      workspaces.find((workspace) => workspace.id === parsed.activeWorkspaceId)?.id ||
      workspaces[0].id

    return {
      workspaces,
      activeWorkspaceId,
    }
  } catch (error) {
    console.error('Workspace storage parse failed:', error)
    return createInitialStorage()
  }
}

function persistWorkspaceStorage(workspaces, activeWorkspaceId) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      workspaces,
      activeWorkspaceId,
    })
  )
}

function composePrompt(globalPrompt, projectPrompt, question) {
  return `공통 프롬프트:
${globalPrompt}

프로젝트 프롬프트:
${projectPrompt}

질문:
${question}`
}

function hasPromptInputs(workspaceData) {
  return [
    workspaceData.globalPrompt,
    workspaceData.projectPrompt,
    workspaceData.question,
  ].some((value) => value.trim())
}

function getEffectiveFinalPrompt(workspaceData) {
  return hasPromptInputs(workspaceData)
    ? composePrompt(
        workspaceData.globalPrompt,
        workspaceData.projectPrompt,
        workspaceData.question
      )
    : workspaceData.finalPrompt.trim()
}

function buildCliPacket({
  workspaceName,
  workspaceData,
  acceptedClaims,
  activeHypotheses,
  runningExperiments,
  latestLearnings,
  evolutions,
}) {
  const finalPrompt = getEffectiveFinalPrompt(workspaceData)

  const formatList = (items, fallback) =>
    items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : `- ${fallback}`

  return `# AVA Council CLI Packet

## Workspace
- Name: ${workspaceName}

## Current Question
${workspaceData.question.trim() || '질문 없음'}

## Final Prompt
\`\`\`
${finalPrompt.trim()}
\`\`\`

## Accepted Claims
${formatList(
    acceptedClaims.map((claim) => claim.text),
    'accepted claim 없음'
  )}

## Active Hypotheses
${formatList(
    activeHypotheses.map((hypothesis) =>
      `${hypothesis.title}${hypothesis.description ? ` — ${hypothesis.description}` : ''}`
    ),
    'active hypothesis 없음'
  )}

## Running Experiments
${formatList(
    runningExperiments.map((experiment) =>
      `${experiment.title}${experiment.expectedOutcome ? ` — expected: ${experiment.expectedOutcome}` : ''}`
    ),
    'running experiment 없음'
  )}

## Latest Learnings
${formatList(
    latestLearnings.map((learning) =>
      `${learning.title} [${learning.result}/${learning.impact}]${learning.nextAction ? ` — next: ${learning.nextAction}` : ''}`
    ),
    'learning 없음'
  )}

## Evolutions
${formatList(
    evolutions.map((evolution) =>
      `${evolution.type} — ${evolution.reason || 'reason 없음'}`
    ),
    'evolution 없음'
  )}

## Human Decision
${workspaceData.humanDecision.trim() || '인간 판단 없음'}
`
}

function buildOrchestrationPacket({
  workspaceName,
  workspaceData,
  providerSettings,
}) {
  const finalPrompt = getEffectiveFinalPrompt(workspaceData)

  return {
    workspaceName,
    question: workspaceData.question,
    finalPrompt,
    providers: Object.entries(providerSettings).map(([provider, config]) => ({
      provider,
      enabled: Boolean(config.enabled),
      modelName: config.modelName,
      role: config.role,
      temperature: Number(config.temperature),
      maxTokens: Number(config.maxTokens),
    })),
    generatedAt: new Date().toISOString(),
  }
}

function normalizeWords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word))
}

function getKeywordMap(text) {
  return normalizeWords(text).reduce((accumulator, word) => {
    accumulator[word] = (accumulator[word] || 0) + 1
    return accumulator
  }, {})
}

function extractSentences(text) {
  return text
    .split(/[\n.!?]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 24)
}

function pickTopKeywords(keywordMap, count = 4) {
  return Object.entries(keywordMap)
    .sort((left, right) => right[1] - left[1])
    .slice(0, count)
    .map(([word]) => word)
}

function buildConsensus(responseEntries) {
  const keywordMaps = responseEntries.map(([, text]) => getKeywordMap(text))
  const allWords = [...new Set(keywordMaps.flatMap((map) => Object.keys(map)))]

  const repeatedWords = allWords
    .map((word) => ({
      word,
      models: keywordMaps.filter((map) => map[word]).length,
      total: keywordMaps.reduce((sum, map) => sum + (map[word] || 0), 0),
    }))
    .filter((item) => item.models === keywordMaps.length)
    .sort((left, right) => right.total - left.total)
    .slice(0, 6)
    .map((item) => item.word)

  if (repeatedWords.length > 0) {
    return `세 모델에서 공통으로 반복된 핵심 키워드: ${repeatedWords.join(', ')}\n\n현재 응답은 위 키워드 축을 중심으로 같은 방향성을 보이고 있으므로, 이 부분을 1차 합의로 취급할 수 있습니다.`
  }

  const partialOverlap = allWords
    .map((word) => ({
      word,
      models: keywordMaps.filter((map) => map[word]).length,
      total: keywordMaps.reduce((sum, map) => sum + (map[word] || 0), 0),
    }))
    .filter((item) => item.models >= 2)
    .sort((left, right) => right.models - left.models || right.total - left.total)
    .slice(0, 6)
    .map((item) => item.word)

  if (partialOverlap.length > 0) {
    return `강한 3자 합의는 아직 없지만 부분적으로 겹치는 키워드가 있습니다: ${partialOverlap.join(', ')}\n\n질문을 더 구체화하거나 답변을 보강하면 합의 축이 더 선명해질 수 있습니다.`
  }

  return '아직 안정적인 합의를 찾지 못했습니다. 현재 답변은 공통 분모가 약하거나 방향이 충분히 구체적이지 않습니다.'
}

function buildConflict(responseEntries) {
  const findings = conflictSignals.flatMap((signal) => {
    const matches = responseEntries
      .map(([label, text]) => {
        const lowered = text.toLowerCase()
        const hasA = signal.a.some((token) => lowered.includes(token))
        const hasB = signal.b.some((token) => lowered.includes(token))

        if (hasA && !hasB) {
          return `${label}는 ${signal.a[0]} 쪽에 가깝습니다`
        }

        if (hasB && !hasA) {
          return `${label}는 ${signal.b[0]} 쪽에 가깝습니다`
        }

        return null
      })
      .filter(Boolean)

    return new Set(matches).size >= 2
      ? [`${signal.label}: ${matches.join('; ')}.`]
      : []
  })

  if (findings.length > 0) {
    return findings.join('\n\n')
  }

  return '현재 규칙 기준으로는 뚜렷한 방향 충돌이 감지되지 않았습니다. 지금 답변들은 상호 보완적일 가능성이 더 큽니다.'
}

function buildUniqueInsight(responseEntries) {
  const keywordMaps = Object.fromEntries(
    responseEntries.map(([label, text]) => [label, getKeywordMap(text)])
  )

  const sentences = Object.fromEntries(
    responseEntries.map(([label, text]) => [label, extractSentences(text)])
  )

  const notes = responseEntries.map(([label]) => {
    const otherWords = new Set(
      responseEntries
        .filter(([otherLabel]) => otherLabel !== label)
        .flatMap(([otherLabel]) => Object.keys(keywordMaps[otherLabel]))
    )

    const uniqueKeywords = pickTopKeywords(keywordMaps[label], 8).filter(
      (word) => !otherWords.has(word)
    )

    const highlightedSentence =
      sentences[label].find((sentence) =>
        uniqueKeywords.some((word) => sentence.toLowerCase().includes(word))
      ) || sentences[label][0]

    const detail = uniqueKeywords.length
      ? `고유 키워드: ${uniqueKeywords.slice(0, 4).join(', ')}.`
      : '두드러진 고유 키워드는 아직 적습니다.'

    return `${label}: ${detail}${highlightedSentence ? ` 대표 관점: ${highlightedSentence}.` : ''}`
  })

  return notes.join('\n\n')
}

function buildHumanDecision(consensus, conflict, uniqueInsight, currentDecision) {
  if (currentDecision.trim()) {
    return currentDecision
  }

  return `권장 판단 흐름:
1. 합의 영역에서 실제로 유지할 방향을 고릅니다.
2. 충돌 영역에서 어떤 트레이드오프를 채택할지 결정합니다.
3. 고유 통찰 중 최종 방향을 강화하는 요소를 선택합니다.

작업 요약:
- 합의: ${consensus.split('\n')[0]}
- 충돌: ${conflict.split('\n')[0]}
- 고유 통찰: ${uniqueInsight.split('\n')[0]}

최종 판단:
`
}

function summarizeText(text) {
  const normalized = text.replace(/\s+/g, ' ').trim()

  if (!normalized) {
    return '아직 입력 없음'
  }

  const sentence = normalized.split(/[.!?]/)[0].trim() || normalized
  const summary = sentence.length > 60 ? `${sentence.slice(0, 60)}...` : sentence

  return summary
}

const navigatorFieldLabels = new Set([
  '질문',
  '프롬프트',
  '제목',
  '입력',
  '공통 프롬프트',
  '프로젝트 프롬프트',
])

function pickNavigatorPreview(candidates) {
  const picked = candidates.find((value) => {
    if (!value || typeof value !== 'string') return false

    const text = value.trim()
    if (!text) return false
    if (navigatorFieldLabels.has(text)) return false

    return true
  })

  return picked ? summarizeText(picked) : '내용 없음'
}

function getNavigatorPreview(item, data, effectivePrompt) {
  switch (item.type) {
    case 'question':
      return pickNavigatorPreview([data.question, data.projectPrompt, data.globalPrompt])
    case 'finalPrompt':
      return pickNavigatorPreview([effectivePrompt, data.finalPrompt])
    case 'gptResponse':
      return pickNavigatorPreview([data.gptResponse])
    case 'claudeResponse':
      return pickNavigatorPreview([data.claudeResponse])
    case 'geminiResponse':
      return pickNavigatorPreview([data.geminiResponse])
    case 'consensus':
      return pickNavigatorPreview([data.consensus])
    case 'conflict':
      return pickNavigatorPreview([data.conflict])
    case 'uniqueInsight':
      return pickNavigatorPreview([data.uniqueInsight])
    case 'humanDecision':
      return pickNavigatorPreview([data.humanDecision])
    case 'decisionTools':
      return pickNavigatorPreview([
        data.humanDecision,
        data.strategies[0]?.title,
        data.decisionNodes.nodes[0]?.title,
      ])
    default:
      return '내용 없음'
  }
}

function getSectionSummary(type, data) {
  switch (type) {
    case 'question':
      return summarizeText(data.question)
    case 'finalPrompt':
      return summarizeText(data.finalPrompt)
    case 'gptResponse':
      return summarizeText(data.gptResponse)
    case 'claudeResponse':
      return summarizeText(data.claudeResponse)
    case 'geminiResponse':
      return summarizeText(data.geminiResponse)
    case 'consensus':
      return summarizeText(data.consensus)
    case 'conflict':
      return summarizeText(data.conflict)
    case 'uniqueInsight':
      return summarizeText(data.uniqueInsight)
    case 'humanDecision':
      return summarizeText(data.humanDecision)
    case 'decisionTools':
      return data.strategies.length > 0
        ? `${data.decisionNodes.nodes.length} nodes · ${data.strategies.length} strategies`
        : summarizeText(data.humanDecision)
    default:
      return '아직 입력 없음'
  }
}

function buildTimelineSummary(value, fallback) {
  const summary = summarizeText(value)
  return summary === '아직 입력 없음' ? fallback : summary
}

function createAnchorLabel(value) {
  const normalized = value.replace(/\s+/g, ' ').trim()

  if (!normalized) {
    return ''
  }

  return normalized.length > 80 ? `${normalized.slice(0, 80)}...` : normalized
}

function buildConversationAnchors(data) {
  const anchors = []

  const pushAnchor = ({ sourceId, sourceType, content, createdAt = '' }) => {
    const label = createAnchorLabel(content)

    if (!label) {
      return
    }

    anchors.push({
      id: `conversation-anchor-${sourceType}-${sourceId}`,
      sourceId,
      sourceType,
      label,
      summary: summarizeText(content),
      positionIndex: anchors.length,
      createdAt,
    })
  }

  pushAnchor({
    sourceId: 'question',
    sourceType: 'question',
    content: data.question,
  })

  ;[
    ['gptResponse', data.gptResponse],
    ['claudeResponse', data.claudeResponse],
    ['geminiResponse', data.geminiResponse],
  ].forEach(([sourceId, content]) => {
    pushAnchor({
      sourceId,
      sourceType: 'response',
      content,
    })
  })

  data.claims.forEach((claim) => {
    pushAnchor({
      sourceId: claim.id,
      sourceType: 'claim',
      content: claim.text,
      createdAt: claim.createdAt,
    })
  })

  data.hypotheses.forEach((hypothesis) => {
    pushAnchor({
      sourceId: hypothesis.id,
      sourceType: 'hypothesis',
      content: `${hypothesis.title} ${hypothesis.description}`,
      createdAt: hypothesis.createdAt,
    })
  })

  pushAnchor({
    sourceId: 'humanDecision',
    sourceType: 'judgement',
    content: data.humanDecision,
  })

  data.experiments.forEach((experiment) => {
    pushAnchor({
      sourceId: experiment.id,
      sourceType: 'experiment',
      content: `${experiment.title} ${experiment.description || experiment.expectedOutcome}`,
      createdAt: experiment.createdAt,
    })
  })

  return anchors
}

function getConversationAnchorTargetId(anchor) {
  switch (anchor.sourceType) {
    case 'question':
      return 'question-studio'
    case 'response':
      return anchor.sourceId
        .replace('gptResponse', 'gpt-response')
        .replace('claudeResponse', 'claude-response')
        .replace('geminiResponse', 'gemini-response')
    case 'claim':
      return `claim-${anchor.sourceId}`
    case 'hypothesis':
      return `hypothesis-${anchor.sourceId}`
    case 'judgement':
      return 'human-decision'
    case 'experiment':
      return `experiment-${anchor.sourceId}`
    default:
      return ''
  }
}

function getCurrentCycleId(timeline) {
  return [...timeline].reverse().find((event) => event.cycleId)?.cycleId || createDecisionCycleId()
}

function extractClaimSentences(text) {
  return text
    .split(/[\n.!?]+/)
    .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
    .filter((sentence) => sentence.length >= 28)
}

function createClaim({
  workspaceId,
  cycleId,
  source,
  text,
  linkedTimelineEventId = null,
}) {
  return {
    id: createClaimId(),
    workspaceId,
    cycleId,
    source,
    text,
    stance: 'unknown',
    status: 'pending',
    confidence: 'unknown',
    evidence: '',
    tags: [],
    decisionReason: '',
    decidedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    linkedTimelineEventId,
  }
}

function createGraphNode(workspaceId, claim) {
  return {
    id: createGraphNodeId(),
    workspaceId,
    cycleId: claim.cycleId,
    claimId: claim.id,
    source: claim.source,
    label: claim.text,
    stance: claim.stance,
    createdAt: new Date().toISOString(),
  }
}

function createGraphEdge(workspaceId, cycleId, fromClaimId, toClaimId, relation) {
  return {
    id: createGraphEdgeId(),
    workspaceId,
    cycleId,
    fromClaimId,
    toClaimId,
    relation,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function normalizeClaimText(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getTextSimilarity(left, right) {
  const leftNormalized = normalizeClaimText(left)
  const rightNormalized = normalizeClaimText(right)

  if (!leftNormalized || !rightNormalized) {
    return 0
  }

  if (leftNormalized === rightNormalized) {
    return 1
  }

  const leftTokens = new Set(leftNormalized.split(' '))
  const rightTokens = new Set(rightNormalized.split(' '))
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length
  const union = new Set([...leftTokens, ...rightTokens]).size

  return union > 0 ? intersection / union : 0
}

function buildDecisionGraphFromClaims(workspaceId, claims) {
  const nodes = claims.map((claim) => createGraphNode(workspaceId, claim))
  const edges = []
  const edgeKeys = new Set()

  const pushEdge = (fromClaimId, toClaimId, cycleId, relation) => {
    if (!fromClaimId || !toClaimId || fromClaimId === toClaimId) {
      return
    }

    const key = [fromClaimId, toClaimId].sort().join(':')

    if (edgeKeys.has(key)) {
      return
    }

    edgeKeys.add(key)
    edges.push(createGraphEdge(workspaceId, cycleId, fromClaimId, toClaimId, relation))
  }

  for (let index = 0; index < claims.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < claims.length; otherIndex += 1) {
      const left = claims[index]
      const right = claims[otherIndex]

      if (left.cycleId !== right.cycleId) {
        continue
      }

      const similarity = getTextSimilarity(left.text, right.text)

      if (similarity >= 0.82) {
        pushEdge(left.id, right.id, left.cycleId, 'duplicates')
        continue
      }

      if (
        (left.stance === 'support' && right.stance === 'oppose') ||
        (left.stance === 'oppose' && right.stance === 'support')
      ) {
        pushEdge(left.id, right.id, left.cycleId, 'contradicts')
      }
    }
  }

  const claimsBySourceAndCycle = claims.reduce((accumulator, claim) => {
    const key = `${claim.cycleId}:${claim.source}`
    accumulator[key] = accumulator[key] || []
    accumulator[key].push(claim)
    return accumulator
  }, {})

  Object.values(claimsBySourceAndCycle).forEach((group) => {
    const sorted = [...group].sort(
      (left, right) => new Date(left.createdAt) - new Date(right.createdAt)
    )

    for (let index = 1; index < sorted.length; index += 1) {
      pushEdge(
        sorted[index - 1].id,
        sorted[index].id,
        sorted[index].cycleId,
        'refines'
      )
    }
  })

  const claimsByCycle = claims.reduce((accumulator, claim) => {
    accumulator[claim.cycleId] = accumulator[claim.cycleId] || []
    accumulator[claim.cycleId].push(claim)
    return accumulator
  }, {})

  Object.values(claimsByCycle).forEach((group) => {
    const sorted = [...group].sort(
      (left, right) => new Date(left.createdAt) - new Date(right.createdAt)
    )

    for (let index = 1; index < sorted.length; index += 1) {
      const left = sorted[index - 1]
      const right = sorted[index]
      const key = [left.id, right.id].sort().join(':')

      if (!edgeKeys.has(key)) {
        pushEdge(left.id, right.id, left.cycleId, 'unknown')
      }
    }
  })

  return { nodes, edges }
}

function getRelationLabel(relation) {
  switch (relation) {
    case 'supports':
      return 'supports'
    case 'contradicts':
      return 'contradicts'
    case 'refines':
      return 'refines'
    case 'duplicates':
      return 'duplicates'
    default:
      return 'unknown'
  }
}

function getClaimStatusLabel(status) {
  switch (status) {
    case 'accepted':
      return 'accepted'
    case 'rejected':
      return 'rejected'
    default:
      return 'pending'
  }
}

function getHypothesisStatusLabel(status) {
  switch (status) {
    case 'validated':
      return 'validated'
    case 'invalidated':
      return 'invalidated'
    case 'archived':
      return 'archived'
    default:
      return 'active'
  }
}

function getExperimentStatusLabel(status) {
  switch (status) {
    case 'running':
      return 'running'
    case 'completed':
      return 'completed'
    case 'failed':
      return 'failed'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'planned'
  }
}

function getLearningResultLabel(result) {
  switch (result) {
    case 'validated':
      return 'validated'
    case 'invalidated':
      return 'invalidated'
    case 'partial':
      return 'partial'
    default:
      return 'inconclusive'
  }
}

function getLearningImpactLabel(impact) {
  switch (impact) {
    case 'high':
      return 'high'
    case 'low':
      return 'low'
    default:
      return 'medium'
  }
}

function getEvolutionTypeLabel(type) {
  switch (type) {
    case 'pivot':
      return 'pivot'
    case 'expand':
      return 'expand'
    case 'retire':
      return 'retire'
    default:
      return 'refine'
  }
}

function getStrategyStatusLabel(status) {
  switch (status) {
    case 'active':
      return 'active'
    case 'paused':
      return 'paused'
    case 'selected':
      return 'selected'
    case 'rejected':
      return 'rejected'
    default:
      return 'draft'
  }
}

function shouldSkipTimelineEvent(timeline, nextEvent) {
  const lastEvent = [...timeline]
    .reverse()
    .find(
      (event) =>
        event.type === nextEvent.type &&
        event.cycleId === nextEvent.cycleId
    )

  if (!lastEvent) {
    return false
  }

  return (
    lastEvent.summary === nextEvent.summary &&
    lastEvent.relatedSnapshotId === nextEvent.relatedSnapshotId
  )
}

function groupTimelineCycles(timeline) {
  const groups = new Map()

  timeline.forEach((event) => {
    const existing = groups.get(event.cycleId) || {
      id: event.cycleId,
      events: [],
      startedAt: event.timestamp,
      updatedAt: event.timestamp,
    }

    existing.events.push(event)
    existing.startedAt = existing.events[0]?.timestamp || event.timestamp
    existing.updatedAt = event.timestamp

    groups.set(event.cycleId, existing)
  })

  return [...groups.values()]
    .map((group) => ({
      ...group,
      events: [...group.events].sort(
        (left, right) => new Date(left.timestamp) - new Date(right.timestamp)
      ),
    }))
    .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
}

export default function App() {
  const initialStorage = readWorkspaceStorage()
  const [workspaces, setWorkspaces] = useState(initialStorage.workspaces)
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(
    initialStorage.activeWorkspaceId
  )
  const [copiedPanel, setCopiedPanel] = useState('')
  const [workspaceNotice, setWorkspaceNotice] = useState('작업공간이 준비되었습니다.')
  const [activeSectionId, setActiveSectionId] = useState(navigatorItems[0].id)
  const [hasUsedNavigator, setHasUsedNavigator] = useState(false)
  const [navigatorSectionIds, setNavigatorSectionIds] = useState(
    navigatorItems.map((item) => item.id)
  )
  const [showAllTimeline, setShowAllTimeline] = useState(false)
  const [graphBuildFeedback, setGraphBuildFeedback] = useState('')
  const [hypothesisError, setHypothesisError] = useState('')
  const [experimentError, setExperimentError] = useState('')
  const [hypothesisDraft, setHypothesisDraft] = useState({
    title: '',
    description: '',
    confidence: 'unknown',
  })
  const [experimentDraft, setExperimentDraft] = useState({
    title: '',
    description: '',
    expectedOutcome: '',
    linkedHypothesisIds: [],
  })
  const [learningDraft, setLearningDraft] = useState({
    experimentId: '',
    hypothesisId: '',
    title: '',
    summary: '',
    result: 'inconclusive',
    impact: 'medium',
    nextAction: '',
  })
  const [evolutionDraft, setEvolutionDraft] = useState({
    learningId: '',
    type: 'refine',
    reason: '',
    createHypothesis: true,
    evolvedHypothesisTitle: '',
    evolvedHypothesisDescription: '',
    evolvedHypothesisConfidence: 'medium',
    nextExperimentTitle: '',
    nextExperimentDescription: '',
    nextExperimentExpectedOutcome: '',
    createNextExperiment: false,
  })
  const [decisionToolTab, setDecisionToolTab] = useState('graph')
  const [decisionNodeDraft, setDecisionNodeDraft] = useState({
    title: '',
    description: '',
    type: 'decision',
    confidence: 'medium',
  })
  const [decisionNodeLinkDraft, setDecisionNodeLinkDraft] = useState({
    fromNodeId: '',
    toNodeId: '',
    relation: 'supports',
  })
  const [strategyDraft, setStrategyDraft] = useState({
    title: '',
    description: '',
    linkedDecisionNodeIds: [],
  })
  const [isConversationMinimapExpanded, setIsConversationMinimapExpanded] =
    useState(false)
  const fieldFocusValuesRef = useRef({})
  const claimFocusValuesRef = useRef({})
  const learningFocusValuesRef = useRef({})
  const importWorkspaceInputRef = useRef(null)
  const mainScrollRef = useRef(null)
  const sectionTitleRefs = useRef({})
  const conversationMinimapRef = useRef(null)

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ||
    workspaces[0]

  const getSectionTopInContainer = (sectionId) => {
    const container = mainScrollRef.current
    const element = sectionTitleRefs.current[sectionId]

    if (!container || !element) {
      return 0
    }

    const containerRect = container.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()

    return elementRect.top - containerRect.top + container.scrollTop
  }

  const updateActiveNavigatorSection = () => {
    const container = mainScrollRef.current

    if (!container) {
      return
    }

    const candidates = navigatorItems
      .map((item) => {
        const element = sectionTitleRefs.current[item.id]

        if (!element) {
          return null
        }

        return {
          id: item.id,
          topInContainer: getSectionTopInContainer(item.id),
          rectTop: element.getBoundingClientRect().top,
        }
      })
      .filter(Boolean)

    if (candidates.length === 0) {
      return
    }

    const orderedCandidates = [...candidates].sort(
      (left, right) => left.topInContainer - right.topInContainer
    )
    const orderedIds = orderedCandidates.map((item) => item.id)

    setNavigatorSectionIds((current) => {
      if (
        current.length === orderedIds.length &&
        current.every((id, index) => id === orderedIds[index])
      ) {
        return current
      }

      return orderedIds
    })

    const activationLine = container.getBoundingClientRect().top + 96
    let nextActive = orderedCandidates[0]

    orderedCandidates.forEach((item) => {
      if (item.rectTop <= activationLine) {
        nextActive = item
      }
    })

    if (nextActive?.id) {
      setActiveSectionId(nextActive.id)
    }
  }

  const activeWorkspaceName = activeWorkspace?.name || '작업공간'
  const workspaceData = activeWorkspace?.data || createWorkspaceData()
  const workspaceSnapshots = activeWorkspace?.snapshots || []
  const workspaceTimeline = activeWorkspace?.timeline || []
  const latestSnapshot = workspaceSnapshots[0] || null
  const effectiveFinalPrompt = useMemo(
    () => getEffectiveFinalPrompt(workspaceData),
    [
      workspaceData.finalPrompt,
      workspaceData.globalPrompt,
      workspaceData.projectPrompt,
      workspaceData.question,
    ]
  )
  const decisionStateSummary = useMemo(() => {
    const accepted = workspaceData.claims.filter((claim) => claim.status === 'accepted')
    const rejected = workspaceData.claims.filter((claim) => claim.status === 'rejected')
    const pending = workspaceData.claims.filter((claim) => claim.status === 'pending')
    const latestAccepted = [...accepted].sort(
      (left, right) => new Date(right.updatedAt) - new Date(left.updatedAt)
    )[0]

    return {
      acceptedCount: accepted.length,
      rejectedCount: rejected.length,
      pendingCount: pending.length,
      latestAccepted:
        latestAccepted?.text || '아직 accepted 상태의 클레임이 없습니다.',
    }
  }, [workspaceData.claims])
  const activeHypotheses = useMemo(
    () => workspaceData.hypotheses.filter((hypothesis) => hypothesis.status === 'active'),
    [workspaceData.hypotheses]
  )
  const activeExperiments = useMemo(
    () =>
      workspaceData.experiments.filter((experiment) =>
        ['planned', 'running'].includes(experiment.status)
      ),
    [workspaceData.experiments]
  )
  const groupedExperimentsByStatus = useMemo(() => {
    const order = ['planned', 'running', 'completed', 'failed', 'cancelled']

    return order.map((status) => ({
      status,
      label: getExperimentStatusLabel(status),
      experiments: workspaceData.experiments.filter(
        (experiment) => experiment.status === status
      ),
    }))
  }, [workspaceData.experiments])
  const eligibleLearningExperiments = useMemo(
    () =>
      workspaceData.experiments.filter((experiment) =>
        ['completed', 'failed'].includes(experiment.status)
      ),
    [workspaceData.experiments]
  )
  const groupedLearningsByResult = useMemo(() => {
    const order = ['validated', 'partial', 'inconclusive', 'invalidated']

    return order.map((result) => ({
      result,
      label: getLearningResultLabel(result),
      learnings: workspaceData.learnings.filter((learning) => learning.result === result),
    }))
  }, [workspaceData.learnings])
  const latestLearningSummary = useMemo(() => {
    const latest = [...workspaceData.learnings].sort(
      (left, right) => new Date(right.updatedAt) - new Date(left.updatedAt)
    )[0]

    return {
      title: latest?.title || '아직 학습 기록이 없습니다.',
      nextAction: latest?.nextAction || '다음 액션이 아직 정리되지 않았습니다.',
      result: latest?.result || 'inconclusive',
    }
  }, [workspaceData.learnings])
  const dashboardSummary = useMemo(
    () => ({
      claims: workspaceData.claims.length,
      acceptedClaims: decisionStateSummary.acceptedCount,
      activeHypotheses: activeHypotheses.length,
      runningExperiments: workspaceData.experiments.filter((experiment) =>
        ['planned', 'running'].includes(experiment.status)
      ).length,
      latestLearning: latestLearningSummary.title,
      evolutions: workspaceData.evolutions.length,
    }),
    [
      workspaceData.claims.length,
      workspaceData.experiments,
      workspaceData.evolutions.length,
      decisionStateSummary.acceptedCount,
      activeHypotheses.length,
      latestLearningSummary.title,
    ]
  )
  const recentLearnings = useMemo(
    () =>
      [...workspaceData.learnings]
        .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
        .slice(0, 3),
    [workspaceData.learnings]
  )
  const latestEvolutionSummary = useMemo(() => {
    const latest = [...workspaceData.evolutions].sort(
      (left, right) => new Date(right.updatedAt) - new Date(left.updatedAt)
    )[0]

    return latest?.reason || '아직 진화 기록이 없습니다.'
  }, [workspaceData.evolutions])
  const generatedConversationAnchors = useMemo(
    () => buildConversationAnchors(workspaceData),
    [
      workspaceData.question,
      workspaceData.gptResponse,
      workspaceData.claudeResponse,
      workspaceData.geminiResponse,
      workspaceData.claims,
      workspaceData.hypotheses,
      workspaceData.humanDecision,
      workspaceData.experiments,
    ]
  )
  const groupedDecisionNodeLinks = useMemo(() => {
    const order = ['supports', 'contradicts', 'depends_on', 'replaces']

    return order
      .map((relation) => ({
        relation,
        label: relation,
        links: workspaceData.decisionNodes.links.filter(
          (link) => link.relation === relation
        ),
      }))
      .filter((group) => group.links.length > 0)
  }, [workspaceData.decisionNodes.links])
  const groupedStrategiesByStatus = useMemo(() => {
    const order = ['draft', 'active', 'paused', 'selected', 'rejected']

    return order.map((status) => ({
      status,
      label: getStrategyStatusLabel(status),
      strategies: workspaceData.strategies.filter(
        (strategy) => strategy.status === status
      ),
    }))
  }, [workspaceData.strategies])
  const orchestrationPlan = useMemo(
    () =>
      buildOrchestrationPacket({
        workspaceName: activeWorkspaceName,
        workspaceData,
        providerSettings: workspaceData.providerSettings,
      }),
    [activeWorkspaceName, workspaceData]
  )
  const enabledProviders = useMemo(
    () => orchestrationPlan.providers.filter((provider) => provider.enabled),
    [orchestrationPlan]
  )
  const eligibleEvolutionLearnings = useMemo(
    () => workspaceData.learnings,
    [workspaceData.learnings]
  )
  const evolutionChains = useMemo(() => {
    return [...workspaceData.evolutions]
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .map((evolution) => {
        const learning = workspaceData.learnings.find((item) => item.id === evolution.learningId)
        const experiment = workspaceData.experiments.find(
          (item) => item.id === learning?.experimentId
        )
        const fromHypothesis = workspaceData.hypotheses.find(
          (item) => item.id === evolution.fromHypothesisId
        )
        const toHypothesis = workspaceData.hypotheses.find(
          (item) => item.id === evolution.toHypothesisId
        )
        const nextExperiment = workspaceData.experiments.find(
          (item) => item.id === evolution.nextExperimentId
        )

        return {
          evolution,
          learning,
          experiment,
          fromHypothesis,
          toHypothesis,
          nextExperiment,
        }
      })
  }, [
    workspaceData.evolutions,
    workspaceData.learnings,
    workspaceData.experiments,
    workspaceData.hypotheses,
  ])
  const acceptedClaims = useMemo(
    () => workspaceData.claims.filter((claim) => claim.status === 'accepted'),
    [workspaceData.claims]
  )
  const cliPacket = useMemo(
    () =>
      buildCliPacket({
        workspaceName: activeWorkspaceName,
        workspaceData,
        acceptedClaims,
        activeHypotheses,
        runningExperiments: activeExperiments,
        latestLearnings: recentLearnings,
        evolutions: [...workspaceData.evolutions]
          .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
          .slice(0, 5),
      }),
    [
      activeWorkspaceName,
      workspaceData,
      acceptedClaims,
      activeHypotheses,
      activeExperiments,
      recentLearnings,
      workspaceData.evolutions,
    ]
  )
  const hypothesisMetrics = useMemo(() => {
    return workspaceData.hypotheses.reduce((accumulator, hypothesis) => {
      const linkedClaims = workspaceData.claims.filter((claim) =>
        hypothesis.linkedClaimIds.includes(claim.id)
      )
      const supportingCount = linkedClaims.filter((claim) => claim.status === 'accepted').length
      const contradictingCount = linkedClaims.filter(
        (claim) => claim.status === 'rejected'
      ).length

      accumulator[hypothesis.id] = {
        supportingCount,
        contradictingCount,
      }

      return accumulator
    }, {})
  }, [workspaceData.claims, workspaceData.hypotheses])
  const latestHypothesisSummary = useMemo(() => {
    const latest = [...workspaceData.hypotheses].sort(
      (left, right) => new Date(right.updatedAt) - new Date(left.updatedAt)
    )[0]

    return latest?.title || '아직 가설이 없습니다.'
  }, [workspaceData.hypotheses])
  const groupedClaimsByStatus = useMemo(() => {
    const order = ['accepted', 'pending', 'rejected']

    return order.map((status) => ({
      status,
      label: getClaimStatusLabel(status),
      claims: workspaceData.claims.filter((claim) => claim.status === status),
    }))
  }, [workspaceData.claims])
  const groupedGraphNodes = useMemo(() => {
    const order = ['gpt', 'claude', 'gemini', 'consensus', 'conflict', 'insight', 'human']
    const labels = {
      gpt: 'GPT',
      claude: 'Claude',
      gemini: 'Gemini',
      consensus: '합의',
      conflict: '충돌',
      insight: '고유 통찰',
      human: '인간 판단',
    }

    return order
      .map((source) => ({
        source,
        label: labels[source],
        nodes: workspaceData.decisionGraph.nodes.filter((node) => node.source === source),
      }))
      .filter((group) => group.nodes.length > 0)
  }, [workspaceData.decisionGraph.nodes])
  const groupedGraphEdges = useMemo(() => {
    const order = ['duplicates', 'contradicts', 'refines', 'unknown', 'supports']

    return order
      .map((relation) => ({
        relation,
        label: getRelationLabel(relation),
        edges: workspaceData.decisionGraph.edges.filter((edge) => edge.relation === relation),
      }))
      .filter((group) => group.edges.length > 0)
  }, [workspaceData.decisionGraph.edges])
  const groupedClaims = useMemo(() => {
    const order = ['gpt', 'claude', 'gemini', 'consensus', 'conflict', 'insight', 'human']
    const labels = {
      gpt: 'GPT',
      claude: 'Claude',
      gemini: 'Gemini',
      consensus: '합의',
      conflict: '충돌',
      insight: '고유 통찰',
      human: '인간 판단',
    }

    return order
      .map((source) => ({
        source,
        label: labels[source],
        claims: workspaceData.claims.filter((claim) => claim.source === source),
      }))
      .filter((group) => group.claims.length > 0)
  }, [workspaceData.claims])

  const visibleTimelineEvents = useMemo(
    () =>
      showAllTimeline
        ? workspaceTimeline
        : workspaceTimeline.slice(Math.max(workspaceTimeline.length - 10, 0)),
    [showAllTimeline, workspaceTimeline]
  )

  const timelineCycles = useMemo(
    () => groupTimelineCycles(visibleTimelineEvents),
    [visibleTimelineEvents]
  )

  const latestDecisionState = useMemo(() => {
    const latestHumanDecision = [...workspaceTimeline]
      .reverse()
      .find((event) => event.category === 'human_decision')
    const latestAnalysis = [...workspaceTimeline]
      .reverse()
      .find((event) => event.category === 'analysis')
    const latestSnapshotEvent = [...workspaceTimeline]
      .reverse()
      .find((event) => event.category === 'snapshot')

    return {
      question: buildTimelineSummary(
        workspaceData.question,
        '아직 질문이 정리되지 않았습니다.'
      ),
      models: [
        workspaceData.gptResponse,
        workspaceData.claudeResponse,
        workspaceData.geminiResponse,
      ].filter((value) => value.trim()).length,
      analysis: latestAnalysis?.summary || '아직 분석 기록이 없습니다.',
      decision:
        latestHumanDecision?.summary ||
        buildTimelineSummary(
          workspaceData.humanDecision,
          '아직 인간 판단이 기록되지 않았습니다.'
        ),
      snapshotLabel: latestSnapshotEvent?.relatedSnapshotId
        ? '현재 상태 스냅샷 보관'
        : '스냅샷 없음',
    }
  }, [workspaceData, workspaceTimeline])

  useEffect(() => {
    persistWorkspaceStorage(workspaces, activeWorkspaceId)
  }, [workspaces, activeWorkspaceId])

  useEffect(() => {
    if (
      JSON.stringify(workspaceData.conversationAnchors) ===
      JSON.stringify(generatedConversationAnchors)
    ) {
      return
    }

    updateActiveWorkspace({
      conversationAnchors: generatedConversationAnchors,
    })
  }, [generatedConversationAnchors, workspaceData.conversationAnchors])

  useEffect(() => {
    setShowAllTimeline(false)
    setGraphBuildFeedback('')
  }, [activeWorkspaceId])

  useEffect(() => {
    if (!isConversationMinimapExpanded) {
      return undefined
    }

    const handlePointerDown = (event) => {
      const minimap = conversationMinimapRef.current
      if (!minimap || minimap.contains(event.target)) {
        return
      }

      setIsConversationMinimapExpanded(false)
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
    }
  }, [isConversationMinimapExpanded])

  useEffect(() => {
    setHypothesisDraft({
      title: '',
      description: '',
      confidence: 'unknown',
    })
    setHypothesisError('')
    setExperimentDraft({
      title: '',
      description: '',
      expectedOutcome: '',
      linkedHypothesisIds: [],
    })
    setExperimentError('')
    setLearningDraft({
      experimentId: '',
      hypothesisId: '',
      title: '',
      summary: '',
      result: 'inconclusive',
      impact: 'medium',
      nextAction: '',
    })
    setEvolutionDraft({
      learningId: '',
      type: 'refine',
      reason: '',
      createHypothesis: true,
      evolvedHypothesisTitle: '',
      evolvedHypothesisDescription: '',
      evolvedHypothesisConfidence: 'medium',
      nextExperimentTitle: '',
      nextExperimentDescription: '',
      nextExperimentExpectedOutcome: '',
      createNextExperiment: false,
    })
    setDecisionToolTab('graph')
    setDecisionNodeDraft({
      title: '',
      description: '',
      type: 'decision',
      confidence: 'medium',
    })
    setDecisionNodeLinkDraft({
      fromNodeId: '',
      toNodeId: '',
      relation: 'supports',
    })
    setStrategyDraft({
      title: '',
      description: '',
      linkedDecisionNodeIds: [],
    })
  }, [activeWorkspaceId])

  useEffect(() => {
    if (eligibleLearningExperiments.length === 0) {
      setLearningDraft((current) => ({
        ...current,
        experimentId: '',
        hypothesisId: '',
      }))
      return
    }

    setLearningDraft((current) => {
      const currentExperiment = eligibleLearningExperiments.find(
        (experiment) => experiment.id === current.experimentId
      )
      const experiment = currentExperiment || eligibleLearningExperiments[0]
      const linkedHypothesisIds = experiment?.linkedHypothesisIds || []
      const hypothesisId = linkedHypothesisIds.includes(current.hypothesisId)
        ? current.hypothesisId
        : linkedHypothesisIds[0] || ''

      if (
        current.experimentId === experiment.id &&
        current.hypothesisId === hypothesisId
      ) {
        return current
      }

      return {
        ...current,
        experimentId: experiment.id,
        hypothesisId,
      }
    })
  }, [eligibleLearningExperiments])

  useEffect(() => {
    if (eligibleEvolutionLearnings.length === 0) {
      setEvolutionDraft((current) => ({
        ...current,
        learningId: '',
      }))
      return
    }

    setEvolutionDraft((current) => {
      if (
        current.learningId &&
        eligibleEvolutionLearnings.some((learning) => learning.id === current.learningId)
      ) {
        return current
      }

      const learning = eligibleEvolutionLearnings[0]
      return {
        ...current,
        learningId: learning.id,
        evolvedHypothesisTitle:
          current.evolvedHypothesisTitle || `${learning.title} 후속 가설`,
        nextExperimentTitle:
          current.nextExperimentTitle || `${learning.title} 후속 실험`,
      }
    })
  }, [eligibleEvolutionLearnings])

  useEffect(() => {
    const container = mainScrollRef.current

    if (!container) {
      return undefined
    }

    let ticking = false
    const handleScroll = () => {
      if (ticking) {
        return
      }

      ticking = true
      requestAnimationFrame(() => {
        updateActiveNavigatorSection()
        ticking = false
      })
    }

    updateActiveNavigatorSection()
    container.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [activeWorkspaceId])

  const updateActiveWorkspace = (updater) => {
    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.id === activeWorkspaceId
          ? {
              ...workspace,
              ...(typeof updater === 'function'
                ? updater(workspace)
                : { data: { ...workspace.data, ...updater } }),
            }
          : workspace
      )
    )
  }

  const updateField = (field, value) => {
    updateActiveWorkspace({ [field]: value })
  }

  const appendTimelineEvent = (eventInput) => {
    let createdEvent = null

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      timeline: (() => {
        const nextEvent = createTimelineEvent({
          workspaceId: workspace.id,
          ...eventInput,
        })

        if (shouldSkipTimelineEvent(workspace.timeline, nextEvent)) {
          return workspace.timeline
        }

        createdEvent = nextEvent
        return [...workspace.timeline, nextEvent]
      })(),
    }))

    return createdEvent
  }

  const handleBuildPrompt = () => {
    const finalPrompt = composePrompt(
      workspaceData.globalPrompt,
      workspaceData.projectPrompt,
      workspaceData.question
    )
    const summary = buildTimelineSummary(
      workspaceData.question || finalPrompt,
      '질문 스튜디오에서 최종 프롬프트를 생성했습니다.'
    )
    const cycleId = createDecisionCycleId()

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        finalPrompt,
      },
      timeline: (() => {
        const nextEvent = createTimelineEvent({
          workspaceId: workspace.id,
          type: 'prompt_created',
          title: '프롬프트 생성',
          summary,
          cycleId,
        })

        if (
          shouldSkipTimelineEvent(
            workspace.timeline,
            {
              ...nextEvent,
              cycleId:
                [...workspace.timeline].reverse().find((event) => event.type === 'prompt_created')
                  ?.cycleId || cycleId,
            }
          )
        ) {
          return workspace.timeline
        }

        return [...workspace.timeline, nextEvent]
      })(),
    }))
    setWorkspaceNotice(`"${activeWorkspaceName}"의 프롬프트를 만들었습니다.`)
  }

  const handleAnalyzeCouncil = () => {
    const responseEntries = [
      ['GPT', workspaceData.gptResponse],
      ['Claude', workspaceData.claudeResponse],
      ['Gemini', workspaceData.geminiResponse],
    ]

    const consensus = buildConsensus(responseEntries)
    const conflict = buildConflict(responseEntries)
    const uniqueInsight = buildUniqueInsight(responseEntries)
    const humanDecision = buildHumanDecision(
      consensus,
      conflict,
      uniqueInsight,
      workspaceData.humanDecision
    )
    const currentCycleId = getCurrentCycleId(workspaceTimeline)

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        consensus,
        conflict,
        uniqueInsight,
        humanDecision,
      },
      timeline: (() => {
        const nextEvent = createTimelineEvent({
          workspaceId: workspace.id,
          type: 'analysis_executed',
          title: '카운슬 분석 실행',
          summary: buildTimelineSummary(
            `${consensus} ${conflict} ${uniqueInsight}`,
            '세 모델 응답을 비교해 합의와 충돌을 정리했습니다.'
          ),
          cycleId: currentCycleId,
        })

        if (shouldSkipTimelineEvent(workspace.timeline, nextEvent)) {
          return workspace.timeline
        }

        return [...workspace.timeline, nextEvent]
      })(),
    }))
    setWorkspaceNotice(`"${activeWorkspaceName}"의 분석 결과를 갱신했습니다.`)
  }

  const handleCopyPrompt = async (label) => {
    try {
      await navigator.clipboard.writeText(effectiveFinalPrompt)
      setCopiedPanel(label)
      setWorkspaceNotice(`${label}용 프롬프트를 복사했습니다.`)
      window.setTimeout(() => setCopiedPanel(''), 1800)
    } catch (error) {
      console.error('Clipboard write failed:', error)
      setWorkspaceNotice('클립보드 복사에 실패했습니다.')
    }
  }

  const handleSaveSnapshot = () => {
    const snapshot = createSnapshot(workspaceData)
    const currentCycleId = getCurrentCycleId(workspaceTimeline)

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      snapshots: [snapshot, ...workspace.snapshots],
      timeline: (() => {
        const nextEvent = createTimelineEvent({
          workspaceId: workspace.id,
          type: 'snapshot_saved',
          title: '스냅샷 저장',
          summary: buildTimelineSummary(
            snapshot.humanDecision || snapshot.question,
            '현재 판단 상태를 스냅샷으로 저장했습니다.'
          ),
          relatedSnapshotId: snapshot.id,
          cycleId: currentCycleId,
        })

        if (shouldSkipTimelineEvent(workspace.timeline, nextEvent)) {
          return workspace.timeline
        }

        return [...workspace.timeline, nextEvent]
      })(),
    }))
    setWorkspaceNotice('스냅샷 저장 완료')
  }

  const handleFieldFocus = (field) => {
    fieldFocusValuesRef.current[field] = workspaceData[field]
  }

  const handleFieldCommit = (field, type, title, fallbackSummary) => {
    const previousValue = fieldFocusValuesRef.current[field] || ''
    const nextValue = workspaceData[field] || ''

    if (previousValue.trim() === nextValue.trim()) {
      return
    }

    appendTimelineEvent({
      type,
      category: getTimelineCategory(type),
      title,
      summary: buildTimelineSummary(nextValue, fallbackSummary),
      cycleId:
        getCurrentCycleId(workspaceTimeline),
    })
  }

  const handleExtractClaims = () => {
    const sourceEntries = [
      ['gpt', workspaceData.gptResponse],
      ['claude', workspaceData.claudeResponse],
      ['gemini', workspaceData.geminiResponse],
      ['consensus', workspaceData.consensus],
      ['conflict', workspaceData.conflict],
      ['insight', workspaceData.uniqueInsight],
      ['human', workspaceData.humanDecision],
    ]

    const currentCycleId = getCurrentCycleId(workspaceTimeline)
    const extracted = sourceEntries.flatMap(([source, text]) =>
      extractClaimSentences(text).map((sentence) => ({ source, text: sentence }))
    )

    const existingKeys = new Set(
      workspaceData.claims.map(
        (claim) => `${claim.source}:${claim.text.trim().toLowerCase()}`
      )
    )

    const uniqueExtracted = extracted.filter((claim) => {
      const key = `${claim.source}:${claim.text.trim().toLowerCase()}`

      if (existingKeys.has(key)) {
        return false
      }

      existingKeys.add(key)
      return true
    })

    if (uniqueExtracted.length === 0) {
      setWorkspaceNotice('새로 추출할 클레임이 없습니다.')
      return
    }

    const timelineEvent = createTimelineEvent({
      workspaceId: activeWorkspaceId,
      type: 'claims_extracted',
      title: '클레임 추출',
      summary: `${uniqueExtracted.length}개의 클레임을 로컬 규칙 기반으로 추출했습니다.`,
      category: 'analysis',
      cycleId: currentCycleId,
    })

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        claims: [
          ...workspace.data.claims,
          ...uniqueExtracted.map((claim) =>
            createClaim({
              workspaceId: workspace.id,
              cycleId: currentCycleId,
              source: claim.source,
              text: claim.text,
              linkedTimelineEventId: timelineEvent.id,
            })
          ),
        ],
      },
      timeline: shouldSkipTimelineEvent(workspace.timeline, timelineEvent)
        ? workspace.timeline
        : [...workspace.timeline, timelineEvent],
    }))

    setWorkspaceNotice(`${uniqueExtracted.length}개의 클레임을 추출했습니다.`)
  }

  const handleClaimFocus = (claim) => {
    claimFocusValuesRef.current[claim.id] = {
      text: claim.text,
      stance: claim.stance,
      decisionReason: claim.decisionReason,
    }
  }

  const handleClaimTextChange = (claimId, value) => {
    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        claims: workspace.data.claims.map((claim) =>
          claim.id === claimId
            ? {
                ...claim,
                text: value,
                updatedAt: new Date().toISOString(),
              }
            : claim
        ),
        decisionGraph: {
          ...workspace.data.decisionGraph,
          nodes: workspace.data.decisionGraph.nodes.map((node) =>
            node.claimId === claimId
              ? {
                  ...node,
                  label: value,
                }
              : node
          ),
        },
      },
    }))
  }

  const handleClaimStanceChange = (claimId, stance) => {
    const claim = workspaceData.claims.find((item) => item.id === claimId)

    if (!claim || claim.stance === stance) {
      return
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        claims: workspace.data.claims.map((item) =>
          item.id === claimId
            ? {
                ...item,
                stance,
                updatedAt: new Date().toISOString(),
              }
            : item
        ),
        decisionGraph: {
          ...workspace.data.decisionGraph,
          nodes: workspace.data.decisionGraph.nodes.map((node) =>
            node.claimId === claimId
              ? {
                  ...node,
                  stance,
                }
              : node
          ),
        },
      },
    }))

    appendTimelineEvent({
      type: 'claim_edited',
      category: 'analysis',
      title: '클레임 입장 수정',
      summary: `"${buildTimelineSummary(claim.text, '클레임')}"의 입장을 ${stance}로 변경했습니다.`,
      cycleId: claim.cycleId || getCurrentCycleId(workspaceTimeline),
    })
  }

  const handleClaimBlur = (claimId) => {
    const previous = claimFocusValuesRef.current[claimId]
    const claim = workspaceData.claims.find((item) => item.id === claimId)

    if (!previous || !claim) {
      return
    }

    if (previous.text.trim() === claim.text.trim()) {
      return
    }

    appendTimelineEvent({
      type: 'claim_edited',
      category: 'analysis',
      title: '클레임 텍스트 수정',
      summary: buildTimelineSummary(claim.text, '클레임 텍스트를 수정했습니다.'),
      cycleId: claim.cycleId || getCurrentCycleId(workspaceTimeline),
    })
  }

  const handleClaimReasonChange = (claimId, value) => {
    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        claims: workspace.data.claims.map((claim) =>
          claim.id === claimId
            ? {
                ...claim,
                decisionReason: value,
                updatedAt: new Date().toISOString(),
              }
            : claim
        ),
      },
    }))
  }

  const handleClaimReasonBlur = (claimId) => {
    const previous = claimFocusValuesRef.current[claimId]
    const claim = workspaceData.claims.find((item) => item.id === claimId)

    if (!previous || !claim) {
      return
    }

    if ((previous.decisionReason || '').trim() === claim.decisionReason.trim()) {
      return
    }

    appendTimelineEvent({
      type: 'claim_edited',
      category: 'analysis',
      title: '클레임 판단 근거 수정',
      summary: buildTimelineSummary(
        claim.decisionReason,
        '클레임 판단 근거를 수정했습니다.'
      ),
      cycleId: claim.cycleId || getCurrentCycleId(workspaceTimeline),
    })
  }

  const handleClaimStatusChange = (claimId, status) => {
    const claim = workspaceData.claims.find((item) => item.id === claimId)

    if (!claim || claim.status === status) {
      return
    }

    const decidedAt = status === 'pending' ? null : new Date().toISOString()

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        claims: workspace.data.claims.map((item) =>
          item.id === claimId
            ? {
                ...item,
                status,
                decidedAt,
                updatedAt: new Date().toISOString(),
              }
            : item
        ),
      },
    }))

    const eventType =
      status === 'accepted'
        ? 'claim_accepted'
        : status === 'rejected'
          ? 'claim_rejected'
          : 'claim_pending'

    const eventTitle =
      status === 'accepted'
        ? '클레임 수용'
        : status === 'rejected'
          ? '클레임 기각'
          : '클레임 보류'

    appendTimelineEvent({
      type: eventType,
      category: 'human_decision',
      title: eventTitle,
      summary: `"${buildTimelineSummary(claim.text, '클레임')}"을 ${status} 상태로 변경했습니다.`,
      cycleId: claim.cycleId || getCurrentCycleId(workspaceTimeline),
    })
  }

  const handleDeleteClaim = (claimId) => {
    const claim = workspaceData.claims.find((item) => item.id === claimId)

    if (!claim) {
      return
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        claims: workspace.data.claims.filter((item) => item.id !== claimId),
        decisionGraph: {
          nodes: workspace.data.decisionGraph.nodes.filter((node) => node.claimId !== claimId),
          edges: workspace.data.decisionGraph.edges.filter(
            (edge) => edge.fromClaimId !== claimId && edge.toClaimId !== claimId
          ),
        },
      },
    }))

    appendTimelineEvent({
      type: 'claim_deleted',
      category: 'analysis',
      title: '클레임 삭제',
      summary: buildTimelineSummary(claim.text, '클레임을 삭제했습니다.'),
      cycleId: claim.cycleId || getCurrentCycleId(workspaceTimeline),
    })
  }

  const handleBuildGraph = () => {
    if (workspaceData.claims.length === 0) {
      setGraphBuildFeedback('')
      setWorkspaceNotice('그래프를 만들 클레임이 없습니다.')
      return
    }

    const graph = buildDecisionGraphFromClaims(activeWorkspaceId, workspaceData.claims)
    const cycleId = getCurrentCycleId(workspaceTimeline)

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        decisionGraph: graph,
      },
      timeline: (() => {
        const nextEvent = createTimelineEvent({
          workspaceId: workspace.id,
          type: 'graph_built',
          title: '디시전 그래프 생성',
          summary: `${graph.nodes.length}개 노드와 ${graph.edges.length}개 엣지를 생성했습니다.`,
          category: 'analysis',
          cycleId,
        })

        if (shouldSkipTimelineEvent(workspace.timeline, nextEvent)) {
          return workspace.timeline
        }

        return [...workspace.timeline, nextEvent]
      })(),
    }))

    setGraphBuildFeedback(`Graph built: ${graph.nodes.length} nodes / ${graph.edges.length} edges`)
    setWorkspaceNotice(`디시전 그래프를 만들었습니다. (${graph.nodes.length} nodes)`)
  }

  const handleEdgeRelationChange = (edgeId, relation) => {
    const edge = workspaceData.decisionGraph.edges.find((item) => item.id === edgeId)

    if (!edge || edge.relation === relation) {
      return
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        decisionGraph: {
          ...workspace.data.decisionGraph,
          edges: workspace.data.decisionGraph.edges.map((item) =>
            item.id === edgeId
              ? {
                  ...item,
                  relation,
                  updatedAt: new Date().toISOString(),
                }
              : item
          ),
        },
      },
    }))

    appendTimelineEvent({
      type: 'graph_edited',
      category: 'analysis',
      title: '그래프 관계 수정',
      summary: `${edge.fromClaimId} → ${edge.toClaimId} 관계를 ${relation}로 변경했습니다.`,
      cycleId: edge.cycleId || getCurrentCycleId(workspaceTimeline),
    })
  }

  const handleDeleteEdge = (edgeId) => {
    const edge = workspaceData.decisionGraph.edges.find((item) => item.id === edgeId)

    if (!edge) {
      return
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        decisionGraph: {
          ...workspace.data.decisionGraph,
          edges: workspace.data.decisionGraph.edges.filter((item) => item.id !== edgeId),
        },
      },
    }))

    appendTimelineEvent({
      type: 'graph_edited',
      category: 'analysis',
      title: '그래프 엣지 삭제',
      summary: `${edge.fromClaimId} → ${edge.toClaimId} 엣지를 삭제했습니다.`,
      cycleId: edge.cycleId || getCurrentCycleId(workspaceTimeline),
    })
  }

  const getClaimLabelById = (claimId) =>
    workspaceData.claims.find((claim) => claim.id === claimId)?.text || claimId

  const getDecisionNodeLabelById = (nodeId) =>
    workspaceData.decisionNodes.nodes.find((node) => node.id === nodeId)?.title || nodeId

  const handleCreateDecisionNode = () => {
    const title = decisionNodeDraft.title.trim()

    if (!title) {
      setWorkspaceNotice('결정 노드 제목을 입력하세요.')
      return
    }

    const cycleId = getCurrentCycleId(workspaceTimeline)
    const node = {
      id: createDecisionNodeId(),
      workspaceId: activeWorkspaceId,
      cycleId,
      title,
      description: decisionNodeDraft.description.trim(),
      type: decisionNodeDraft.type,
      confidence: decisionNodeDraft.confidence,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        decisionNodes: {
          ...workspace.data.decisionNodes,
          nodes: [...workspace.data.decisionNodes.nodes, node],
        },
      },
    }))

    appendTimelineEvent({
      type: 'decision_node_created',
      category: 'human_decision',
      title: '결정 노드 생성',
      summary: buildTimelineSummary(title, '새 결정 노드를 생성했습니다.'),
      cycleId,
    })

    setDecisionNodeDraft({
      title: '',
      description: '',
      type: 'decision',
      confidence: 'medium',
    })
    setWorkspaceNotice(`"${title}" 결정 노드를 만들었습니다.`)
  }

  const handleCreateDecisionNodeLink = () => {
    const { fromNodeId, toNodeId, relation } = decisionNodeLinkDraft

    if (!fromNodeId || !toNodeId || fromNodeId === toNodeId) {
      setWorkspaceNotice('서로 다른 두 결정 노드를 선택하세요.')
      return
    }

    const alreadyLinked = workspaceData.decisionNodes.links.some(
      (link) =>
        link.fromNodeId === fromNodeId &&
        link.toNodeId === toNodeId &&
        link.relation === relation
    )

    if (alreadyLinked) {
      setWorkspaceNotice('이미 같은 관계로 연결된 결정 노드입니다.')
      return
    }

    const cycleId = getCurrentCycleId(workspaceTimeline)
    const link = {
      id: createDecisionNodeLinkId(),
      workspaceId: activeWorkspaceId,
      cycleId,
      fromNodeId,
      toNodeId,
      relation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        decisionNodes: {
          ...workspace.data.decisionNodes,
          links: [...workspace.data.decisionNodes.links, link],
        },
      },
    }))

    appendTimelineEvent({
      type: 'decision_nodes_linked',
      category: 'human_decision',
      title: '결정 노드 연결',
      summary: `${getDecisionNodeLabelById(fromNodeId)} → ${getDecisionNodeLabelById(
        toNodeId
      )} 관계를 ${relation}로 연결했습니다.`,
      cycleId,
    })

    setDecisionNodeLinkDraft((current) => ({
      ...current,
      fromNodeId: '',
      toNodeId: '',
    }))
    setWorkspaceNotice('결정 노드를 연결했습니다.')
  }

  const handleDeleteDecisionNode = (nodeId) => {
    const node = workspaceData.decisionNodes.nodes.find((item) => item.id === nodeId)

    if (!node) {
      return
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        decisionNodes: {
          nodes: workspace.data.decisionNodes.nodes.filter((item) => item.id !== nodeId),
          links: workspace.data.decisionNodes.links.filter(
            (link) => link.fromNodeId !== nodeId && link.toNodeId !== nodeId
          ),
        },
        strategies: workspace.data.strategies.map((strategy) => ({
          ...strategy,
          linkedDecisionNodeIds: strategy.linkedDecisionNodeIds.filter(
            (id) => id !== nodeId
          ),
          updatedAt: strategy.linkedDecisionNodeIds.includes(nodeId)
            ? new Date().toISOString()
            : strategy.updatedAt,
        })),
      },
    }))

    appendTimelineEvent({
      type: 'decision_node_deleted',
      category: 'human_decision',
      title: '결정 노드 삭제',
      summary: buildTimelineSummary(node.title, '결정 노드를 삭제했습니다.'),
      cycleId: node.cycleId || getCurrentCycleId(workspaceTimeline),
    })
  }

  const handleDeleteDecisionNodeLink = (linkId) => {
    const link = workspaceData.decisionNodes.links.find((item) => item.id === linkId)

    if (!link) {
      return
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        decisionNodes: {
          ...workspace.data.decisionNodes,
          links: workspace.data.decisionNodes.links.filter((item) => item.id !== linkId),
        },
      },
    }))

    appendTimelineEvent({
      type: 'decision_node_link_deleted',
      category: 'human_decision',
      title: '결정 노드 연결 삭제',
      summary: `${getDecisionNodeLabelById(link.fromNodeId)} → ${getDecisionNodeLabelById(
        link.toNodeId
      )} 연결을 삭제했습니다.`,
      cycleId: link.cycleId || getCurrentCycleId(workspaceTimeline),
    })
  }

  const handleStrategyNodeToggle = (nodeId) => {
    setStrategyDraft((current) => ({
      ...current,
      linkedDecisionNodeIds: current.linkedDecisionNodeIds.includes(nodeId)
        ? current.linkedDecisionNodeIds.filter((id) => id !== nodeId)
        : [...current.linkedDecisionNodeIds, nodeId],
    }))
  }

  const handleCreateStrategy = () => {
    const title = strategyDraft.title.trim()

    if (!title) {
      setWorkspaceNotice('전략 제목을 입력하세요.')
      return
    }

    const cycleId = getCurrentCycleId(workspaceTimeline)
    const strategy = {
      id: createStrategyId(),
      workspaceId: activeWorkspaceId,
      cycleId,
      title,
      description: strategyDraft.description.trim(),
      status: 'draft',
      linkedDecisionNodeIds: strategyDraft.linkedDecisionNodeIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        strategies: [...workspace.data.strategies, strategy],
      },
    }))

    appendTimelineEvent({
      type: 'strategy_created',
      category: 'human_decision',
      title: '전략 생성',
      summary: buildTimelineSummary(title, '새 전략을 생성했습니다.'),
      cycleId,
    })

    setStrategyDraft({
      title: '',
      description: '',
      linkedDecisionNodeIds: [],
    })
    setWorkspaceNotice(`"${title}" 전략을 만들었습니다.`)
  }

  const handleStrategyStatusChange = (strategyId, status) => {
    const strategy = workspaceData.strategies.find((item) => item.id === strategyId)

    if (!strategy || strategy.status === status) {
      return
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        strategies: workspace.data.strategies.map((item) =>
          item.id === strategyId
            ? {
                ...item,
                status,
                updatedAt: new Date().toISOString(),
              }
            : item
        ),
      },
    }))

    appendTimelineEvent({
      type: 'strategy_status_changed',
      category: 'human_decision',
      title: '전략 상태 변경',
      summary: `"${strategy.title}" 상태를 ${status}로 변경했습니다.`,
      cycleId: strategy.cycleId || getCurrentCycleId(workspaceTimeline),
    })
  }

  const handleDeleteStrategy = (strategyId) => {
    const strategy = workspaceData.strategies.find((item) => item.id === strategyId)

    if (!strategy) {
      return
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        strategies: workspace.data.strategies.filter((item) => item.id !== strategyId),
      },
    }))

    appendTimelineEvent({
      type: 'strategy_deleted',
      category: 'human_decision',
      title: '전략 삭제',
      summary: buildTimelineSummary(strategy.title, '전략을 삭제했습니다.'),
      cycleId: strategy.cycleId || getCurrentCycleId(workspaceTimeline),
    })
  }

  const handleCreateHypothesis = () => {
    const title = hypothesisDraft.title.trim()
    const description = hypothesisDraft.description.trim()

    if (!title) {
      setHypothesisError('Hypothesis title is required.')
      setWorkspaceNotice('가설 제목을 입력하세요.')
      return
    }

    setHypothesisError('')

    const cycleId = getCurrentCycleId(workspaceTimeline)
    const hypothesis = {
      id: createHypothesisId(),
      workspaceId: activeWorkspaceId,
      cycleId,
      title,
      description,
      status: 'active',
      linkedClaimIds: [],
      linkedDecisionIds: [],
      confidence: hypothesisDraft.confidence,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        hypotheses: [...workspace.data.hypotheses, hypothesis],
      },
    }))

    appendTimelineEvent({
      type: 'hypothesis_created',
      category: 'human_decision',
      title: '가설 생성',
      summary: buildTimelineSummary(title, '새 가설을 생성했습니다.'),
      cycleId,
    })

    setHypothesisDraft({
      title: '',
      description: '',
      confidence: 'unknown',
    })
    setWorkspaceNotice(`"${title}" 가설을 만들었습니다.`)
  }

  const handleHypothesisStatusChange = (hypothesisId, status) => {
    const hypothesis = workspaceData.hypotheses.find((item) => item.id === hypothesisId)

    if (!hypothesis || hypothesis.status === status) {
      return
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        hypotheses: workspace.data.hypotheses.map((item) =>
          item.id === hypothesisId
            ? {
                ...item,
                status,
                updatedAt: new Date().toISOString(),
              }
            : item
        ),
      },
    }))

    const type =
      status === 'validated'
        ? 'hypothesis_validated'
        : status === 'invalidated'
          ? 'hypothesis_invalidated'
          : status === 'archived'
            ? 'hypothesis_archived'
            : 'hypothesis_updated'

    const title =
      status === 'validated'
        ? '가설 검증'
        : status === 'invalidated'
          ? '가설 반증'
          : status === 'archived'
            ? '가설 보관'
            : '가설 활성화'

    appendTimelineEvent({
      type,
      category: 'human_decision',
      title,
      summary: `"${hypothesis.title}" 상태를 ${status}로 변경했습니다.`,
      cycleId: hypothesis.cycleId || getCurrentCycleId(workspaceTimeline),
    })
  }

  const handleHypothesisClaimToggle = (hypothesisId, claimId) => {
    const hypothesis = workspaceData.hypotheses.find((item) => item.id === hypothesisId)
    const claim = workspaceData.claims.find((item) => item.id === claimId)

    if (!hypothesis || !claim || claim.status !== 'accepted') {
      return
    }

    const isLinked = hypothesis.linkedClaimIds.includes(claimId)

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        hypotheses: workspace.data.hypotheses.map((item) =>
          item.id === hypothesisId
            ? {
                ...item,
                linkedClaimIds: isLinked
                  ? item.linkedClaimIds.filter((id) => id !== claimId)
                  : [...item.linkedClaimIds, claimId],
                linkedDecisionIds: isLinked
                  ? item.linkedDecisionIds.filter((id) => id !== claimId)
                  : [...item.linkedDecisionIds, claimId],
                updatedAt: new Date().toISOString(),
              }
            : item
        ),
      },
    }))
  }

  const handleExperimentHypothesisToggle = (hypothesisId) => {
    setExperimentError('')
    setExperimentDraft((current) => ({
      ...current,
      linkedHypothesisIds: current.linkedHypothesisIds.includes(hypothesisId)
        ? current.linkedHypothesisIds.filter((id) => id !== hypothesisId)
        : [...current.linkedHypothesisIds, hypothesisId],
    }))
  }

  const handleCreateExperiment = () => {
    const title = experimentDraft.title.trim()

    if (!title) {
      setWorkspaceNotice('실험 제목을 입력하세요.')
      return
    }

    if (experimentDraft.linkedHypothesisIds.length === 0) {
      setExperimentError('Select at least one hypothesis.')
      setWorkspaceNotice('최소 하나의 가설을 연결하세요.')
      return
    }

    setExperimentError('')

    const linkedHypotheses = workspaceData.hypotheses.filter((hypothesis) =>
      experimentDraft.linkedHypothesisIds.includes(hypothesis.id)
    )
    const linkedClaimIds = [
      ...new Set(linkedHypotheses.flatMap((hypothesis) => hypothesis.linkedClaimIds)),
    ]

    const experiment = {
      id: createExperimentId(),
      workspaceId: activeWorkspaceId,
      hypothesisId: experimentDraft.linkedHypothesisIds[0],
      linkedHypothesisIds: experimentDraft.linkedHypothesisIds,
      title,
      description: experimentDraft.description.trim(),
      expectedOutcome: experimentDraft.expectedOutcome.trim(),
      actualOutcome: '',
      status: 'planned',
      linkedClaimIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        experiments: [...workspace.data.experiments, experiment],
      },
    }))

    appendTimelineEvent({
      type: 'experiment_created',
      category: 'human_decision',
      title: '실험 생성',
      summary: buildTimelineSummary(title, '새 실험을 생성했습니다.'),
      cycleId: linkedHypotheses[0]?.cycleId || getCurrentCycleId(workspaceTimeline),
    })

    setExperimentDraft({
      title: '',
      description: '',
      expectedOutcome: '',
      linkedHypothesisIds: [],
    })
    setExperimentError('')
    setWorkspaceNotice(`"${title}" 실험을 만들었습니다.`)
  }

  const handleExperimentStatusChange = (experimentId, status) => {
    const experiment = workspaceData.experiments.find((item) => item.id === experimentId)

    if (!experiment || experiment.status === status) {
      return
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        experiments: workspace.data.experiments.map((item) =>
          item.id === experimentId
            ? {
                ...item,
                status,
                updatedAt: new Date().toISOString(),
                completedAt:
                  ['completed', 'failed', 'cancelled'].includes(status)
                    ? new Date().toISOString()
                    : null,
              }
            : item
        ),
      },
    }))

    const eventMap = {
      running: { type: 'experiment_started', title: '실험 시작' },
      completed: { type: 'experiment_completed', title: '실험 완료' },
      failed: { type: 'experiment_failed', title: '실험 실패' },
      cancelled: { type: 'experiment_cancelled', title: '실험 취소' },
    }

    const event = eventMap[status]

    if (event) {
      appendTimelineEvent({
        type: event.type,
        category: 'human_decision',
        title: event.title,
        summary: `"${experiment.title}" 상태를 ${status}로 변경했습니다.`,
        cycleId:
          workspaceData.hypotheses.find((hypothesis) =>
            experiment.linkedHypothesisIds.includes(hypothesis.id)
          )?.cycleId || getCurrentCycleId(workspaceTimeline),
      })
    }
  }

  const handleExperimentFieldChange = (experimentId, field, value) => {
    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        experiments: workspace.data.experiments.map((experiment) =>
          experiment.id === experimentId
            ? {
                ...experiment,
                [field]: value,
                updatedAt: new Date().toISOString(),
              }
            : experiment
        ),
      },
    }))
  }

  const handleLearningExperimentChange = (experimentId) => {
    const experiment = eligibleLearningExperiments.find((item) => item.id === experimentId)
    const hypothesisId = experiment?.linkedHypothesisIds?.[0] || ''

    setLearningDraft((current) => ({
      ...current,
      experimentId,
      hypothesisId,
    }))
  }

  const handleCreateLearning = () => {
    const experiment = workspaceData.experiments.find(
      (item) => item.id === learningDraft.experimentId
    )

    if (!experiment || !['completed', 'failed'].includes(experiment.status)) {
      setWorkspaceNotice('완료 또는 실패한 실험을 선택하세요.')
      return
    }

    const title = learningDraft.title.trim()
    const summary = learningDraft.summary.trim()

    if (!title) {
      setWorkspaceNotice('학습 제목을 입력하세요.')
      return
    }

    if (!summary) {
      setWorkspaceNotice('무엇을 배웠는지 기록하세요.')
      return
    }

    const linkedHypothesisIds =
      experiment.linkedHypothesisIds.length > 0 ? experiment.linkedHypothesisIds : ['']
    const hypothesisId = linkedHypothesisIds.includes(learningDraft.hypothesisId)
      ? learningDraft.hypothesisId
      : linkedHypothesisIds[0]
    const linkedHypothesis = workspaceData.hypotheses.find(
      (item) => item.id === hypothesisId
    )
    const cycleId =
      linkedHypothesis?.cycleId ||
      workspaceData.hypotheses.find((item) =>
        experiment.linkedHypothesisIds.includes(item.id)
      )?.cycleId ||
      getCurrentCycleId(workspaceTimeline)

    const learning = {
      id: createLearningId(),
      workspaceId: activeWorkspaceId,
      experimentId: experiment.id,
      hypothesisId: hypothesisId || '',
      title,
      summary,
      result: learningDraft.result,
      impact: learningDraft.impact,
      nextAction: learningDraft.nextAction.trim(),
      linkedClaimIds: experiment.linkedClaimIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        learnings: [...workspace.data.learnings, learning],
      },
    }))

    appendTimelineEvent({
      type: 'learning_created',
      category: 'human_decision',
      title: '학습 생성',
      summary: buildTimelineSummary(title, '새 학습 기록을 생성했습니다.'),
      cycleId,
    })

    setLearningDraft({
      experimentId: experiment.id,
      hypothesisId: hypothesisId || '',
      title: '',
      summary: '',
      result: 'inconclusive',
      impact: 'medium',
      nextAction: '',
    })
    setWorkspaceNotice(`"${title}" 학습 기록을 만들었습니다.`)
  }

  const handleLearningFocus = (learning) => {
    learningFocusValuesRef.current[learning.id] = {
      title: learning.title,
      summary: learning.summary,
      impact: learning.impact,
      nextAction: learning.nextAction,
    }
  }

  const handleLearningFieldChange = (learningId, field, value) => {
    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        learnings: workspace.data.learnings.map((learning) =>
          learning.id === learningId
            ? {
                ...learning,
                [field]: value,
                updatedAt: new Date().toISOString(),
              }
            : learning
        ),
      },
    }))
  }

  const handleLearningBlur = (learningId) => {
    const previous = learningFocusValuesRef.current[learningId]
    const learning = workspaceData.learnings.find((item) => item.id === learningId)

    if (!previous || !learning) {
      return
    }

    const isSame =
      previous.title.trim() === learning.title.trim() &&
      previous.summary.trim() === learning.summary.trim() &&
      previous.impact === learning.impact &&
      (previous.nextAction || '').trim() === learning.nextAction.trim()

    if (isSame) {
      return
    }

    const experiment = workspaceData.experiments.find(
      (item) => item.id === learning.experimentId
    )
    const hypothesis = workspaceData.hypotheses.find(
      (item) => item.id === learning.hypothesisId
    )

    appendTimelineEvent({
      type: 'learning_updated',
      category: 'human_decision',
      title: '학습 업데이트',
      summary: buildTimelineSummary(
        learning.summary || learning.title,
        '학습 기록을 업데이트했습니다.'
      ),
      cycleId:
        hypothesis?.cycleId ||
        workspaceData.hypotheses.find((item) =>
          experiment?.linkedHypothesisIds.includes(item.id)
        )?.cycleId ||
        getCurrentCycleId(workspaceTimeline),
    })
  }

  const handleLearningResultChange = (learningId, result) => {
    const learning = workspaceData.learnings.find((item) => item.id === learningId)

    if (!learning || learning.result === result) {
      return
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        learnings: workspace.data.learnings.map((item) =>
          item.id === learningId
            ? {
                ...item,
                result,
                updatedAt: new Date().toISOString(),
              }
            : item
        ),
      },
    }))

    const experiment = workspaceData.experiments.find(
      (item) => item.id === learning.experimentId
    )
    const hypothesis = workspaceData.hypotheses.find(
      (item) => item.id === learning.hypothesisId
    )

    appendTimelineEvent({
      type: 'learning_result_changed',
      category: 'human_decision',
      title: '학습 결과 변경',
      summary: `"${learning.title}" 결과를 ${result}로 변경했습니다.`,
      cycleId:
        hypothesis?.cycleId ||
        workspaceData.hypotheses.find((item) =>
          experiment?.linkedHypothesisIds.includes(item.id)
        )?.cycleId ||
        getCurrentCycleId(workspaceTimeline),
    })
  }

  const handleDeleteExperiment = (experimentId) => {
    const experiment = workspaceData.experiments.find((item) => item.id === experimentId)

    if (!experiment) {
      return
    }

    const linkedLearnings = workspaceData.learnings.filter(
      (learning) => learning.experimentId === experimentId
    )

    if (linkedLearnings.length > 0) {
      setWorkspaceNotice('학습 기록이 연결된 실험은 삭제할 수 없습니다. 상태 변경을 사용하세요.')
      return
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        experiments: workspace.data.experiments.filter((item) => item.id !== experimentId),
        evolutions: workspace.data.evolutions.map((evolution) =>
          evolution.nextExperimentId === experimentId
            ? {
                ...evolution,
                nextExperimentId: '',
                updatedAt: new Date().toISOString(),
              }
            : evolution
        ),
      },
    }))

    appendTimelineEvent({
      type: 'experiment_deleted',
      category: 'human_decision',
      title: '실험 삭제',
      summary: `"${experiment.title}" 실험을 삭제했습니다.`,
      cycleId:
        workspaceData.hypotheses.find((hypothesis) =>
          experiment.linkedHypothesisIds.includes(hypothesis.id)
        )?.cycleId || getCurrentCycleId(workspaceTimeline),
    })
  }

  const handleEvolutionLearningChange = (learningId) => {
    const learning = workspaceData.learnings.find((item) => item.id === learningId)

    setEvolutionDraft((current) => ({
      ...current,
      learningId,
      evolvedHypothesisTitle: `${learning?.title || '학습'} 후속 가설`,
      nextExperimentTitle: `${learning?.title || '학습'} 후속 실험`,
    }))
  }

  const handleCreateEvolution = () => {
    const learning = workspaceData.learnings.find((item) => item.id === evolutionDraft.learningId)

    if (!learning) {
      setWorkspaceNotice('학습 기록을 선택하세요.')
      return
    }

    const fromHypothesis = workspaceData.hypotheses.find(
      (item) => item.id === learning.hypothesisId
    )
    const experiment = workspaceData.experiments.find(
      (item) => item.id === learning.experimentId
    )
    const cycleId =
      fromHypothesis?.cycleId ||
      workspaceData.hypotheses.find((item) =>
        experiment?.linkedHypothesisIds.includes(item.id)
      )?.cycleId ||
      getCurrentCycleId(workspaceTimeline)

    const reason = evolutionDraft.reason.trim()

    if (!reason) {
      setWorkspaceNotice('진화 이유를 입력하세요.')
      return
    }

    let evolvedHypothesis = null
    if (evolutionDraft.createHypothesis) {
      const title = evolutionDraft.evolvedHypothesisTitle.trim()
      if (!title) {
        setWorkspaceNotice('진화된 가설 제목을 입력하세요.')
        return
      }

      evolvedHypothesis = {
        id: createHypothesisId(),
        workspaceId: activeWorkspaceId,
        cycleId,
        title,
        description: evolutionDraft.evolvedHypothesisDescription.trim(),
        status: evolutionDraft.type === 'retire' ? 'archived' : 'active',
        linkedClaimIds: learning.linkedClaimIds,
        linkedDecisionIds: learning.linkedClaimIds,
        confidence: evolutionDraft.evolvedHypothesisConfidence,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    let nextExperiment = null
    if (evolutionDraft.createNextExperiment) {
      const title = evolutionDraft.nextExperimentTitle.trim()
      if (!title) {
        setWorkspaceNotice('다음 실험 제목을 입력하세요.')
        return
      }

      nextExperiment = {
        id: createExperimentId(),
        workspaceId: activeWorkspaceId,
        hypothesisId: evolvedHypothesis?.id || fromHypothesis?.id || '',
        linkedHypothesisIds: [evolvedHypothesis?.id || fromHypothesis?.id].filter(Boolean),
        title,
        description: evolutionDraft.nextExperimentDescription.trim(),
        expectedOutcome: evolutionDraft.nextExperimentExpectedOutcome.trim(),
        actualOutcome: '',
        status: 'planned',
        linkedClaimIds: learning.linkedClaimIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
      }
    }

    const evolution = {
      id: createEvolutionId(),
      workspaceId: activeWorkspaceId,
      learningId: learning.id,
      fromHypothesisId: fromHypothesis?.id || '',
      toHypothesisId: evolvedHypothesis?.id || '',
      nextExperimentId: nextExperiment?.id || '',
      type: evolutionDraft.type,
      reason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        hypotheses: [
          ...workspace.data.hypotheses.map((item) =>
            item.id === fromHypothesis?.id && evolutionDraft.type === 'retire'
              ? {
                  ...item,
                  status: 'archived',
                  updatedAt: new Date().toISOString(),
                }
              : item
          ),
          ...(evolvedHypothesis ? [evolvedHypothesis] : []),
        ],
        experiments: [
          ...workspace.data.experiments,
          ...(nextExperiment ? [nextExperiment] : []),
        ],
        evolutions: [...workspace.data.evolutions, evolution],
      },
    }))

    appendTimelineEvent({
      type: 'evolution_created',
      category: 'human_decision',
      title: '진화 생성',
      summary: buildTimelineSummary(reason, '새 진화 경로를 생성했습니다.'),
      cycleId,
    })

    if (evolvedHypothesis) {
      appendTimelineEvent({
        type: 'hypothesis_evolved',
        category: 'human_decision',
        title: '가설 진화',
        summary: `"${fromHypothesis?.title || learning.title}"에서 "${evolvedHypothesis.title}"로 진화했습니다.`,
        cycleId,
      })
    }

    if (evolutionDraft.type === 'retire' && fromHypothesis) {
      appendTimelineEvent({
        type: 'hypothesis_retired',
        category: 'human_decision',
        title: '가설 은퇴',
        summary: `"${fromHypothesis.title}" 가설을 retire 처리했습니다.`,
        cycleId,
      })
    }

    setEvolutionDraft({
      learningId: learning.id,
      type: 'refine',
      reason: '',
      createHypothesis: true,
      evolvedHypothesisTitle: `${learning.title} 후속 가설`,
      evolvedHypothesisDescription: '',
      evolvedHypothesisConfidence: 'medium',
      nextExperimentTitle: `${learning.title} 후속 실험`,
      nextExperimentDescription: '',
      nextExperimentExpectedOutcome: '',
      createNextExperiment: false,
    })
    setWorkspaceNotice(`"${learning.title}" 기반 진화를 생성했습니다.`)
  }

  const handleDeleteLearning = (learningId) => {
    const learning = workspaceData.learnings.find((item) => item.id === learningId)

    if (!learning) {
      return
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        learnings: workspace.data.learnings.filter((item) => item.id !== learningId),
        evolutions: workspace.data.evolutions.filter(
          (evolution) => evolution.learningId !== learningId
        ),
      },
    }))

    appendTimelineEvent({
      type: 'learning_deleted',
      category: 'human_decision',
      title: '학습 삭제',
      summary: buildTimelineSummary(learning.title, '학습 기록을 삭제했습니다.'),
      cycleId:
        workspaceData.hypotheses.find((item) => item.id === learning.hypothesisId)?.cycleId ||
        getCurrentCycleId(workspaceTimeline),
    })
  }

  const handleLoadSnapshot = (snapshotId) => {
    const snapshot = workspaceSnapshots.find((item) => item.id === snapshotId)

    if (!snapshot) {
      return
    }

    const snapshotData = snapshot.data
      ? createWorkspaceData(snapshot.data)
      : createWorkspaceData({
          globalPrompt: workspaceData.globalPrompt,
          projectPrompt: workspaceData.projectPrompt,
          question: snapshot.question,
          finalPrompt: snapshot.finalPrompt,
          gptResponse: snapshot.gptResponse,
          claudeResponse: snapshot.claudeResponse,
          geminiResponse: snapshot.geminiResponse,
          consensus: snapshot.consensus,
          conflict: snapshot.conflict,
          uniqueInsight: snapshot.uniqueInsight,
          humanDecision: snapshot.humanDecision,
        })

    updateActiveWorkspace(snapshotData)
    setWorkspaceNotice(`"${snapshot.title}" 스냅샷을 불러왔습니다.`)
  }

  const handleDeleteSnapshot = (snapshotId) => {
    const snapshot = workspaceSnapshots.find((item) => item.id === snapshotId)

    if (!snapshot) {
      return
    }

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      snapshots: workspace.snapshots.filter((item) => item.id !== snapshotId),
    }))
    setWorkspaceNotice(`"${snapshot.title}" 스냅샷을 삭제했습니다.`)
  }

  const handleNavigatorItemClick = (sectionId) => {
    const container = mainScrollRef.current
    const target = sectionTitleRefs.current[sectionId]

    if (!container || !target) {
      return
    }

    const contextNavOffset = 40
    const top = getSectionTopInContainer(sectionId)

    container.scrollTo({
      top: Math.max(0, top - contextNavOffset),
      behavior: 'smooth',
    })
  }

  const registerSectionTitle = (sectionId) => (element) => {
    if (element) {
      sectionTitleRefs.current[sectionId] = element
      return
    }

    delete sectionTitleRefs.current[sectionId]
  }

  const handleConversationAnchorClick = (anchor) => {
    const container = mainScrollRef.current
    const targetId = getConversationAnchorTargetId(anchor)
    const target = targetId ? document.getElementById(targetId) : null

    if (!container || !target) {
      return
    }

    const containerRect = container.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const top = targetRect.top - containerRect.top + container.scrollTop

    container.scrollTo({
      top: Math.max(0, top - 72),
      behavior: 'smooth',
    })
  }

  const handleCreateWorkspace = () => {
    const input = window.prompt(
      '새 작업공간 이름을 입력하세요.',
      `새 작업공간 ${workspaces.length + 1}`
    )

    const name = input?.trim()

    if (!name) {
      return
    }

    const newWorkspace = createWorkspace(name)

    setWorkspaces((current) => [...current, newWorkspace])
    setActiveWorkspaceId(newWorkspace.id)
    setWorkspaceNotice(`"${name}" 작업공간을 만들었습니다.`)
  }

  const handleSelectWorkspace = (workspaceId) => {
    setActiveWorkspaceId(workspaceId)
    const selected = workspaces.find((workspace) => workspace.id === workspaceId)
    setWorkspaceNotice(`"${selected?.name || '작업공간'}"으로 전환했습니다.`)
  }

  const handleDeleteWorkspace = (workspaceId) => {
    const targetWorkspace = workspaces.find((workspace) => workspace.id === workspaceId)

    if (!targetWorkspace) {
      return
    }

    const shouldDelete = window.confirm(
      `"${targetWorkspace.name}" 작업공간을 삭제하시겠습니까?`
    )

    if (!shouldDelete) {
      return
    }

    if (workspaces.length === 1) {
      const fallbackWorkspace = createWorkspace('새 작업공간')
      setWorkspaces([fallbackWorkspace])
      setActiveWorkspaceId(fallbackWorkspace.id)
      setWorkspaceNotice(
        `"${targetWorkspace.name}"을 삭제하고 새 기본 작업공간을 만들었습니다.`
      )
      return
    }

    const remaining = workspaces.filter((workspace) => workspace.id !== workspaceId)
    const nextActiveId =
      activeWorkspaceId === workspaceId ? remaining[0].id : activeWorkspaceId

    setWorkspaces(remaining)
    setActiveWorkspaceId(nextActiveId)
    setWorkspaceNotice(`"${targetWorkspace.name}" 작업공간을 삭제했습니다.`)
  }

  const handleSaveWorkspace = () => {
    persistWorkspaceStorage(workspaces, activeWorkspaceId)
    setWorkspaceNotice(`"${activeWorkspaceName}" 작업공간을 저장했습니다.`)
  }

  const handleClearWorkspace = () => {
    const shouldClear = window.confirm(
      `"${activeWorkspaceName}" 작업공간의 내용을 비우시겠습니까?`
    )

    if (!shouldClear) {
      return
    }

    updateActiveWorkspace(createClearedWorkspaceData())
    setWorkspaceNotice(`"${activeWorkspaceName}" 작업공간을 비웠습니다.`)
  }

  const handleExportWorkspaceJson = () => {
    if (typeof window === 'undefined') {
      return
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      workspace: activeWorkspace,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${activeWorkspaceName.replace(/\s+/g, '-').toLowerCase()}-workspace.json`
    anchor.click()
    window.URL.revokeObjectURL(url)
    setWorkspaceNotice(`"${activeWorkspaceName}" 작업공간 JSON을 내보냈습니다.`)
  }

  const handleImportWorkspaceClick = () => {
    importWorkspaceInputRef.current?.click()
  }

  const handleImportWorkspaceJson = async (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const raw = await file.text()
      const parsed = JSON.parse(raw)
      const candidate =
        parsed && typeof parsed === 'object' && parsed.workspace ? parsed.workspace : parsed

      if (!candidate || typeof candidate !== 'object') {
        throw new Error('JSON 구조가 유효하지 않습니다.')
      }

      const existingIds = workspaces.map((workspace) => workspace.id)
      const importedWorkspace = normalizeWorkspaceImport(candidate, existingIds)
      const importEvent = createTimelineEvent({
        workspaceId: importedWorkspace.id,
        type: 'workspace_imported',
        title: '작업공간 가져오기',
        summary: `"${importedWorkspace.name}" 작업공간을 JSON에서 복원했습니다.`,
        category: 'input',
        cycleId: getCurrentCycleId(importedWorkspace.timeline),
      })

      importedWorkspace.timeline = shouldSkipTimelineEvent(
        importedWorkspace.timeline,
        importEvent
      )
        ? importedWorkspace.timeline
        : [...importedWorkspace.timeline, importEvent]

      setWorkspaces((current) => [...current, importedWorkspace])
      setActiveWorkspaceId(importedWorkspace.id)
      setWorkspaceNotice(`"${importedWorkspace.name}" 작업공간을 가져왔습니다.`)
    } catch (error) {
      console.error('Workspace import failed:', error)
      setWorkspaceNotice(
        error instanceof Error
          ? `가져오기 실패: ${error.message}`
          : '가져오기 실패: JSON 파일을 확인하세요.'
      )
    } finally {
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const handleGenerateCliPacket = () => {
    appendTimelineEvent({
      type: 'cli_packet_generated',
      category: 'human_decision',
      title: 'CLI 패킷 생성',
      summary: buildTimelineSummary(
        workspaceData.question || activeWorkspaceName,
        '외부 도구 전달용 CLI 패킷을 생성했습니다.'
      ),
      cycleId: getCurrentCycleId(workspaceTimeline),
    })
    setWorkspaceNotice(`"${activeWorkspaceName}" CLI 패킷을 생성했습니다.`)
  }

  const handleCopyCliPacket = async () => {
    try {
      await navigator.clipboard.writeText(cliPacket)
      setWorkspaceNotice('CLI 패킷을 클립보드에 복사했습니다.')
    } catch (error) {
      console.error('CLI packet copy failed:', error)
      setWorkspaceNotice('CLI 패킷 복사에 실패했습니다.')
    }
  }

  const handleDownloadCliPacket = () => {
    if (typeof window === 'undefined') {
      return
    }

    const blob = new Blob([cliPacket], { type: 'text/markdown;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${activeWorkspaceName.replace(/\s+/g, '-').toLowerCase()}-cli-packet.md`
    anchor.click()
    window.URL.revokeObjectURL(url)
    setWorkspaceNotice('CLI 패킷 Markdown을 내보냈습니다.')
  }

  const handleProviderSettingChange = (provider, field, value) => {
    updateActiveWorkspace((workspace) => ({
      ...workspace,
      data: {
        ...workspace.data,
        providerSettings: {
          ...workspace.data.providerSettings,
          [provider]: {
            ...workspace.data.providerSettings[provider],
            [field]: value,
          },
        },
      },
    }))
  }

  const handleGenerateOrchestrationPacket = () => {
    appendTimelineEvent({
      type: 'orchestration_packet_generated',
      category: 'human_decision',
      title: '오케스트레이션 패킷 생성',
      summary: buildTimelineSummary(
        workspaceData.question || activeWorkspaceName,
        'API 실행 전 오케스트레이션 계획 패킷을 생성했습니다.'
      ),
      cycleId: getCurrentCycleId(workspaceTimeline),
    })

    if (typeof window === 'undefined') {
      return
    }

    const blob = new Blob([JSON.stringify(orchestrationPlan, null, 2)], {
      type: 'application/json',
    })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${activeWorkspaceName.replace(/\s+/g, '-').toLowerCase()}-orchestration-packet.json`
    anchor.click()
    window.URL.revokeObjectURL(url)
    setWorkspaceNotice('오케스트레이션 패킷 JSON을 내보냈습니다.')
  }

  const orderedNavigatorItems = navigatorSectionIds
    .map((sectionId) => navigatorItems.find((item) => item.id === sectionId))
    .filter(Boolean)
    .map((item) => ({
      id: item.id,
      preview: getNavigatorPreview(item, workspaceData, effectiveFinalPrompt),
      type: item.type,
      label: item.label,
      shortLabel: item.shortLabel,
    }))
  const activeNavigatorIndex = orderedNavigatorItems.findIndex(
    (item) => item.id === activeSectionId
  )

  return (
    <div
      className={`app-shell ${
        isConversationMinimapExpanded ? 'app-shell--minimap-expanded' : ''
      } ${
        hasUsedNavigator ? 'app-shell--navigator-used' : ''
      }`}
    >
      <div className="global-aurora" aria-hidden="true">
        <span className="aurora-blob aurora-blob--violet" />
        <span className="aurora-blob aurora-blob--cyan" />
        <span className="aurora-blob aurora-blob--blue" />
        <span className="aurora-blob aurora-blob--mist" />
      </div>
      <aside className="sidebar">
        <div className="sidebar-card sidebar__brand">
          <div className="sidebar__badge">AVA</div>
          <div>
            <h1>Answer · Verify · Action</h1>
            <p className="sidebar__subtitle">Human-AI Decision OS</p>
          </div>
        </div>

        <section className="sidebar-card sidebar-panel">
          <div className="workspace-heading">

            <button
              type="button"
              className="ghost-button btn-secondary workspace-heading__button workspace-create-button"
              onClick={handleCreateWorkspace}
            >
              <span className="button-icon">✦</span>
              새 작업공간 만들기
            </button>
          </div>

          <div className="active-workspace-card">
            <p className="section-label">현재 선택</p>
            <strong>{activeWorkspaceName}</strong>
            <p>{workspaceNotice}</p>
          </div>

          <nav className="workspace-list">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className={`workspace-item ${
                  workspace.id === activeWorkspaceId ? 'workspace-item--active' : ''
                }`}
              >
                <button
                  type="button"
                  className="workspace-item__select"
                  onClick={() => handleSelectWorkspace(workspace.id)}
                >
                  <span className="workspace-item__icon" aria-hidden="true">
                    {workspace.name?.trim()?.[0] || 'A'}
                  </span>
                  <span className="workspace-item__content">
                    <span className="workspace-item__name">{workspace.name}</span>
                    <span className="workspace-item__meta">
                      {workspace.id === activeWorkspaceId
                        ? '현재 작업공간'
                        : '작업공간 선택'}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  className="workspace-item__delete"
                  onClick={() => handleDeleteWorkspace(workspace.id)}
                  aria-label={`${workspace.name} 작업공간 삭제`}
                  title={`${workspace.name} 작업공간 삭제`}
                >
                  ×
                </button>
              </div>
            ))}
          </nav>

          <div className="workspace-actions">
            <input
              ref={importWorkspaceInputRef}
              type="file"
              accept=".json,application/json"
              className="workspace-import-input"
              onChange={handleImportWorkspaceJson}
            />
            <div className="workspace-action-group workspace-action-group--primary">
              <button
                type="button"
                className="ghost-button btn-secondary save-button"
                onClick={handleSaveWorkspace}
              >
                <span className="button-icon">▣</span>
                작업 저장
              </button>
              <button
                type="button"
                className="ghost-button btn-secondary"
                onClick={handleClearWorkspace}
              >
                <span className="button-icon">⌫</span>
                비우기
              </button>
            </div>
            <div className="workspace-action-group">
              <p className="workspace-action-group__label">JSON</p>
              <div className="workspace-action-group__buttons">
                <button
                  type="button"
                  className="ghost-button btn-secondary export-button"
                  onClick={handleExportWorkspaceJson}
                >
                  내보내기
                </button>
                <button
                  type="button"
                  className="ghost-button btn-secondary import-button"
                  onClick={handleImportWorkspaceClick}
                >
                  가져오기
                </button>
              </div>
            </div>
            <div className="workspace-action-group workspace-action-group--cli">
              <p className="workspace-action-group__label">CLI 패킷</p>
              <div className="workspace-action-group__buttons">
                <button
                  type="button"
                  className="ghost-button btn-secondary"
                  onClick={handleGenerateCliPacket}
                >
                  생성
                </button>
                <button
                  type="button"
                  className="ghost-button btn-secondary copy-button"
                  onClick={handleCopyCliPacket}
                >
                  복사
                </button>
                <button
                  type="button"
                  className="ghost-button btn-secondary markdown-button"
                  onClick={handleDownloadCliPacket}
                >
                  .md
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="sidebar-card snapshot-section">
          <div className="snapshot-section__header">
            <div>
              <p className="section-label">SNAPSHOT ENGINE</p>
            </div>
            <button
              type="button"
              className="ghost-button btn-secondary snapshot-section__button snapshot-button"
              onClick={handleSaveSnapshot}
            >
              <span className="button-icon">📷</span>
              스냅샷 저장
            </button>
          </div>

          <div className="snapshot-stat-card">
            <span className="snapshot-stat-card__label">저장된 스냅샷</span>
            <strong>{workspaceSnapshots.length}</strong>
            {workspaceSnapshots.length === 0 ? (
              <span className="snapshot-stat-card__empty">
                아직 저장된 스냅샷이 없습니다
              </span>
            ) : null}
          </div>

          <div className="snapshot-list">
            {workspaceSnapshots.length > 0 ? (
              workspaceSnapshots.map((snapshot) => (
                <div key={snapshot.id} className="snapshot-item">
                  <button
                    type="button"
                    className="snapshot-item__select"
                    onClick={() => handleLoadSnapshot(snapshot.id)}
                  >
                    <span className="snapshot-item__dot" />
                    <span className="snapshot-item__content">
                      <span className="snapshot-item__title">{snapshot.title}</span>
                      <span className="snapshot-item__meta">
                        {new Date(snapshot.createdAt).toLocaleString('ko-KR')}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="snapshot-item__delete"
                    onClick={() => handleDeleteSnapshot(snapshot.id)}
                    aria-label={`${snapshot.title} 스냅샷 삭제`}
                  >
                    삭제
                  </button>
                </div>
              ))
            ) : (
              <p className="snapshot-list__empty">
                아직 저장된 스냅샷이 없습니다.
              </p>
            )}
          </div>
        </section>

        <div className="sidebar-card status-card sidebar__section--footer">
          <p className="section-label">상태</p>
          <strong>로컬 저장 활성화</strong>
          <p>작업 내용은 자동 복원됩니다.</p>
        </div>
      </aside>
      <section className="main-shell" ref={mainScrollRef}>
        <nav className="top-nav" aria-label="Top navigation">
          <button type="button" className="top-nav__item top-nav__item--theme" aria-label="Toggle theme">
            <span className="top-nav__text">☀</span>
          </button>
          <button type="button" className="top-nav__item top-nav__item--language">
            <span className="top-nav__text">KOR</span>
          </button>
          <button type="button" className="top-nav__item top-nav__item--login">
            로그인
          </button>
          <button type="button" className="top-nav__item top-nav__item--accent top-nav__item--signup">
            회원가입
          </button>
        </nav>
      <main className="dashboard">
        <div className="workspace-content">
            <section className="hero-card">
              <div className="hero-card__content">
                <h2>Decision Intelligence Workspace</h2>
                <p className="hero-card__subtitle">다중 LLM 합의 기반 의사결정 워크스페이스</p>
              </div>
              <div className="hero-card__meta">
                <span className="hero-card__badge hero-card__badge--accent">질문</span>
                <span className="hero-card__badge">검증</span>
                <span className="hero-card__badge">실행</span>
              </div>
            </section>

            <section id="question-studio" className="card studio-card section-anchor">
              <div className="card__header">
                <div
                  ref={registerSectionTitle('question-studio')}
                  id="context-title-question-studio"
                  data-context-anchor="section-title"
                  data-context-section-id="question-studio"
                  className="section-heading context-section-anchor"
                >
                  <span className="section-icon" aria-hidden="true">✦</span>
                  <div>
                    <p className="section-label">입력</p>
                    <h3>질문 스튜디오</h3>
                  </div>
                </div>
                <button
                  type="button"
                  className="ghost-button btn-secondary utility-action-button prompt-create-button"
                  onClick={handleBuildPrompt}
                >
                  프롬프트 만들기
                </button>
              </div>

              <p className="studio-card__lead">
                질문, 공통 기준, 프로젝트 맥락을 하나의 입력 엔진에서 조합해 최종 프롬프트를 만듭니다.
              </p>

              <div className="studio-grid">
                <label className="field field--prompt">
                  <span className="field__label">
                    <span className="field__icon" aria-hidden="true">□</span>
                    공통 프롬프트
                  </span>
                  <textarea
                    value={workspaceData.globalPrompt}
                    onChange={(event) => updateField('globalPrompt', event.target.value)}
                    rows={5}
                    placeholder="모든 모델에 공통으로 적용할 시스템 프롬프트를 입력하세요."
                  />
                </label>

                <label className="field field--prompt">
                  <span className="field__label">
                    <span className="field__icon" aria-hidden="true">□</span>
                    프로젝트 프롬프트
                  </span>
                  <textarea
                    value={workspaceData.projectPrompt}
                    onChange={(event) => updateField('projectPrompt', event.target.value)}
                    rows={5}
                    placeholder="프로젝트 고유의 맥락과 판단 기준을 입력하세요."
                  />
                </label>

                <label className="field field--full field--question">
                  <span className="field__label">
                    <span className="field__icon" aria-hidden="true">□</span>
                    질문
                  </span>
                  <textarea
                    value={workspaceData.question}
                    onChange={(event) => updateField('question', event.target.value)}
                    rows={4}
                    placeholder="위원회가 논의할 핵심 질문을 입력하세요."
                  />
                </label>
              </div>
            </section>

            <section
              id="final-prompt-preview"
              className="card composer-card section-anchor"
            >
              <div className="card__header">
                <div
                  ref={registerSectionTitle('final-prompt-preview')}
                  id="context-title-final-prompt-preview"
                  data-context-anchor="section-title"
                  data-context-section-id="final-prompt-preview"
                  className="section-heading context-section-anchor"
                >
                  <span className="section-icon" aria-hidden="true">□</span>
                  <div>
                    <p className="section-label">프롬프트 컴포저</p>
                    <h3>최종 프롬프트 미리보기</h3>
                  </div>
                </div>
                <div className="button-row">
                  {['GPT', 'Claude', 'Gemini'].map((label) => (
                    <button
                      key={label}
                      type="button"
                      className="ghost-button btn-secondary ghost-button--compact copy-button"
                      onClick={() => handleCopyPrompt(label)}
                    >
                      {copiedPanel === label ? '✓ Copied' : `${label}용 복사`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="prompt-preview">
                <pre>
                  {effectiveFinalPrompt || '아직 만든 프롬프트가 없습니다. 질문 스튜디오에서 프롬프트 만들기를 실행하세요.'}
                </pre>
              </div>
            </section>

            <section className="card orchestration-card">
              <div className="card__header">
                <div className="section-heading">
                  <span className="section-icon" aria-hidden="true">✦</span>
                  <div>
                    <p className="section-label">API Orchestration Prep</p>
                    <h3>Provider Settings</h3>
                  </div>
                </div>
                <button
                  type="button"
                  className="ghost-button ghost-button--compact"
                  onClick={handleGenerateOrchestrationPacket}
                >
                  오케스트레이션 패킷 생성
                </button>
              </div>

              <div className="orchestration-grid">
                {Object.entries(workspaceData.providerSettings).map(([provider, config]) => (
                  <article key={provider} className="orchestration-provider">
                    <div className="hypothesis-card__header">
                      <div>
                        <strong>{provider.toUpperCase()}</strong>
                        <p>{config.role}</p>
                      </div>
                      <label className="orchestration-toggle">
                        <input
                          type="checkbox"
                          checked={config.enabled}
                          onChange={(event) =>
                            handleProviderSettingChange(
                              provider,
                              'enabled',
                              event.target.checked
                            )
                          }
                        />
                        <span>{config.enabled ? 'enabled' : 'disabled'}</span>
                      </label>
                    </div>

                    <div className="learning-create__grid">
                      <label className="provider-setting-field">
                        <span>Model</span>
                        <input
                          className="hypothesis-input"
                          value={config.modelName}
                          onChange={(event) =>
                            handleProviderSettingChange(
                              provider,
                              'modelName',
                              event.target.value
                            )
                          }
                          placeholder="model name"
                        />
                      </label>
                      <label className="provider-setting-field">
                        <span>Role</span>
                        <input
                          className="hypothesis-input"
                          value={config.role}
                          onChange={(event) =>
                            handleProviderSettingChange(provider, 'role', event.target.value)
                          }
                          placeholder="role"
                        />
                      </label>
                    </div>

                    <div className="learning-create__grid">
                      <label className="provider-setting-field">
                        <span>Temperature</span>
                        <input
                          className="hypothesis-input"
                          type="number"
                          min="0"
                          max="2"
                          step="0.05"
                          value={config.temperature}
                          onChange={(event) =>
                            handleProviderSettingChange(
                              provider,
                              'temperature',
                              Number(event.target.value)
                            )
                          }
                          placeholder="temperature"
                        />
                      </label>
                      <label className="provider-setting-field">
                        <span>Max Tokens</span>
                        <input
                          className="hypothesis-input"
                          type="number"
                          min="1"
                          step="1"
                          value={config.maxTokens}
                          onChange={(event) =>
                            handleProviderSettingChange(
                              provider,
                              'maxTokens',
                              Number(event.target.value)
                            )
                          }
                          placeholder="max tokens"
                        />
                      </label>
                    </div>
                  </article>
                ))}
              </div>

              <section className="orchestration-preview">
                <div className="orchestration-preview__header">
                  <strong>Orchestration Plan Preview</strong>
                  <span>{enabledProviders.length} providers enabled</span>
                </div>

                <div className="orchestration-preview__body">
                  <article className="orchestration-preview__panel">
                    <span className="section-label">final prompt</span>
                    <pre>{orchestrationPlan.finalPrompt || '프롬프트 없음'}</pre>
                  </article>

                  <article className="orchestration-preview__panel">
                    <span className="section-label">enabled providers</span>
                    {enabledProviders.length > 0 ? (
                      <div className="orchestration-preview__providers">
                        {enabledProviders.map((provider) => (
                          <div key={provider.provider} className="orchestration-preview__provider">
                            <div className="hypothesis-card__meta">
                              <span className="timeline-chip">{provider.provider}</span>
                              <span className="timeline-chip">{provider.modelName}</span>
                            </div>
                            <p>{provider.role}</p>
                            <div className="hypothesis-card__meta">
                              <span className="timeline-chip">
                                temperature {provider.temperature}
                              </span>
                              <span className="timeline-chip">
                                maxTokens {provider.maxTokens}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="hypothesis-card__empty">
                        활성화된 provider가 없습니다.
                      </p>
                    )}
                  </article>
                </div>
              </section>
            </section>

            <section className="panel-grid">
              {[
                ['gptResponse', 'GPT', 'gpt-response'],
                ['claudeResponse', 'Claude', 'claude-response'],
                ['geminiResponse', 'Gemini', 'gemini-response'],
              ].map(([key, label, id]) => (
                <article key={key} id={id} className="card response-card section-anchor">
                  <div className="card__header">
                    <div
                      ref={registerSectionTitle(id)}
                      id={`context-title-${id}`}
                      data-context-anchor="section-title"
                      data-context-section-id={id}
                      className="section-heading context-section-anchor"
                    >
                      <span className="section-icon" aria-hidden="true">□</span>
                      <div>
                        <h3>{label}</h3>
                      </div>
                    </div>
                  </div>

                  <label className="field">
                    <span className="field__label field__label--sr-only">
                      <span className="field__icon" aria-hidden="true">□</span>
                      {label} 답변
                    </span>
                    <textarea
                      value={workspaceData[key]}
                      onChange={(event) => updateField(key, event.target.value)}
                      onFocus={() => handleFieldFocus(key)}
                      onBlur={() =>
                        handleFieldCommit(
                          key,
                          'model_response_updated',
                          `${label} 응답 업데이트`,
                          `${label} 응답이 갱신되었습니다.`
                        )
                      }
                      rows={11}
                      placeholder={`${label} 답변을 입력하거나 붙여넣으세요.`}
                    />
                  </label>
                </article>
              ))}
            </section>

            <section className="card analysis-control-card">
              <div className="card__header">
                <div className="section-heading">
                  <span className="section-icon" aria-hidden="true">✦</span>
                  <div>
                    <p className="section-label">합의 엔진</p>
                    <h3>Consensus Engine</h3>
                  </div>
                </div>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={handleAnalyzeCouncil}
                >
                  분석 실행
                </button>
              </div>
              <p className="analysis-control-card__text">
                세 모델 답변을 비교해 합의, 충돌, 고유 통찰을 같은 판단 흐름 안에서 정리합니다.
              </p>
            </section>

            <section className="consensus-engine">
              <section className="analysis-grid analysis-grid--triad">
              {[
                ['consensus', '합의', 'consensus'],
                ['conflict', '충돌', 'conflict'],
                ['uniqueInsight', '고유 통찰', 'unique-insight'],
              ].map(([key, label, id]) => (
                <article key={key} id={id} className="card analysis-card section-anchor">
                  <div className="card__header">
                    <div
                      ref={registerSectionTitle(id)}
                      id={`context-title-${id}`}
                      data-context-anchor="section-title"
                      data-context-section-id={id}
                      className="section-heading context-section-anchor"
                    >
                      <span className="section-icon" aria-hidden="true">□</span>
                      <div>
                        <h3>{label}</h3>
                      </div>
                    </div>
                  </div>

                  <label className="field">
                    <span className="field__label field__label--sr-only">
                      <span className="field__icon" aria-hidden="true">□</span>
                      {label}
                    </span>
                    <textarea
                      value={workspaceData[key]}
                      onChange={(event) => updateField(key, event.target.value)}
                      rows={6}
                      placeholder={`${label} 내용을 정리하세요.`}
                    />
                  </label>
                </article>
              ))}
              </section>
            </section>

            <section
              id="human-decision"
              className="card analysis-card analysis-card--decision section-anchor"
            >
              <div className="card__header">
                <div
                  ref={registerSectionTitle('human-decision')}
                  id="context-title-human-decision"
                  data-context-anchor="section-title"
                  data-context-section-id="human-decision"
                  className="section-heading context-section-anchor"
                >
                  <span className="section-icon" aria-hidden="true">□</span>
                  <div>
                    <h3>인간 판단</h3>
                  </div>
                </div>
              </div>

              <label className="field">
                <span className="field__label field__label--sr-only">
                  <span className="field__icon" aria-hidden="true">□</span>
                  인간 판단
                </span>
                <textarea
                  value={workspaceData.humanDecision}
                  onChange={(event) => updateField('humanDecision', event.target.value)}
                  onFocus={() => handleFieldFocus('humanDecision')}
                  onBlur={() =>
                    handleFieldCommit(
                      'humanDecision',
                      'human_decision_updated',
                      '인간 판단 업데이트',
                      '최종 인간 판단이 갱신되었습니다.'
                    )
                  }
                  rows={8}
                  placeholder="최종 판단과 다음 행동을 정리하세요."
                />
              </label>
            </section>

            <section className="card claims-card">
              <div className="card__header">
                <div className="section-heading">
                  <span className="section-icon" aria-hidden="true">✦</span>
                  <div>
                    <p className="section-label">Claims Engine</p>
                    <h3>클레임 엔진</h3>
                  </div>
                </div>
                <div className="button-row">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={handleExtractClaims}
                  >
                    클레임 추출
                  </button>
                  <button
                    type="button"
                    className="ghost-button btn-secondary utility-action-button decision-graph-button"
                    onClick={handleBuildGraph}
                  >
                    Build Graph
                  </button>
                  {workspaceData.decisionGraph.nodes.length > 0 || graphBuildFeedback ? (
                    <div className="graph-build-feedback" aria-live="polite">
                      <span>Nodes: {workspaceData.decisionGraph.nodes.length}</span>
                      <span>Edges: {workspaceData.decisionGraph.edges.length}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {groupedClaims.length > 0 ? (
                <div className="claims-groups">
                  {groupedClaims.map((group) => (
                    <section key={group.source} className="claims-group">
                      <div className="claims-group__header">
                        <strong>{group.label}</strong>
                        <span>{group.claims.length} claims</span>
                      </div>

                      <div className="claims-list">
                        {group.claims.map((claim) => (
                          <article
                            key={claim.id}
                            id={`claim-${claim.id}`}
                            className="claim-card"
                          >
                            <textarea
                              className="claim-card__text"
                              value={claim.text}
                              onFocus={() => handleClaimFocus(claim)}
                              onBlur={() => handleClaimBlur(claim.id)}
                              onChange={(event) =>
                                handleClaimTextChange(claim.id, event.target.value)
                              }
                              rows={3}
                            />

                            <div className="claim-card__controls">
                              <select
                                className="claim-card__select"
                                value={claim.status}
                                onChange={(event) =>
                                  handleClaimStatusChange(claim.id, event.target.value)
                                }
                              >
                                <option value="accepted">accepted</option>
                                <option value="pending">pending</option>
                                <option value="rejected">rejected</option>
                              </select>

                              <select
                                className="claim-card__select"
                                value={claim.stance}
                                onChange={(event) =>
                                  handleClaimStanceChange(claim.id, event.target.value)
                                }
                              >
                                <option value="support">support</option>
                                <option value="oppose">oppose</option>
                                <option value="neutral">neutral</option>
                                <option value="unknown">unknown</option>
                              </select>

                              <div className="claim-card__meta">
                                <span className="timeline-chip">{claim.source}</span>
                                <span className="timeline-chip">{claim.confidence}</span>
                                <span className={`timeline-chip timeline-chip--claim-status-${claim.status}`}>
                                  {claim.status}
                                </span>
                              </div>

                              <button
                                type="button"
                                className="ghost-button ghost-button--compact claim-card__delete"
                                onClick={() => handleDeleteClaim(claim.id)}
                              >
                                삭제
                              </button>
                            </div>

                            <textarea
                              className="claim-card__reason"
                              value={claim.decisionReason}
                              onFocus={() => handleClaimFocus(claim)}
                              onBlur={() => handleClaimReasonBlur(claim.id)}
                              onChange={(event) =>
                                handleClaimReasonChange(claim.id, event.target.value)
                              }
                              rows={2}
                              placeholder="판단 근거를 선택적으로 기록하세요."
                            />
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <p className="claims-card__empty">
                  아직 추출된 클레임이 없습니다. 응답과 분석 텍스트를 입력한 뒤 클레임 추출을 실행하세요.
                </p>
              )}
            </section>

            <section className="card decision-state-card">
              <div className="card__header">
                <div className="section-heading">
                  <span className="section-icon" aria-hidden="true">✦</span>
                  <div>
                    <p className="section-label">Decision State Engine</p>
                    <h3>결정 상태</h3>
                  </div>
                </div>
              </div>

              <div className="decision-state-summary">
                <div className="decision-state-summary__item">
                  <span>accepted</span>
                  <strong>{decisionStateSummary.acceptedCount}</strong>
                </div>
                <div className="decision-state-summary__item">
                  <span>pending</span>
                  <strong>{decisionStateSummary.pendingCount}</strong>
                </div>
                <div className="decision-state-summary__item">
                  <span>rejected</span>
                  <strong>{decisionStateSummary.rejectedCount}</strong>
                </div>
                <div className="decision-state-summary__item decision-state-summary__item--wide">
                  <span>latest accepted</span>
                  <strong>{decisionStateSummary.latestAccepted}</strong>
                </div>
              </div>

              <div className="decision-state-groups">
                {groupedClaimsByStatus.map((group) => (
                  <section key={group.status} className="decision-state-group">
                    <div className="decision-state-group__header">
                      <strong>{group.label}</strong>
                      <span>{group.claims.length}</span>
                    </div>

                    {group.claims.length > 0 ? (
                      <div className="decision-state-list">
                        {group.claims.map((claim) => (
                          <article key={claim.id} className="decision-state-item">
                            <p className="decision-state-item__text">{claim.text}</p>
                            <div className="decision-state-item__meta">
                              <span className="timeline-chip">{claim.source}</span>
                              {claim.decisionReason ? (
                                <span className="timeline-chip">
                                  {buildTimelineSummary(claim.decisionReason, 'reason')}
                                </span>
                              ) : null}
                              {claim.decidedAt ? (
                                <span className="timeline-chip">
                                  {new Date(claim.decidedAt).toLocaleString('ko-KR')}
                                </span>
                              ) : null}
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="decision-state-group__empty">
                        해당 상태의 클레임이 없습니다.
                      </p>
                    )}
                  </section>
                ))}
              </div>
            </section>

            <section className="card hypothesis-card">
              <div className="card__header">
                <div className="section-heading">
                  <span className="section-icon" aria-hidden="true">✦</span>
                  <div>
                    <p className="section-label">Hypothesis Engine</p>
                    <h3>가설 엔진</h3>
                  </div>
                </div>
              </div>

              <div className="hypothesis-summary">
                <div className="hypothesis-summary__item">
                  <span>active</span>
                  <strong>{activeHypotheses.length}</strong>
                </div>
                <div className="hypothesis-summary__item hypothesis-summary__item--wide">
                  <span>latest hypothesis</span>
                  <strong>{latestHypothesisSummary}</strong>
                </div>
              </div>

              <section className="hypothesis-create">
                <div className="hypothesis-create__grid">
                  <input
                    className={`hypothesis-input ${
                      hypothesisError ? 'field-error' : ''
                    }`}
                    value={hypothesisDraft.title}
                    onChange={(event) => {
                      setHypothesisDraft((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                      setHypothesisError('')
                    }}
                    placeholder="가설 제목"
                  />
                  <select
                    className="claim-card__select"
                    value={hypothesisDraft.confidence}
                    onChange={(event) =>
                      setHypothesisDraft((current) => ({
                        ...current,
                        confidence: event.target.value,
                      }))
                    }
                  >
                    <option value="high">high</option>
                    <option value="medium">medium</option>
                    <option value="low">low</option>
                    <option value="unknown">unknown</option>
                  </select>
                </div>
                {hypothesisError ? (
                  <p className="inline-form-error">{hypothesisError}</p>
                ) : null}
                <textarea
                  className="hypothesis-textarea"
                  value={hypothesisDraft.description}
                  onChange={(event) =>
                    setHypothesisDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="가설 설명"
                />
                <div className="button-row">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={handleCreateHypothesis}
                  >
                    가설 생성
                  </button>
                </div>
              </section>

              {workspaceData.hypotheses.length > 0 ? (
                <div className="hypothesis-groups">
                  <section className="hypothesis-group">
                    <div className="hypothesis-group__header">
                      <strong>Active Hypotheses</strong>
                      <span>{activeHypotheses.length}</span>
                    </div>

                    <div className="hypothesis-list">
                      {activeHypotheses.map((hypothesis) => (
                        <article key={hypothesis.id} className="hypothesis-card__item">
                          <div className="hypothesis-card__header">
                            <div>
                              <strong>{hypothesis.title}</strong>
                              <p>{hypothesis.description || '설명 없음'}</p>
                            </div>
                            <div className="hypothesis-card__status">
                              <span className={`timeline-chip timeline-chip--hypothesis-status-${hypothesis.status}`}>
                                {hypothesis.status}
                              </span>
                              <select
                                className="claim-card__select"
                                value={hypothesis.status}
                                onChange={(event) =>
                                  handleHypothesisStatusChange(
                                    hypothesis.id,
                                    event.target.value
                                  )
                                }
                              >
                                <option value="active">active</option>
                                <option value="validated">validated</option>
                                <option value="invalidated">invalidated</option>
                                <option value="archived">archived</option>
                              </select>
                            </div>
                          </div>

                          <div className="hypothesis-card__meta">
                            <span className="timeline-chip">{hypothesis.confidence}</span>
                            <span className="timeline-chip">
                              supports {hypothesisMetrics[hypothesis.id]?.supportingCount || 0}
                            </span>
                            <span className="timeline-chip">
                              contradicts {hypothesisMetrics[hypothesis.id]?.contradictingCount || 0}
                            </span>
                          </div>

                          <div className="hypothesis-card__claims">
                            {acceptedClaims.length > 0 ? (
                              acceptedClaims.map((claim) => (
                                <label
                                  key={`${hypothesis.id}-${claim.id}`}
                                  className="hypothesis-claim-link"
                                >
                                  <input
                                    type="checkbox"
                                    checked={hypothesis.linkedClaimIds.includes(claim.id)}
                                    onChange={() =>
                                      handleHypothesisClaimToggle(hypothesis.id, claim.id)
                                    }
                                  />
                                  <span>{claim.text}</span>
                                </label>
                              ))
                            ) : (
                              <p className="hypothesis-card__empty">
                                linked claims를 위해 accepted 클레임이 필요합니다.
                              </p>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="hypothesis-group">
                    <div className="hypothesis-group__header">
                      <strong>All Hypotheses</strong>
                      <span>{workspaceData.hypotheses.length}</span>
                    </div>
                    <div className="hypothesis-list hypothesis-list--compact">
                      {workspaceData.hypotheses.map((hypothesis) => (
                        <article
                          key={`summary-${hypothesis.id}`}
                          id={`hypothesis-${hypothesis.id}`}
                          className="hypothesis-summary-card"
                        >
                          <strong>{hypothesis.title}</strong>
                          <div className="hypothesis-card__meta">
                            <span className={`timeline-chip timeline-chip--hypothesis-status-${hypothesis.status}`}>
                              {getHypothesisStatusLabel(hypothesis.status)}
                            </span>
                            <span className="timeline-chip">
                              claims {hypothesis.linkedClaimIds.length}
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              ) : (
                <p className="hypothesis-card__empty">
                  아직 가설이 없습니다. 수동으로 가설을 만들고 accepted claim을 연결하세요.
                </p>
              )}
            </section>

            <section className="card experiment-card">
              <div className="card__header">
                <div className="section-heading">
                  <span className="section-icon" aria-hidden="true">✦</span>
                  <div>
                    <p className="section-label">Experiment Engine</p>
                    <h3>실험 엔진</h3>
                  </div>
                </div>
              </div>

              <div className="experiment-summary">
                <div className="experiment-summary__item">
                  <span>active experiments</span>
                  <strong>{activeExperiments.length}</strong>
                </div>
                <div className="experiment-summary__item experiment-summary__item--wide">
                  <span>testing belief</span>
                  <strong>
                    {activeExperiments[0]?.title || '아직 진행 중인 실험이 없습니다.'}
                  </strong>
                </div>
              </div>

              <section
                className={`experiment-create ${
                  workspaceData.hypotheses.length === 0 ? 'experiment-create--disabled' : ''
                }`}
              >
                {workspaceData.hypotheses.length === 0 ? (
                  <p className="experiment-create__guidance">
                    Create or accept a hypothesis before creating experiments.
                  </p>
                ) : null}
                <div className="experiment-create__grid">
                  <input
                    className="hypothesis-input"
                    disabled={workspaceData.hypotheses.length === 0}
                    value={experimentDraft.title}
                    onChange={(event) =>
                      setExperimentDraft((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="실험 제목"
                  />
                </div>
                <textarea
                  className="hypothesis-textarea"
                  disabled={workspaceData.hypotheses.length === 0}
                  value={experimentDraft.description}
                  onChange={(event) =>
                    setExperimentDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="실험 설명"
                />
                <textarea
                  className="hypothesis-textarea"
                  disabled={workspaceData.hypotheses.length === 0}
                  value={experimentDraft.expectedOutcome}
                  onChange={(event) =>
                    setExperimentDraft((current) => ({
                      ...current,
                      expectedOutcome: event.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="예상 결과"
                />
                <div
                  className={`experiment-hypothesis-links ${
                    experimentError ? 'field-error-group' : ''
                  }`}
                >
                  {workspaceData.hypotheses.length > 0
                    ? workspaceData.hypotheses.map((hypothesis) => (
                      <label
                        key={`experiment-link-${hypothesis.id}`}
                        className="hypothesis-claim-link"
                      >
                        <input
                          type="checkbox"
                          checked={experimentDraft.linkedHypothesisIds.includes(hypothesis.id)}
                          onChange={() => handleExperimentHypothesisToggle(hypothesis.id)}
                        />
                        <span>{hypothesis.title}</span>
                      </label>
                    ))
                    : null}
                </div>
                {experimentError ? (
                  <p className="inline-form-error">{experimentError}</p>
                ) : null}
                <div className="button-row">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={handleCreateExperiment}
                    disabled={workspaceData.hypotheses.length === 0}
                  >
                    실험 생성
                  </button>
                </div>
              </section>

              {workspaceData.experiments.length > 0 ? (
                <div className="experiment-groups">
                  {groupedExperimentsByStatus.map((group) => (
                  <section key={group.status} className="experiment-group">
                    <div className="experiment-group__header">
                      <strong>{group.label}</strong>
                      <span>{group.experiments.length}</span>
                    </div>

                    {group.experiments.length > 0 ? (
                      <div className="experiment-list">
                        {group.experiments.map((experiment) => (
                          <article
                            key={experiment.id}
                            id={`experiment-${experiment.id}`}
                            className="experiment-item"
                          >
                            <div className="hypothesis-card__header">
                              <div>
                                <strong>{experiment.title}</strong>
                                <p>{experiment.description || '설명 없음'}</p>
                              </div>
                              <div className="hypothesis-card__status">
                                <span className={`timeline-chip timeline-chip--experiment-status-${experiment.status}`}>
                                  {experiment.status}
                                </span>
                                <select
                                  className="claim-card__select"
                                  value={experiment.status}
                                  onChange={(event) =>
                                    handleExperimentStatusChange(
                                      experiment.id,
                                      event.target.value
                                    )
                                  }
                                >
                                  <option value="planned">planned</option>
                                  <option value="running">running</option>
                                  <option value="completed">completed</option>
                                  <option value="failed">failed</option>
                                  <option value="cancelled">cancelled</option>
                                </select>
                              </div>
                            </div>

                            <textarea
                              className="hypothesis-textarea"
                              value={experiment.expectedOutcome}
                              onChange={(event) =>
                                handleExperimentFieldChange(
                                  experiment.id,
                                  'expectedOutcome',
                                  event.target.value
                                )
                              }
                              rows={2}
                              placeholder="예상 결과"
                            />

                            <textarea
                              className="hypothesis-textarea"
                              value={experiment.actualOutcome}
                              onChange={(event) =>
                                handleExperimentFieldChange(
                                  experiment.id,
                                  'actualOutcome',
                                  event.target.value
                                )
                              }
                              rows={2}
                              placeholder="실제 결과"
                            />

                            <div className="hypothesis-card__meta">
                              <span className="timeline-chip">
                                hypotheses {experiment.linkedHypothesisIds.length}
                              </span>
                              <span className="timeline-chip">
                                claims {experiment.linkedClaimIds.length}
                              </span>
                              {experiment.completedAt ? (
                                <span className="timeline-chip">
                                  {new Date(experiment.completedAt).toLocaleString('ko-KR')}
                                </span>
                              ) : null}
                            </div>

                            <div className="button-row">
                              <button
                                type="button"
                                className="ghost-button ghost-button--compact claim-card__delete"
                                onClick={() => handleDeleteExperiment(experiment.id)}
                              >
                                삭제
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="hypothesis-card__empty">
                        해당 상태의 실험이 없습니다.
                      </p>
                    )}
                  </section>
                  ))}
                </div>
              ) : (
                <p className="hypothesis-card__empty">
                  아직 실험이 없습니다. 가설에서 실험을 생성하세요.
                </p>
              )}
            </section>

            <section className="card learning-card">
              <div className="card__header">
                <div className="section-heading">
                  <span className="section-icon" aria-hidden="true">✦</span>
                  <div>
                    <p className="section-label">Learning Engine</p>
                    <h3>학습 엔진</h3>
                  </div>
                </div>
              </div>

              <div className="learning-summary">
                <div className="learning-summary__item">
                  <span>latest learning</span>
                  <strong>{latestLearningSummary.title}</strong>
                </div>
                <div className="learning-summary__item">
                  <span>result</span>
                  <strong>{latestLearningSummary.result}</strong>
                </div>
                <div className="learning-summary__item learning-summary__item--wide">
                  <span>next action</span>
                  <strong>{latestLearningSummary.nextAction}</strong>
                </div>
              </div>

              <section className="learning-create">
                <div className="learning-create__grid">
                  <select
                    className="claim-card__select"
                    value={learningDraft.experimentId}
                    onChange={(event) => handleLearningExperimentChange(event.target.value)}
                  >
                    {eligibleLearningExperiments.length > 0 ? (
                      eligibleLearningExperiments.map((experiment) => (
                        <option key={experiment.id} value={experiment.id}>
                          {experiment.title}
                        </option>
                      ))
                    ) : (
                      <option value="">완료/실패한 실험 없음</option>
                    )}
                  </select>

                  <select
                    className="claim-card__select"
                    value={learningDraft.hypothesisId}
                    onChange={(event) =>
                      setLearningDraft((current) => ({
                        ...current,
                        hypothesisId: event.target.value,
                      }))
                    }
                  >
                    {(
                      workspaceData.hypotheses.filter((hypothesis) => {
                        const experiment = eligibleLearningExperiments.find(
                          (item) => item.id === learningDraft.experimentId
                        )

                        return experiment?.linkedHypothesisIds.includes(hypothesis.id)
                      }) || []
                    ).map((hypothesis) => (
                      <option key={hypothesis.id} value={hypothesis.id}>
                        {hypothesis.title}
                      </option>
                    ))}
                    <option value="">연결된 가설 없음</option>
                  </select>
                </div>

                <input
                  className="hypothesis-input"
                  value={learningDraft.title}
                  onChange={(event) =>
                    setLearningDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="학습 제목"
                />

                <textarea
                  className="hypothesis-textarea"
                  value={learningDraft.summary}
                  onChange={(event) =>
                    setLearningDraft((current) => ({
                      ...current,
                      summary: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="무엇을 배웠는지 기록하세요."
                />

                <div className="learning-create__grid">
                  <select
                    className="claim-card__select"
                    value={learningDraft.result}
                    onChange={(event) =>
                      setLearningDraft((current) => ({
                        ...current,
                        result: event.target.value,
                      }))
                    }
                  >
                    <option value="validated">validated</option>
                    <option value="invalidated">invalidated</option>
                    <option value="inconclusive">inconclusive</option>
                    <option value="partial">partial</option>
                  </select>

                  <select
                    className="claim-card__select"
                    value={learningDraft.impact}
                    onChange={(event) =>
                      setLearningDraft((current) => ({
                        ...current,
                        impact: event.target.value,
                      }))
                    }
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                </div>

                <textarea
                  className="hypothesis-textarea"
                  value={learningDraft.nextAction}
                  onChange={(event) =>
                    setLearningDraft((current) => ({
                      ...current,
                      nextAction: event.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="다음 액션"
                />

                <div className="button-row">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={handleCreateLearning}
                    disabled={eligibleLearningExperiments.length === 0}
                  >
                    학습 생성
                  </button>
                </div>
              </section>

              {workspaceData.learnings.length > 0 ? (
                <div className="learning-groups">
                  {groupedLearningsByResult.map((group) => (
                    <section key={group.result} className="learning-group">
                      <div className="learning-group__header">
                        <strong>{group.label}</strong>
                        <span>{group.learnings.length}</span>
                      </div>

                      {group.learnings.length > 0 ? (
                        <div className="learning-list">
                          {group.learnings.map((learning) => {
                            const experiment = workspaceData.experiments.find(
                              (item) => item.id === learning.experimentId
                            )
                            const hypothesis = workspaceData.hypotheses.find(
                              (item) => item.id === learning.hypothesisId
                            )

                            return (
                              <article key={learning.id} className="learning-item">
                                <div className="hypothesis-card__header">
                                  <div>
                                    <strong>{learning.title}</strong>
                                    <p>{learning.summary || '요약 없음'}</p>
                                  </div>
                                  <div className="hypothesis-card__status">
                                    <span className={`timeline-chip timeline-chip--learning-result-${learning.result}`}>
                                      {learning.result}
                                    </span>
                                    <select
                                      className="claim-card__select"
                                      value={learning.result}
                                      onChange={(event) =>
                                        handleLearningResultChange(
                                          learning.id,
                                          event.target.value
                                        )
                                      }
                                      onFocus={() => handleLearningFocus(learning)}
                                    >
                                      <option value="validated">validated</option>
                                      <option value="invalidated">invalidated</option>
                                      <option value="inconclusive">inconclusive</option>
                                      <option value="partial">partial</option>
                                    </select>
                                  </div>
                                </div>

                                <input
                                  className="hypothesis-input"
                                  value={learning.title}
                                  onFocus={() => handleLearningFocus(learning)}
                                  onBlur={() => handleLearningBlur(learning.id)}
                                  onChange={(event) =>
                                    handleLearningFieldChange(
                                      learning.id,
                                      'title',
                                      event.target.value
                                    )
                                  }
                                  placeholder="학습 제목"
                                />

                                <textarea
                                  className="hypothesis-textarea"
                                  value={learning.summary}
                                  onFocus={() => handleLearningFocus(learning)}
                                  onBlur={() => handleLearningBlur(learning.id)}
                                  onChange={(event) =>
                                    handleLearningFieldChange(
                                      learning.id,
                                      'summary',
                                      event.target.value
                                    )
                                  }
                                  rows={3}
                                  placeholder="학습 요약"
                                />

                                <div className="learning-create__grid">
                                  <select
                                    className="claim-card__select"
                                    value={learning.impact}
                                    onFocus={() => handleLearningFocus(learning)}
                                    onBlur={() => handleLearningBlur(learning.id)}
                                    onChange={(event) =>
                                      handleLearningFieldChange(
                                        learning.id,
                                        'impact',
                                        event.target.value
                                      )
                                    }
                                  >
                                    <option value="low">low</option>
                                    <option value="medium">medium</option>
                                    <option value="high">high</option>
                                  </select>
                                  <div className="learning-item__meta">
                                    <span className="timeline-chip">
                                      {experiment?.title || '실험 없음'}
                                    </span>
                                    <span className="timeline-chip">
                                      {hypothesis?.title || '가설 없음'}
                                    </span>
                                  </div>
                                </div>

                                <textarea
                                  className="hypothesis-textarea"
                                  value={learning.nextAction}
                                  onFocus={() => handleLearningFocus(learning)}
                                  onBlur={() => handleLearningBlur(learning.id)}
                                  onChange={(event) =>
                                    handleLearningFieldChange(
                                      learning.id,
                                      'nextAction',
                                      event.target.value
                                    )
                                  }
                                  rows={2}
                                  placeholder="다음 액션"
                                />

                                <div className="hypothesis-card__meta">
                                  <span className={`timeline-chip timeline-chip--learning-impact-${learning.impact}`}>
                                    {getLearningImpactLabel(learning.impact)}
                                  </span>
                                  <span className="timeline-chip">
                                    claims {learning.linkedClaimIds.length}
                                  </span>
                                  <span className="timeline-chip">
                                    {new Date(learning.updatedAt).toLocaleString('ko-KR')}
                                  </span>
                                </div>

                                <div className="button-row">
                                  <button
                                    type="button"
                                    className="ghost-button ghost-button--compact claim-card__delete"
                                    onClick={() => handleDeleteLearning(learning.id)}
                                  >
                                    삭제
                                  </button>
                                </div>
                              </article>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="hypothesis-card__empty">
                          해당 결과의 학습이 없습니다.
                        </p>
                      )}
                    </section>
                  ))}
                </div>
              ) : (
                <p className="hypothesis-card__empty">
                  아직 학습 기록이 없습니다. 완료 또는 실패한 실험에서 학습을 생성하세요.
                </p>
              )}
            </section>

            <section className="card evolution-card">
              <div className="card__header">
                <div className="section-heading">
                  <span className="section-icon" aria-hidden="true">✦</span>
                  <div>
                    <p className="section-label">Evolution Engine</p>
                    <h3>진화 엔진</h3>
                  </div>
                </div>
              </div>

              <div className="learning-summary">
                <div className="learning-summary__item">
                  <span>evolutions</span>
                  <strong>{workspaceData.evolutions.length}</strong>
                </div>
                <div className="learning-summary__item learning-summary__item--wide">
                  <span>latest evolution</span>
                  <strong>{latestEvolutionSummary}</strong>
                </div>
              </div>

              <section className="learning-create">
                <div className="learning-create__grid">
                  <select
                    className="claim-card__select"
                    value={evolutionDraft.learningId}
                    onChange={(event) => handleEvolutionLearningChange(event.target.value)}
                  >
                    {eligibleEvolutionLearnings.length > 0 ? (
                      eligibleEvolutionLearnings.map((learning) => (
                        <option key={learning.id} value={learning.id}>
                          {learning.title}
                        </option>
                      ))
                    ) : (
                      <option value="">학습 기록 없음</option>
                    )}
                  </select>
                  <select
                    className="claim-card__select"
                    value={evolutionDraft.type}
                    onChange={(event) =>
                      setEvolutionDraft((current) => ({
                        ...current,
                        type: event.target.value,
                      }))
                    }
                  >
                    <option value="refine">refine</option>
                    <option value="pivot">pivot</option>
                    <option value="expand">expand</option>
                    <option value="retire">retire</option>
                  </select>
                </div>

                <textarea
                  className="hypothesis-textarea"
                  value={evolutionDraft.reason}
                  onChange={(event) =>
                    setEvolutionDraft((current) => ({
                      ...current,
                      reason: event.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="왜 이 방향으로 진화해야 하는지 기록하세요."
                />

                <label className="hypothesis-claim-link">
                  <input
                    type="checkbox"
                    checked={evolutionDraft.createHypothesis}
                    onChange={(event) =>
                      setEvolutionDraft((current) => ({
                        ...current,
                        createHypothesis: event.target.checked,
                      }))
                    }
                  />
                  <span>진화된 가설 생성</span>
                </label>

                {evolutionDraft.createHypothesis ? (
                  <>
                    <div className="learning-create__grid">
                      <input
                        className="hypothesis-input"
                        value={evolutionDraft.evolvedHypothesisTitle}
                        onChange={(event) =>
                          setEvolutionDraft((current) => ({
                            ...current,
                            evolvedHypothesisTitle: event.target.value,
                          }))
                        }
                        placeholder="진화된 가설 제목"
                      />
                      <select
                        className="claim-card__select"
                        value={evolutionDraft.evolvedHypothesisConfidence}
                        onChange={(event) =>
                          setEvolutionDraft((current) => ({
                            ...current,
                            evolvedHypothesisConfidence: event.target.value,
                          }))
                        }
                      >
                        <option value="high">high</option>
                        <option value="medium">medium</option>
                        <option value="low">low</option>
                        <option value="unknown">unknown</option>
                      </select>
                    </div>
                    <textarea
                      className="hypothesis-textarea"
                      value={evolutionDraft.evolvedHypothesisDescription}
                      onChange={(event) =>
                        setEvolutionDraft((current) => ({
                          ...current,
                          evolvedHypothesisDescription: event.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="진화된 가설 설명"
                    />
                  </>
                ) : null}

                <label className="hypothesis-claim-link">
                  <input
                    type="checkbox"
                    checked={evolutionDraft.createNextExperiment}
                    onChange={(event) =>
                      setEvolutionDraft((current) => ({
                        ...current,
                        createNextExperiment: event.target.checked,
                      }))
                    }
                  />
                  <span>다음 실험 연결</span>
                </label>

                {evolutionDraft.createNextExperiment ? (
                  <>
                    <input
                      className="hypothesis-input"
                      value={evolutionDraft.nextExperimentTitle}
                      onChange={(event) =>
                        setEvolutionDraft((current) => ({
                          ...current,
                          nextExperimentTitle: event.target.value,
                        }))
                      }
                      placeholder="다음 실험 제목"
                    />
                    <textarea
                      className="hypothesis-textarea"
                      value={evolutionDraft.nextExperimentDescription}
                      onChange={(event) =>
                        setEvolutionDraft((current) => ({
                          ...current,
                          nextExperimentDescription: event.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="다음 실험 설명"
                    />
                    <textarea
                      className="hypothesis-textarea"
                      value={evolutionDraft.nextExperimentExpectedOutcome}
                      onChange={(event) =>
                        setEvolutionDraft((current) => ({
                          ...current,
                          nextExperimentExpectedOutcome: event.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="다음 실험 예상 결과"
                    />
                  </>
                ) : null}

                <div className="button-row">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={handleCreateEvolution}
                    disabled={eligibleEvolutionLearnings.length === 0}
                  >
                    진화 생성
                  </button>
                </div>
              </section>

              {evolutionChains.length > 0 ? (
                <div className="learning-groups">
                  <section className="learning-group">
                    <div className="learning-group__header">
                      <strong>Evolution Chain</strong>
                      <span>{evolutionChains.length}</span>
                    </div>
                    <div className="learning-list">
                      {evolutionChains.map((chain) => (
                        <article key={chain.evolution.id} className="learning-item">
                          <div className="hypothesis-card__meta evolution-chain">
                            <span className="timeline-chip">
                              {chain.fromHypothesis?.title || '가설 없음'}
                            </span>
                            <span className="evolution-chain__arrow">→</span>
                            <span className="timeline-chip">
                              {chain.experiment?.title || '실험 없음'}
                            </span>
                            <span className="evolution-chain__arrow">→</span>
                            <span className="timeline-chip">
                              {chain.learning?.title || '학습 없음'}
                            </span>
                            <span className="evolution-chain__arrow">→</span>
                            <span className={`timeline-chip timeline-chip--evolution-type-${chain.evolution.type}`}>
                              {getEvolutionTypeLabel(chain.evolution.type)}
                            </span>
                            {chain.toHypothesis ? (
                              <>
                                <span className="evolution-chain__arrow">→</span>
                                <span className="timeline-chip">
                                  {chain.toHypothesis.title}
                                </span>
                              </>
                            ) : null}
                            {chain.nextExperiment ? (
                              <>
                                <span className="evolution-chain__arrow">→</span>
                                <span className="timeline-chip">
                                  {chain.nextExperiment.title}
                                </span>
                              </>
                            ) : null}
                          </div>
                          <p className="graph-node-card__label">{chain.evolution.reason}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              ) : (
                <p className="hypothesis-card__empty">
                  아직 진화 기록이 없습니다. 학습에서 다음 가설과 실험을 파생시키세요.
                </p>
              )}
            </section>

            <section id="decision-tools" className="card graph-card section-anchor">
              <div className="card__header">
                <div
                  ref={registerSectionTitle('decision-tools')}
                  id="context-title-decision-tools"
                  data-context-anchor="section-title"
                  data-context-section-id="decision-tools"
                  className="section-heading context-section-anchor"
                >
                  <span className="section-icon" aria-hidden="true">✦</span>
                  <div>
                    <p className="section-label">Decision Tools</p>
                    <h3>{decisionToolTab === 'graph' ? '디시전 그래프' : '전략 시뮬레이터'}</h3>
                  </div>
                </div>
                <div className="decision-tool-tabs" role="tablist" aria-label="Decision tools">
                  <button
                    type="button"
                    className={`decision-tool-tab ${
                      decisionToolTab === 'graph' ? 'decision-tool-tab--active' : ''
                    }`}
                    onClick={() => setDecisionToolTab('graph')}
                  >
                    Decision Graph
                  </button>
                  <button
                    type="button"
                    className={`decision-tool-tab ${
                      decisionToolTab === 'strategy' ? 'decision-tool-tab--active' : ''
                    }`}
                    onClick={() => setDecisionToolTab('strategy')}
                  >
                    Strategy Simulator
                  </button>
                </div>
              </div>

              {decisionToolTab === 'graph' ? (
                <div className="decision-tool-panel">
                  <section className="decision-node-create">
                    <div className="learning-create__grid">
                      <input
                        className="hypothesis-input"
                        value={decisionNodeDraft.title}
                        onChange={(event) =>
                          setDecisionNodeDraft((current) => ({
                            ...current,
                            title: event.target.value,
                          }))
                        }
                        placeholder="결정 노드 제목"
                      />
                      <select
                        className="claim-card__select"
                        value={decisionNodeDraft.confidence}
                        onChange={(event) =>
                          setDecisionNodeDraft((current) => ({
                            ...current,
                            confidence: event.target.value,
                          }))
                        }
                      >
                        <option value="high">high</option>
                        <option value="medium">medium</option>
                        <option value="low">low</option>
                        <option value="unknown">unknown</option>
                      </select>
                    </div>
                    <textarea
                      className="hypothesis-textarea"
                      value={decisionNodeDraft.description}
                      onChange={(event) =>
                        setDecisionNodeDraft((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="결정 노드 설명"
                    />
                    <div className="button-row">
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={handleCreateDecisionNode}
                      >
                        노드 생성
                      </button>
                    </div>
                  </section>

                  {workspaceData.decisionNodes.nodes.length > 1 ? (
                    <section className="decision-node-create">
                      <div className="learning-create__grid">
                        <select
                          className="claim-card__select"
                          value={decisionNodeLinkDraft.fromNodeId}
                          onChange={(event) =>
                            setDecisionNodeLinkDraft((current) => ({
                              ...current,
                              fromNodeId: event.target.value,
                            }))
                          }
                        >
                          <option value="">from node</option>
                          {workspaceData.decisionNodes.nodes.map((node) => (
                            <option key={`from-${node.id}`} value={node.id}>
                              {node.title}
                            </option>
                          ))}
                        </select>
                        <select
                          className="claim-card__select"
                          value={decisionNodeLinkDraft.toNodeId}
                          onChange={(event) =>
                            setDecisionNodeLinkDraft((current) => ({
                              ...current,
                              toNodeId: event.target.value,
                            }))
                          }
                        >
                          <option value="">to node</option>
                          {workspaceData.decisionNodes.nodes.map((node) => (
                            <option key={`to-${node.id}`} value={node.id}>
                              {node.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="learning-create__grid">
                        <select
                          className="claim-card__select"
                          value={decisionNodeLinkDraft.relation}
                          onChange={(event) =>
                            setDecisionNodeLinkDraft((current) => ({
                              ...current,
                              relation: event.target.value,
                            }))
                          }
                        >
                          <option value="supports">supports</option>
                          <option value="contradicts">contradicts</option>
                          <option value="depends_on">depends_on</option>
                          <option value="replaces">replaces</option>
                        </select>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={handleCreateDecisionNodeLink}
                        >
                          노드 연결
                        </button>
                      </div>
                    </section>
                  ) : null}

                  <div className="graph-layout">
                    <section className="graph-panel">
                      <div className="graph-panel__header">
                        <strong>Decision Nodes</strong>
                        <span>{workspaceData.decisionNodes.nodes.length}</span>
                      </div>

                      {workspaceData.decisionNodes.nodes.length > 0 ? (
                        <div className="graph-node-list">
                          {workspaceData.decisionNodes.nodes.map((node) => (
                            <article key={node.id} className="graph-node-card">
                              <p className="graph-node-card__label">{node.title}</p>
                              <p className="hypothesis-card__empty">
                                {node.description || '설명 없음'}
                              </p>
                              <div className="graph-node-card__meta">
                                <span className="timeline-chip">{node.type}</span>
                                <span className="timeline-chip">{node.confidence}</span>
                                <button
                                  type="button"
                                  className="ghost-button ghost-button--compact claim-card__delete"
                                  onClick={() => handleDeleteDecisionNode(node.id)}
                                >
                                  삭제
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <p className="graph-card__empty">
                          아직 수동 결정 노드가 없습니다.
                        </p>
                      )}
                    </section>

                    <section className="graph-panel">
                      <div className="graph-panel__header">
                        <strong>Decision Node Links</strong>
                        <span>{workspaceData.decisionNodes.links.length}</span>
                      </div>

                      {groupedDecisionNodeLinks.length > 0 ? (
                        <div className="graph-groups">
                          {groupedDecisionNodeLinks.map((group) => (
                            <section key={group.relation} className="graph-group">
                              <div className="graph-group__header">
                                <strong>{group.label}</strong>
                                <span>{group.links.length}</span>
                              </div>
                              <div className="graph-edge-list">
                                {group.links.map((link) => (
                                  <article key={link.id} className="graph-edge-card">
                                    <p className="graph-edge-card__labels">
                                      <span>{getDecisionNodeLabelById(link.fromNodeId)}</span>
                                      <span className="graph-edge-card__arrow">→</span>
                                      <span>{getDecisionNodeLabelById(link.toNodeId)}</span>
                                    </p>
                                    <div className="graph-edge-card__controls">
                                      <span className="timeline-chip">{link.relation}</span>
                                      <button
                                        type="button"
                                        className="ghost-button ghost-button--compact claim-card__delete"
                                        onClick={() => handleDeleteDecisionNodeLink(link.id)}
                                      >
                                        삭제
                                      </button>
                                    </div>
                                  </article>
                                ))}
                              </div>
                            </section>
                          ))}
                        </div>
                      ) : (
                        <p className="graph-card__empty">
                          아직 연결된 결정 노드가 없습니다.
                        </p>
                      )}
                    </section>
                  </div>

                  {workspaceData.decisionGraph.nodes.length > 0 ? (
                    <div className="graph-layout">
                      <section className="graph-panel">
                        <div className="graph-panel__header">
                          <strong>Claim Graph Nodes</strong>
                          <span>{workspaceData.decisionGraph.nodes.length}</span>
                        </div>

                        <div className="graph-groups">
                          {groupedGraphNodes.map((group) => (
                            <section key={group.source} className="graph-group">
                              <div className="graph-group__header">
                                <strong>{group.label}</strong>
                                <span>{group.nodes.length}</span>
                              </div>
                              <div className="graph-node-list">
                                {group.nodes.map((node) => (
                                  <article key={node.id} className="graph-node-card">
                                    <p className="graph-node-card__label">{node.label}</p>
                                    <div className="graph-node-card__meta">
                                      <span className="timeline-chip">{node.stance}</span>
                                      <span className="timeline-chip">{node.source}</span>
                                    </div>
                                  </article>
                                ))}
                              </div>
                            </section>
                          ))}
                        </div>
                      </section>

                      <section className="graph-panel">
                        <div className="graph-panel__header">
                          <strong>Claim Graph Edges</strong>
                          <span>{workspaceData.decisionGraph.edges.length}</span>
                        </div>

                        {groupedGraphEdges.length > 0 ? (
                          <div className="graph-groups">
                            {groupedGraphEdges.map((group) => (
                              <section key={group.relation} className="graph-group">
                                <div className="graph-group__header">
                                  <strong>{group.label}</strong>
                                  <span>{group.edges.length}</span>
                                </div>
                                <div className="graph-edge-list">
                                  {group.edges.map((edge) => (
                                    <article key={edge.id} className="graph-edge-card">
                                      <p className="graph-edge-card__labels">
                                        <span>{buildTimelineSummary(getClaimLabelById(edge.fromClaimId), edge.fromClaimId)}</span>
                                        <span className="graph-edge-card__arrow">→</span>
                                        <span>{buildTimelineSummary(getClaimLabelById(edge.toClaimId), edge.toClaimId)}</span>
                                      </p>

                                      <div className="graph-edge-card__controls">
                                        <select
                                          className="claim-card__select"
                                          value={edge.relation}
                                          onChange={(event) =>
                                            handleEdgeRelationChange(edge.id, event.target.value)
                                          }
                                        >
                                          <option value="supports">supports</option>
                                          <option value="contradicts">contradicts</option>
                                          <option value="refines">refines</option>
                                          <option value="duplicates">duplicates</option>
                                          <option value="unknown">unknown</option>
                                        </select>

                                        <button
                                          type="button"
                                          className="ghost-button ghost-button--compact claim-card__delete"
                                          onClick={() => handleDeleteEdge(edge.id)}
                                        >
                                          삭제
                                        </button>
                                      </div>
                                    </article>
                                  ))}
                                </div>
                              </section>
                            ))}
                          </div>
                        ) : (
                          <p className="graph-card__empty">
                            생성된 엣지가 없습니다. 클레임 입장을 조정하거나 그래프를 다시 생성하세요.
                          </p>
                        )}
                      </section>
                    </div>
                  ) : (
                    <p className="graph-card__empty">
                      클레임 기반 그래프는 아직 없습니다. 클레임 추출 후 Build Graph를 실행하세요.
                    </p>
                  )}
                </div>
              ) : (
                <div className="decision-tool-panel">
                  <section className="decision-node-create">
                    <input
                      className="hypothesis-input"
                      value={strategyDraft.title}
                      onChange={(event) =>
                        setStrategyDraft((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      placeholder="전략 제목"
                    />
                    <textarea
                      className="hypothesis-textarea"
                      value={strategyDraft.description}
                      onChange={(event) =>
                        setStrategyDraft((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="전략 설명"
                    />

                    {workspaceData.decisionNodes.nodes.length > 0 ? (
                      <div className="hypothesis-card__claims">
                        {workspaceData.decisionNodes.nodes.map((node) => (
                          <label key={`strategy-node-${node.id}`} className="hypothesis-claim-link">
                            <input
                              type="checkbox"
                              checked={strategyDraft.linkedDecisionNodeIds.includes(node.id)}
                              onChange={() => handleStrategyNodeToggle(node.id)}
                            />
                            <span>{node.title}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="hypothesis-card__empty">
                        전략을 결정 노드와 연결하려면 Decision Graph 탭에서 노드를 생성하세요.
                      </p>
                    )}

                    <div className="button-row">
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={handleCreateStrategy}
                      >
                        전략 생성
                      </button>
                    </div>
                  </section>

                  {workspaceData.strategies.length > 0 ? (
                    <div className="learning-groups">
                      {groupedStrategiesByStatus.map((group) => (
                        <section key={group.status} className="learning-group">
                          <div className="learning-group__header">
                            <strong>{group.label}</strong>
                            <span>{group.strategies.length}</span>
                          </div>
                          {group.strategies.length > 0 ? (
                            <div className="learning-list">
                              {group.strategies.map((strategy) => (
                                <article key={strategy.id} className="learning-item">
                                  <div className="hypothesis-card__header">
                                    <div>
                                      <strong>{strategy.title}</strong>
                                      <p>{strategy.description || '설명 없음'}</p>
                                    </div>
                                    <div className="hypothesis-card__status">
                                      <span className="timeline-chip">
                                        {getStrategyStatusLabel(strategy.status)}
                                      </span>
                                      <select
                                        className="claim-card__select"
                                        value={strategy.status}
                                        onChange={(event) =>
                                          handleStrategyStatusChange(
                                            strategy.id,
                                            event.target.value
                                          )
                                        }
                                      >
                                        <option value="draft">draft</option>
                                        <option value="active">active</option>
                                        <option value="paused">paused</option>
                                        <option value="selected">selected</option>
                                        <option value="rejected">rejected</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className="hypothesis-card__meta">
                                    <span className="timeline-chip">
                                      nodes {strategy.linkedDecisionNodeIds.length}
                                    </span>
                                    <span className="timeline-chip">
                                      {new Date(strategy.updatedAt).toLocaleString('ko-KR')}
                                    </span>
                                  </div>
                                  <div className="button-row">
                                    <button
                                      type="button"
                                      className="ghost-button ghost-button--compact claim-card__delete"
                                      onClick={() => handleDeleteStrategy(strategy.id)}
                                    >
                                      삭제
                                    </button>
                                  </div>
                                </article>
                              ))}
                            </div>
                          ) : (
                            <p className="hypothesis-card__empty">
                              해당 상태의 전략이 없습니다.
                            </p>
                          )}
                        </section>
                      ))}
                    </div>
                  ) : (
                    <p className="graph-card__empty">
                      아직 전략이 없습니다. 결정 노드 또는 현재 판단을 바탕으로 전략을 생성하세요.
                    </p>
                  )}
                </div>
              )}
            </section>

            <section className="card timeline-card">
              <div className="card__header">
                <div className="section-heading">
                  <span className="section-icon" aria-hidden="true">✦</span>
                  <div>
                    <p className="section-label">AVA Timeline</p>
                    <h3>의사결정 타임라인</h3>
                  </div>
                </div>
                {workspaceTimeline.length > 10 ? (
                  <button
                    type="button"
                    className="ghost-button ghost-button--compact"
                    onClick={() => setShowAllTimeline((current) => !current)}
                  >
                    {showAllTimeline ? '최근 10개만' : '전체 보기'}
                  </button>
                ) : null}
              </div>

              <div className="timeline-state">
                <div className="timeline-state__row">
                  <span>시작 질문</span>
                  <strong>{latestDecisionState.question}</strong>
                </div>
                <div className="timeline-state__row">
                  <span>모델 응답</span>
                  <strong>{latestDecisionState.models} / 3 완료</strong>
                </div>
                <div className="timeline-state__row">
                  <span>최신 분석</span>
                  <strong>{latestDecisionState.analysis}</strong>
                </div>
                <div className="timeline-state__row">
                  <span>최종 판단</span>
                  <strong>{latestDecisionState.decision}</strong>
                </div>
                <div className="timeline-state__row">
                  <span>보존 상태</span>
                  <strong>{latestDecisionState.snapshotLabel}</strong>
                </div>
              </div>

              <div className="timeline-list">
                {timelineCycles.length > 0 ? (
                  timelineCycles.map((cycle, cycleIndex) => (
                    <section key={cycle.id} className="timeline-cycle">
                      <div className="timeline-cycle__header">
                        <div>
                          <p className="section-label">Decision Cycle {timelineCycles.length - cycleIndex}</p>
                          <strong>
                            {cycle.events.find((event) => event.type === 'prompt_created')?.summary ||
                              latestDecisionState.question}
                          </strong>
                        </div>
                        <span>{new Date(cycle.updatedAt).toLocaleString('ko-KR')}</span>
                      </div>

                      {cycle.events.map((event) => (
                        <article
                          key={event.id}
                          className={`timeline-event ${
                            event.relatedSnapshotId &&
                            latestSnapshot &&
                            event.relatedSnapshotId === latestSnapshot.id
                              ? 'timeline-event--snapshot-current'
                              : ''
                          }`}
                        >
                          <div className="timeline-event__rail" aria-hidden="true">
                            <span className="timeline-event__dot" />
                            <span className="timeline-event__line" />
                          </div>
                          <div className="timeline-event__body">
                            <div className="timeline-event__meta">
                              <strong>{event.title}</strong>
                              <span>{new Date(event.timestamp).toLocaleString('ko-KR')}</span>
                            </div>
                            <p className="timeline-event__summary">{event.summary}</p>
                            <div className="timeline-event__tags">
                              <span className={`timeline-chip timeline-chip--${event.category}`}>
                                {getTimelineCategoryLabel(event.category)}
                              </span>
                              <span className="timeline-chip">{event.type}</span>
                              {event.relatedSnapshotId ? (
                                <span className="timeline-chip timeline-chip--snapshot-link">
                                  {latestSnapshot && event.relatedSnapshotId === latestSnapshot.id
                                    ? '현재 결정 상태 보존'
                                    : 'snapshot 연결'}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      ))}
                    </section>
                  ))
                ) : (
                  <p className="timeline-list__empty">
                    아직 기록된 타임라인 이벤트가 없습니다.
                  </p>
                )}
              </div>
            </section>
        </div>
      </main>
      </section>
      <aside className="thought-ruler">
        <nav className="thought-ruler__track" aria-label="Live Thought Navigator">
          {orderedNavigatorItems.map((item, index) => {
            const isActive = item.id === activeSectionId
            const summary = getSectionSummary(item.type, workspaceData)
            const hasContent = summary !== '아직 입력 없음'

            return (
              <button
                key={item.id}
                type="button"
                className={`thought-ruler__marker ${
                  isActive ? 'thought-ruler__marker--active' : ''
                } ${
                  hasContent
                    ? 'thought-ruler__marker--filled'
                    : 'thought-ruler__marker--empty'
                }`}
                onClick={() => handleNavigatorItemClick(item.id)}
                title={summary}
              >
                <span className="thought-ruler__line">
                  <span className="thought-ruler__dot" />
                  {index < orderedNavigatorItems.length - 1 ? (
                    <span className="thought-ruler__stem" />
                  ) : null}
                </span>
                <span className="thought-ruler__text">
                  <span className="thought-ruler__label">{item.shortLabel}</span>
                </span>
                <span className="thought-ruler__bubble">
                  <span className="thought-ruler__bubble-label">{item.label}</span>
                  <span className="thought-ruler__bubble-summary">{summary}</span>
                </span>
              </button>
            )
          })}
        </nav>
      </aside>

      <aside
        ref={conversationMinimapRef}
        className={`conversation-minimap ${
          isConversationMinimapExpanded ? 'conversation-minimap--expanded' : ''
        }`}
        aria-label="Conversation Minimap"
      >
        <div
          className="conversation-minimap__rail"
          onClick={() => {
            setHasUsedNavigator(true)
            setIsConversationMinimapExpanded((current) => !current)
          }}
          role="navigation"
          aria-label="Conversation position navigator"
        >
          <span className="conversation-minimap__rail-label">Context</span>
          <span className="conversation-minimap__markers">
            {orderedNavigatorItems.length > 0 ? (
              orderedNavigatorItems.map((item, index) => {
                const distance =
                  activeNavigatorIndex >= 0
                    ? Math.abs(index - activeNavigatorIndex)
                    : 2
                const emphasis = Math.max(0.28, 1 - distance * 0.2)

                return (
                <button
                  key={`marker-${item.id}`}
                  type="button"
                  className={`conversation-minimap__marker conversation-minimap__marker--section ${
                    item.id === activeSectionId ? 'conversation-minimap__marker--active' : ''
                  }`}
                  style={{ '--navigator-emphasis': emphasis }}
                  data-label={item.shortLabel}
                  aria-label={`${item.label} 위치로 이동`}
                  onClick={(event) => {
                    event.stopPropagation()
                    setHasUsedNavigator(true)
                    setIsConversationMinimapExpanded(true)
                    handleNavigatorItemClick(item.id)
                  }}
                >
                  {index === 0 ? '+' : '-'}
                </button>
                )
              })
            ) : (
              <span className="conversation-minimap__marker" />
            )}
          </span>
        </div>

        {isConversationMinimapExpanded ? (
          <div className="conversation-minimap__panel">
            {orderedNavigatorItems.length > 0 ? (
              <div className="conversation-minimap__list">
                {orderedNavigatorItems.map((item, index) => {
                  const distance =
                    activeNavigatorIndex >= 0
                      ? Math.abs(index - activeNavigatorIndex)
                      : 2
                  const emphasis = Math.max(0.28, 1 - distance * 0.2)

                  return (
                  <button
                    key={item.id}
                    type="button"
                    className={`conversation-minimap__item ${
                      item.id === activeSectionId ? 'conversation-minimap__item--active' : ''
                    }`}
                    style={{ '--navigator-emphasis': emphasis }}
                    onClick={() => handleNavigatorItemClick(item.id)}
                  >
                    <span className="conversation-minimap__item-label">
                      {item.preview}
                    </span>
                    <span className="conversation-minimap__item-meta">
                      <span className={`timeline-chip conversation-minimap__type conversation-minimap__type--${item.type}`}>
                        {item.type}
                      </span>
                    </span>
                  </button>
                  )
                })}
              </div>
            ) : (
              <p className="conversation-minimap__empty">
                아직 표시할 대화 앵커가 없습니다.
              </p>
            )}
          </div>
        ) : null}
      </aside>
    </div>
  )
}
