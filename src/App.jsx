import { useEffect, useState } from 'react'
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
  }
}

function createWorkspace(name, template = {}) {
  return {
    id: `workspace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    data: createWorkspaceData(template),
    snapshots: Array.isArray(template.snapshots) ? template.snapshots : [],
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

  return {
    id: createSnapshotId(),
    title: titleSource.slice(0, 50),
    createdAt: new Date().toISOString(),
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
    default:
      return '아직 입력 없음'
  }
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

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ||
    workspaces[0]

  const activeWorkspaceName = activeWorkspace?.name || '작업공간'
  const workspaceData = activeWorkspace?.data || createWorkspaceData()
  const workspaceSnapshots = activeWorkspace?.snapshots || []

  useEffect(() => {
    persistWorkspaceStorage(workspaces, activeWorkspaceId)
  }, [workspaces, activeWorkspaceId])

  useEffect(() => {
    const handleScroll = () => {
      const candidates = navigatorItems
        .map((item) => {
          const element = document.getElementById(item.id)

          if (!element) {
            return null
          }

          const rect = element.getBoundingClientRect()

          return {
            id: item.id,
            topDistance: Math.abs(rect.top - 140),
            isPassed: rect.top <= 180,
          }
        })
        .filter(Boolean)

      const passedSections = candidates.filter((item) => item.isPassed)
      const nextActive =
        passedSections[passedSections.length - 1] ||
        candidates.sort((left, right) => left.topDistance - right.topDistance)[0]

      if (nextActive?.id) {
        setActiveSectionId(nextActive.id)
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
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
    updateActiveWorkspace((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleBuildPrompt = () => {
    updateField(
      'finalPrompt',
      composePrompt(
        workspaceData.globalPrompt,
        workspaceData.projectPrompt,
        workspaceData.question
      )
    )
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

    updateActiveWorkspace({
      consensus,
      conflict,
      uniqueInsight,
      humanDecision,
    })
    setWorkspaceNotice(`"${activeWorkspaceName}"의 분석 결과를 갱신했습니다.`)
  }

  const handleCopyPrompt = async (label) => {
    const prompt =
      workspaceData.finalPrompt ||
      composePrompt(
        workspaceData.globalPrompt,
        workspaceData.projectPrompt,
        workspaceData.question
      )

    try {
      await navigator.clipboard.writeText(prompt)
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

    updateActiveWorkspace((workspace) => ({
      ...workspace,
      snapshots: [snapshot, ...workspace.snapshots],
    }))
    setWorkspaceNotice('스냅샷 저장 완료')
  }

  const handleLoadSnapshot = (snapshotId) => {
    const snapshot = workspaceSnapshots.find((item) => item.id === snapshotId)

    if (!snapshot) {
      return
    }

    updateActiveWorkspace({
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
    const target = document.getElementById(sectionId)

    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-card sidebar__brand">
          <div className="sidebar__badge">AVA</div>
          <div>
            <p className="sidebar__eyebrow">Workspace</p>
            <h1>AVA Council</h1>
            <p className="sidebar__subtitle">다중 LLM 합의 도구</p>
          </div>
        </div>

        <section className="sidebar-card sidebar-panel">
          <div className="workspace-heading">
            <div>
              <p className="section-label">Workspace Manager</p>
              <strong>작업공간</strong>
            </div>
            <button
              type="button"
              className="ghost-button workspace-heading__button"
              onClick={handleCreateWorkspace}
            >
              <span className="button-icon">✦</span>
              새 작업공간
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
                  <span className="workspace-item__icon" aria-hidden="true" />
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
                >
                  삭제
                </button>
              </div>
            ))}
          </nav>

          <div className="workspace-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={handleSaveWorkspace}
            >
              <span className="button-icon">□</span>
              작업 저장
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={handleClearWorkspace}
            >
              <span className="button-icon">✦</span>
              비우기
            </button>
          </div>
        </section>

        <section className="sidebar-card snapshot-section">
          <div className="snapshot-section__header">
            <div>
              <p className="section-label">Snapshot Engine</p>
              <strong>{activeWorkspaceName}</strong>
            </div>
            <button
              type="button"
              className="ghost-button ghost-button--primary snapshot-section__button"
              onClick={handleSaveSnapshot}
            >
              <span className="button-icon">✦</span>
              스냅샷 저장
            </button>
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

      <main className="dashboard">
        <div className="workspace-content">
            <section className="hero-card">
              <div className="hero-card__content">
                <p className="section-label">Workspace</p>
                <h2>AVA Council</h2>
                <p className="hero-card__subtitle">다중 LLM 합의로 더 나은 의사결정을</p>
                <div className="hero-card__workflow" aria-label="decision workflow">
                  <span>Question</span>
                  <span aria-hidden="true">→</span>
                  <span>Prompt</span>
                  <span aria-hidden="true">→</span>
                  <span>Models</span>
                  <span aria-hidden="true">→</span>
                  <span>Consensus</span>
                  <span aria-hidden="true">→</span>
                  <span>Decision</span>
                </div>
              </div>
              <div className="hero-card__meta">
                <span>{activeWorkspaceName}</span>
                <span>3개 모델</span>
                <span>4개 분석 블록</span>
              </div>
            </section>

            <section id="question-studio" className="card studio-card section-anchor">
              <div className="card__header">
                <div className="section-heading">
                  <span className="section-icon" aria-hidden="true">✦</span>
                  <div>
                    <p className="section-label">입력</p>
                    <h3>질문 스튜디오</h3>
                  </div>
                </div>
                <button
                  type="button"
                  className="ghost-button ghost-button--primary"
                  onClick={handleBuildPrompt}
                >
                  <span className="button-icon">✦</span>
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
                <div className="section-heading">
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
                      className="ghost-button ghost-button--compact"
                      onClick={() => handleCopyPrompt(label)}
                    >
                      {copiedPanel === label ? `${label} 복사됨` : `${label}용 복사`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="prompt-preview">
                <pre>
                  {workspaceData.finalPrompt || '아직 만든 프롬프트가 없습니다. 질문 스튜디오에서 프롬프트 만들기를 실행하세요.'}
                </pre>
              </div>
            </section>

            <section className="panel-grid">
              {[
                ['gptResponse', 'GPT', 'gpt-response'],
                ['claudeResponse', 'Claude', 'claude-response'],
                ['geminiResponse', 'Gemini', 'gemini-response'],
              ].map(([key, label, id]) => (
                <article key={key} id={id} className="card response-card section-anchor">
                  <div className="card__header">
                    <div className="section-heading">
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
                    <div className="section-heading">
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
                <div className="section-heading">
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
                  rows={8}
                  placeholder="최종 판단과 다음 행동을 정리하세요."
                />
              </label>
            </section>
        </div>
      </main>

      <aside className="thought-ruler">
        <nav className="thought-ruler__track" aria-label="Live Thought Navigator">
          {navigatorItems.map((item, index) => {
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
                  {index < navigatorItems.length - 1 ? (
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
    </div>
  )
}
