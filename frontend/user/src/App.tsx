import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type Dispatch,
  type DragEvent,
  type ReactNode,
  type SetStateAction,
} from 'react'
import './App.css'
import sensorPortrait from './assets/sensor-portrait.svg'
import signalWave from './assets/signal-wave.svg'
import fusionGrid from './assets/fusion-grid.svg'
import ImageStudioRoute from './pages/ImageStudioPage'
import TextStudioRoute from './pages/TextStudioPage'
import VideoStudioRoute from './pages/VideoStudioPage'
import MultimodalStudioRoute from './pages/MultimodalStudioPage'

const BRAND_MODEL_SRC = '/iseeyou-logo.glb'

type CategoryId = 'image' | 'text' | 'video' | 'multimodal'
type View = { screen: 'home' } | { screen: 'studio'; category: CategoryId }
type UploadKind = 'image' | 'text' | 'video'

type UploadState = {
  file: File | null
  previewUrl: string
  textValue: string
  dragging: boolean
}

type Profile = {
  id: string
  title: string
  subtitle: string
  description: string
  accent: string
  badge: string
  latency: string
  xai: string
  recommended?: boolean
  capabilities: string[]
}

type CategoryConfig = {
  id: CategoryId
  label: string
  kicker: string
  title: string
  subtitle: string
  uploadKind: UploadKind
  uploadAccept: string
  inputHint: string
  stageLabels: string[]
  profiles: Profile[]
  visual: string
}

type Analysis = {
  verdictLabel: string
  fakePercent: number
  realPercent: number
  confidence: number
  summary: string
  metrics: { label: string; value: string; detail: string }[]
  reasons: { title: string; body: string }[]
  bars: { label: string; score: number; note: string }[]
  timeline: { label: string; start: string; end: string; score: number; note: string }[]
  regions: { id: string; label: string; x: number; y: number; width: number; height: number }[]
  tokens: { text: string; weight: number; tag: string }[]
}

type ApiAnalysis = {
  verdictLabel: string
  fakePercent: number
  realPercent: number
  confidence: number
  summary: string
  reasoning: { title: string; body: string }[]
  metrics: { label: string; value: string; detail: string }[]
  stages: { title: string; body: string }[]
  xai: {
    headline: string
    regions: { id: string; label: string; x: number; y: number; width: number; height: number; score: number; note: string }[]
    timeline: { label: string; start: string; end: string; score: number; note: string }[]
    textHighlights: { text: string; weight: number; tag: string }[]
    modalityBars: { label: string; score: number; note: string }[]
  }
}

const initialUploadState = (): UploadState => ({
  file: null,
  previewUrl: '',
  textValue: '',
  dragging: false,
})

const CATEGORY_CONFIG: Record<CategoryId, CategoryConfig> = {
  image: {
    id: 'image',
    label: 'Image',
    kicker: 'Visual Authenticity',
    title: '이미지 진위 판별',
    subtitle: '빠른 버전과 정밀 버전을 오가며 전체 장면과 얼굴 전용 판별을 비교합니다.',
    uploadKind: 'image',
    uploadAccept: 'image/*',
    inputHint: 'PNG, JPG, WEBP 이미지를 드래그하거나 선택하세요.',
    stageLabels: ['Decode', 'Vision pass', 'Forensic pass', 'Explain'],
    visual: sensorPortrait,
    profiles: [
      {
        id: 'image-fast',
        title: 'Fast Scan',
        subtitle: '빠른 버전',
        description: '전체 배경 기준으로 빠르게 1차 판별을 수행합니다.',
        accent: 'cyan',
        badge: 'Default',
        latency: 'Low latency',
        xai: 'Attention heatmap',
        recommended: true,
        capabilities: ['Scene-first', 'Instant preview', 'Lightweight XAI'],
      },
      {
        id: 'image-precision',
        title: 'Precision Lab',
        subtitle: '정밀 버전',
        description: '얼굴과 아티팩트 단서를 깊게 추적해 더 정밀한 판별을 수행합니다.',
        accent: 'violet',
        badge: 'High fidelity',
        latency: 'Deep scan',
        xai: 'Dual focus overlay',
        capabilities: ['Face-aware', 'Artifact trace', 'Detailed rationale'],
      },
    ],
  },
  text: {
    id: 'text',
    label: 'Text',
    kicker: 'Language Integrity',
    title: '텍스트 진위 판별',
    subtitle: '텍스트 AI 판정과 웹 진위 판별을 나눠 언어 신호와 외부 근거를 함께 봅니다.',
    uploadKind: 'text',
    uploadAccept: '.txt,text/plain',
    inputHint: '텍스트를 붙여넣거나 TXT 파일을 업로드하세요.',
    stageLabels: ['Parse', 'Language trace', 'Grounding', 'Explain'],
    visual: fusionGrid,
    profiles: [
      {
        id: 'text-ai-detector',
        title: 'AI Text Detector',
        subtitle: '텍스트 AI 판정',
        description: '문체와 반복 패턴을 기반으로 AI 생성 가능성을 분석합니다.',
        accent: 'amber',
        badge: 'Writing signal',
        latency: 'Fast response',
        xai: 'Token heatline',
        recommended: true,
        capabilities: ['Token trace', 'Style signal', 'Confidence bands'],
      },
      {
        id: 'text-fact-check',
        title: 'Web Fact Match',
        subtitle: '웹 진위 판별',
        description: '주장을 외부 출처와 대조해 일치 여부를 추적합니다.',
        accent: 'emerald',
        badge: 'Grounded truth',
        latency: 'Source sweep',
        xai: 'Claim support map',
        capabilities: ['Claim split', 'Source alignment', 'Mismatch trace'],
      },
    ],
  },
  video: {
    id: 'video',
    label: 'Video',
    kicker: 'Temporal Forensics',
    title: '비디오 진위 판별',
    subtitle: '실험 기법별 6개 비디오 모델을 선택하고 장면별 근거와 타임라인 XAI를 확인합니다.',
    uploadKind: 'video',
    uploadAccept: 'video/*',
    inputHint: 'MP4, MOV, WEBM 비디오를 드래그하거나 선택하세요.',
    stageLabels: ['Decode', 'Temporal scan', 'Model vote', 'Explain'],
    visual: signalWave,
    profiles: [
      { id: 'video-openclip', title: 'OpenCLIP Consistency', subtitle: 'semantic alignment', description: '프레임과 설명의 의미 정합성을 읽는 baseline입니다.', accent: 'cyan', badge: 'OpenCLIP', latency: 'Balanced', xai: 'Scene-text focus', capabilities: ['Semantic gap', 'Frame summary', 'Context score'] },
      { id: 'video-flava', title: 'FLAVA Cross-Modal', subtitle: 'fusion attention', description: 'cross-modal fusion으로 장면과 문맥을 함께 읽습니다.', accent: 'violet', badge: 'Top performer', latency: 'Balanced', xai: 'Fusion map', recommended: true, capabilities: ['Fusion embedding', 'Stable ranking', 'Attention trace'] },
      { id: 'video-blip-nli', title: 'BLIP + NLI', subtitle: 'caption contradiction', description: '장면 설명 생성 후 모순 여부를 비교합니다.', accent: 'rose', badge: 'Caption reasoning', latency: 'LLM heavy', xai: 'Contradiction cards', capabilities: ['Caption bridge', 'NLI contradiction', 'Text rationale'] },
      { id: 'video-avsync', title: 'AV Sync', subtitle: 'mouth-audio alignment', description: '입 모양과 음성의 시간차를 추적합니다.', accent: 'emerald', badge: 'Deepfake focus', latency: 'Audio visual', xai: 'Sync timeline', capabilities: ['Lip sync', 'Onset lag', 'Temporal alert'] },
      { id: 'video-frequency', title: 'Frequency Fusion', subtitle: 'artifact spectrum', description: 'FFT와 mel 흔적을 함께 읽어 생성 아티팩트를 포착합니다.', accent: 'amber', badge: 'Artifact trace', latency: 'Forensic', xai: 'Spectrum map', capabilities: ['FFT trace', 'Mel trace', 'Noise contour'] },
      { id: 'video-scenegraph', title: 'SceneGraph GCN', subtitle: 'object relation check', description: '객체 관계 구조를 그래프로 비교합니다.', accent: 'slate', badge: 'Structured reasoning', latency: 'Structured', xai: 'Relation graph', capabilities: ['Object graph', 'Relation confidence', 'Graph overlay'] },
    ],
  },
  multimodal: {
    id: 'multimodal',
    label: 'Multimodal',
    kicker: 'Cross-Signal Intelligence',
    title: '멀티모달 진위 판별',
    subtitle: '실험에 사용한 6개 멀티모달 모델을 선택하고 real/fake 퍼센트와 XAI를 한 화면에서 확인합니다.',
    uploadKind: 'video',
    uploadAccept: 'video/*',
    inputHint: '비디오를 업로드하고 필요하면 캡션이나 설명 텍스트를 함께 입력하세요.',
    stageLabels: ['Ingest', 'Cross-modal align', 'Rank', 'Explain'],
    visual: fusionGrid,
    profiles: [
      { id: 'mm-openclip', title: 'OpenCLIP', subtitle: 'image-text consistency', description: '프레임과 텍스트 설명의 정합성을 읽습니다.', accent: 'cyan', badge: 'Contrastive', latency: 'Balanced', xai: 'Scene-text overlay', capabilities: ['Cosine signal', 'Frame semantics', 'Prompt bridge'] },
      { id: 'mm-flava', title: 'FLAVA', subtitle: 'cross-modal fusion', description: '여러 모달의 fusion 표현으로 최종 정합성을 계산합니다.', accent: 'violet', badge: 'Recommended', latency: 'Recommended', xai: 'Fusion attention', recommended: true, capabilities: ['Top final score', 'Fusion map', 'Stable fit'] },
      { id: 'mm-blip-nli', title: 'BLIP + NLI', subtitle: 'generated explanation', description: '장면 설명과 자연어 추론을 결합합니다.', accent: 'rose', badge: 'Explanation-led', latency: 'Narrative', xai: 'Caption contradiction', capabilities: ['Caption pass', 'Entailment gap', 'Text evidence'] },
      { id: 'mm-avsync', title: 'AVSync', subtitle: 'lip-audio mismatch', description: '립싱크와 음성 타이밍 불일치를 추적합니다.', accent: 'emerald', badge: 'Deepfake specialist', latency: 'Specialized', xai: 'Sync strip', capabilities: ['Lip motion', 'Audio lag', 'Temporal mismatch'] },
      { id: 'mm-frequency', title: 'Frequency Fusion', subtitle: 'artifact domain', description: '주파수 영역 아티팩트를 읽어 생성형 흔적을 분석합니다.', accent: 'amber', badge: 'Artifact specialist', latency: 'Forensic', xai: 'Spectrum focus', capabilities: ['FFT image', 'Mel audio', 'Noise signature'] },
      { id: 'mm-scenegraph', title: 'SceneGraph GCN', subtitle: 'relational structure', description: '객체와 관계 구조를 그래프로 해석합니다.', accent: 'slate', badge: 'Structured XAI', latency: 'Structured', xai: 'Graph rationale', capabilities: ['Object graph', 'Relation logic', 'Bounding overlay'] },
    ],
  },
}

const HOME_HIGHLIGHTS = [
  { title: '신호 중심 경험', body: '파일 업로드부터 진행도, 결과, 설명 가능한 시각화까지 한 흐름으로 이어집니다.' },
  { title: '설명 가능한 판별', body: '점수만 제시하지 않고 어떤 단서가 결과를 이끌었는지 함께 보여줍니다.' },
  { title: '확장 가능한 구조', body: 'Image, Text, Video, Multimodal별 모델 랙 구조로 향후 확장이 쉽습니다.' },
] as const

const CATEGORY_NAME_KO: Record<CategoryId, string> = {
  image: '이미지',
  text: '텍스트',
  video: '비디오',
  multimodal: '멀티모달',
}

function categoryNameKo(category: CategoryId) {
  return CATEGORY_NAME_KO[category]
}

function StudioLink({
  category,
  className,
  children,
  onNavigate,
}: {
  category: CategoryId
  className: string
  children: ReactNode
  onNavigate?: (category: CategoryId) => void
}) {
  return (
    <a
      href={`#/studio/${category}`}
      className={className}
      onClick={() => onNavigate?.(category)}
    >
      {children}
    </a>
  )
}

function HomeStageVisual({ category }: { category: CategoryConfig }) {
  if (category.id === 'text') {
    return (
      <div className="pillar-stage-image pillar-stage-image-text" aria-hidden="true">
        <div className="text-stage-card">
          <div className="text-stage-lines">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="text-stage-tags">
            <span>claim</span>
            <span>source</span>
            <span>mismatch</span>
          </div>
          <div className="text-stage-sources">
            <b />
            <b />
            <b />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pillar-stage-image">
      <img src={category.visual} alt={`${category.label} overview`} loading="lazy" />
    </div>
  )
}

function MultimodalMethodsSection({ onOpenCategory }: { onOpenCategory: (category: CategoryId) => void }) {
  const multimodalProfiles = CATEGORY_CONFIG.multimodal.profiles
  const methodVisualClass: Record<string, string> = {
    'mm-openclip': 'idle-bars',
    'mm-flava': 'idle-fusion',
    'mm-blip-nli': 'idle-text',
    'mm-avsync': 'idle-sync',
    'mm-frequency': 'idle-spectrum',
    'mm-scenegraph': 'idle-graph',
  }

  return (
    <section className="cinematic-state multimodal-methods">
      <div className="cinematic-copy">
        <span className="eyebrow">MULTIMODAL METHODS</span>
        <h2>멀티모달 6가지 실험 방법을 한 화면에서 비교해 보여줍니다.</h2>
        <p>OpenCLIP, FLAVA, BLIP+NLI, AVSync, Frequency Fusion, SceneGraph GCN을 각각 다른 시각 언어로 표현해, 사용자가 선택 가능한 분석 전략을 먼저 이해할 수 있도록 구성했습니다.</p>
      </div>
      <div className="demo-grid method-grid">
        {multimodalProfiles.map((profile) => (
          <article key={profile.id} className={`demo-card method-card tone-${profile.accent}`}>
            <div className="demo-head">
              <span>{profile.badge}</span>
              <strong>{profile.title}</strong>
              <small>{profile.subtitle}</small>
            </div>
            <div className={`idle-visual ${methodVisualClass[profile.id]}`} aria-hidden="true">
              {profile.id === 'mm-openclip' ? <><i /><i /><i /><i /><i /></> : null}
              {profile.id === 'mm-flava' ? <><span /><span /><span /><span /></> : null}
              {profile.id === 'mm-blip-nli' ? <><b /><b /><b /><b /></> : null}
              {profile.id === 'mm-avsync' ? <><div className="idle-sync-mouth"><span className="upper-lip" /><span className="mouth-core" /><span className="lower-lip" /></div><div className="idle-sync-track"><em /><em /><em /><em /><em /><em /></div></> : null}
              {profile.id === 'mm-frequency' ? <><i /><i /><i /><i /><i /><i /></> : null}
              {profile.id === 'mm-scenegraph' ? <><span /><span /><span /><span /><i /><i /><i /></> : null}
            </div>
            <p>{profile.description}</p>
          </article>
        ))}
      </div>
      <div className="methods-cta-row">
        <StudioLink category="multimodal" className="primary-cta" onNavigate={onOpenCategory}>
          멀티모달 스튜디오로 바로 이동
        </StudioLink>
      </div>
    </section>
  )
}

function parseHashToView(hash: string): View {
  const normalized = hash.replace(/^#/, '')
  if (normalized.startsWith('/studio/')) {
    const category = normalized.replace('/studio/', '') as CategoryId
    if (category in CATEGORY_CONFIG) {
      return { screen: 'studio', category }
    }
  }
  return { screen: 'home' }
}

function syncHash(view: View) {
  const nextHash = view.screen === 'home' ? '#/' : `#/studio/${view.category}`
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash
  }
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function transitionTo(update: () => void) {
  const withTransition = (document as Document & { startViewTransition?: (callback: () => void) => void }).startViewTransition?.bind(document)
  if (withTransition) {
    withTransition(() => startTransition(update))
    return
  }
  startTransition(update)
}

function getDefaultProfile(category: CategoryConfig) {
  return category.profiles.find((profile) => profile.recommended) ?? category.profiles[0]
}

function buildAnalysis(category: CategoryConfig, profile: Profile, upload: UploadState): Analysis {
  const seed = Array.from(`${category.id}-${profile.id}-${upload.file?.name ?? upload.textValue}`).reduce((sum, ch, idx) => sum + ch.charCodeAt(0) * (idx + 3), 0)
  const fakePercent = Math.min(91, Math.max(14, 50 + ((seed % 29) - 14)))
  const realPercent = 100 - fakePercent
  const verdictLabel = fakePercent >= realPercent ? 'Likely synthetic' : 'Likely authentic'
  return {
    verdictLabel,
    fakePercent,
    realPercent,
    confidence: Math.min(98, Math.max(68, 75 + (seed % 18))),
    summary: `${profile.title} 기준으로 입력된 ${category.label.toLowerCase()}를 분석한 결과 ${fakePercent >= realPercent ? '가짜 가능성' : '진짜 가능성'}이 더 높습니다.`,
    metrics: [
      { label: 'Real score', value: formatPercent(realPercent), detail: 'authenticity confidence' },
      { label: 'Fake score', value: formatPercent(fakePercent), detail: 'synthetic confidence' },
      { label: 'Latency', value: profile.latency, detail: profile.badge },
      { label: 'XAI mode', value: 'Live', detail: profile.xai },
    ],
    reasons: [
      { title: 'Primary signal', body: '가장 영향력이 큰 신호 축을 먼저 추출해 핵심 판별 근거를 잡았습니다.' },
      { title: 'Decision logic', body: '선택한 모델의 점수와 보조 신호를 합쳐 최종 real/fake 비율을 계산했습니다.' },
      { title: 'XAI layer', body: '영향이 컸던 영역과 구간을 오버레이와 타임라인으로 정리했습니다.' },
    ],
    bars: [
      { label: 'Vision', score: 0.82, note: 'spatial evidence' },
      { label: 'Audio', score: 0.64, note: 'sync evidence' },
      { label: 'Text', score: 0.71, note: 'semantic evidence' },
      { label: 'Fusion', score: 0.87, note: 'combined impact' },
    ],
    timeline: [
      { label: 'Intro', start: '00:00', end: '00:04', score: 0.38, note: '초기 신호 약함' },
      { label: 'Peak evidence', start: '00:05', end: '00:09', score: 0.86, note: '핵심 단서 집중' },
      { label: 'Recovery', start: '00:10', end: '00:13', score: 0.54, note: '신호 완화 구간' },
    ],
    regions: [
      { id: 'r1', label: 'Face contour', x: 16, y: 15, width: 24, height: 32 },
      { id: 'r2', label: 'Mouth / sync', x: 48, y: 45, width: 18, height: 16 },
      { id: 'r3', label: 'Background', x: 70, y: 18, width: 18, height: 28 },
    ],
    tokens: [
      { text: 'AI generated phrasing', weight: 0.86, tag: 'style' },
      { text: 'source mismatch', weight: 0.74, tag: 'fact-check' },
      { text: 'repeated cadence', weight: 0.62, tag: 'language' },
    ],
  }
}

function mapApiAnalysisToUi(analysis: ApiAnalysis): Analysis {
  return {
    verdictLabel: analysis.verdictLabel,
    fakePercent: analysis.fakePercent,
    realPercent: analysis.realPercent,
    confidence: analysis.confidence,
    summary: analysis.summary,
    metrics: analysis.metrics,
    reasons: analysis.reasoning,
    bars: analysis.xai.modalityBars,
    timeline: analysis.xai.timeline,
    regions: analysis.xai.regions.map(({ id, label, x, y, width, height }) => ({ id, label, x, y, width, height })),
    tokens: analysis.xai.textHighlights,
  }
}

async function requestAnalysis(params: {
  category: CategoryConfig
  activeProfile: Profile
  upload: UploadState
  imageScope: 'full-scene' | 'face-focus'
  xaiDepth: 'signature' | 'deep-dive'
  companionText: string
}): Promise<Analysis> {
  const { category, activeProfile, upload, imageScope, xaiDepth, companionText } = params

  const settings = {
    imageScope,
    xaiDepth,
    companionText: companionText.trim(),
  }

  let fileToSend: File | null = upload.file
  let fileName = upload.file?.name ?? 'input.txt'

  // 🔥 핵심: 텍스트를 파일로 변환
  if (category.uploadKind === 'text') {
    const text = upload.textValue.trim()
    if (!text) throw new Error('text is required')

    if (!fileToSend) {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
      fileToSend = new File([blob], fileName, { type: 'text/plain' })
    }
  }

  if (!fileToSend) throw new Error('file is required')

  if (!isAllowedFile(category, fileToSend)) {
    throw new Error(getAllowedFileMessage(category))
  }

  const formData = new FormData()
  formData.append('file', fileToSend)
  formData.append('fileName', fileName)
  formData.append('page', category.id)
  formData.append('selectedMode', activeProfile.id)
  formData.append('settings', JSON.stringify(settings))

  const response = await fetch('http://localhost:8000/api/public/analysis', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) throw new Error(`analysis failed: ${response.status}`)

  const payload = await response.json()

  if (!payload.ok || !payload.analysis) {
    throw new Error(payload.error ?? 'analysis failed')
  }

  return mapApiAnalysisToUi(payload.analysis)
}
function Shell({ children, onHome, onSelectCategory, activeCategory }: { children: ReactNode; onHome: () => void; onSelectCategory: (category: CategoryId) => void; activeCategory: CategoryId | null }) {
  return (
    <div className="app-shell">
      <header className="global-header">
        <a href="#/" className="brand-mark" onClick={() => onHome()}>
          <span className="brand-model-shell" aria-hidden="true">
            <model-viewer class="brand-model" src={BRAND_MODEL_SRC} camera-controls auto-rotate auto-rotate-delay="0" rotation-per-second="18deg" interaction-prompt="none" shadow-intensity="1" exposure="1.1" disable-zoom touch-action="pan-y" />
          </span>
          <span className="brand-wordmark">I SEE YOU</span>
        </a>
        <nav className="global-nav">
          {Object.values(CATEGORY_CONFIG).map((item) => (
            <a key={item.id} href={`#/studio/${item.id}`} className={`global-nav-button ${activeCategory === item.id ? 'is-active' : ''}`} onClick={() => onSelectCategory(item.id)}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      {children}
    </div>
  )
}

function HomePage({ onOpenCategory }: { onOpenCategory: (category: CategoryId) => void }) {
  const categories = Object.values(CATEGORY_CONFIG)
  const [activeHomeCategoryId, setActiveHomeCategoryId] = useState<CategoryId>('multimodal')
  const activeHomeCategory = CATEGORY_CONFIG[activeHomeCategoryId]
  const activeHomeProfile = getDefaultProfile(activeHomeCategory)
  return (
    <main className="page page-home">
      <section className="marquee-ribbon" aria-hidden="true">
        <div><span>IMAGE</span><span>TEXT</span><span>AUDIO</span><span>VIDEO</span><span>FREQUENCY</span><span>LIP-SYNC</span><span>TIME-SERIES</span><span>XAI</span><span>FUSION</span></div>
      </section>

      <section className="pillar-stage tone-violet">
        <div className="pillar-stage-shell">
          <div className="pillar-stage-header">
            <div className="hero-topline"><span className="eyebrow">I SEE YOU</span><span className="hero-live-pill">XAI LIVE</span></div>
            <h1 className="pillar-hero-title">멀티모달 정합성으로 AI 콘텐츠를 검증합니다.</h1>
            <p>I SEE YOU는 소개 화면과 실제 판별 화면을 분리해, 필요한 기능으로 바로 진입할 수 있도록 구성된 AI 콘텐츠 검증 시스템입니다.</p>
            <div className="hero-actions hero-actions-inline">
              <StudioLink category="multimodal" className="primary-cta" onNavigate={onOpenCategory}>멀티모달 분석 시작</StudioLink>
              <div className="hero-stat-strip">
                <div><strong>10,000</strong><span>검증 완료 벤치마크 영상</span></div>
                <div><strong>6</strong><span>비디오·멀티모달 실험 모델</span></div>
                <div><strong>XAI</strong><span>타임라인·오버레이·판단 근거</span></div>
              </div>
            </div>
          </div>

          <div className="pillar-pill-row" role="tablist" aria-label="Detection pillars">
            {categories.map((category) => (
              <button key={category.id} type="button" className={`pillar-pill ${activeHomeCategoryId === category.id ? 'is-active' : ''}`} onClick={() => setActiveHomeCategoryId(category.id)}>{category.label}</button>
            ))}
          </div>

          <div className="pillar-stage-body">
            <div className="pillar-stage-copy">
              <span className="pillar-stage-index">서비스 개요</span>
              <h3>{categoryNameKo(activeHomeCategory.id)}</h3>
              <strong>{activeHomeCategory.title}</strong>
              <p>{activeHomeCategory.subtitle}</p>
            </div>
            <div className="pillar-stage-visual">
              <div className="pillar-stage-glow" />
              <HomeStageVisual category={activeHomeCategory} />
              <div className="pillar-stage-caption"><span>{activeHomeCategory.kicker}</span><p>{activeHomeProfile.description}</p></div>
            </div>
            <div className="pillar-stage-side">
              <div className="pillar-side-metrics">
                <div><strong>{categoryNameKo(activeHomeCategory.id)}</strong><small>{activeHomeProfile.subtitle}</small></div>
                <div><strong>{activeHomeCategory.profiles.length}</strong><small>{activeHomeCategory.id === 'image' || activeHomeCategory.id === 'text' ? '선택 가능한 분석 방식' : '선택 가능한 실험 모델'}</small></div>
                <div><strong>{activeHomeProfile.xai}</strong><small>설명 가능한 판별 시각화</small></div>
                <div><strong>{activeHomeProfile.latency}</strong><small>{activeHomeProfile.badge}</small></div>
              </div>
              <StudioLink category={activeHomeCategory.id} className="primary-cta" onNavigate={onOpenCategory}>{categoryNameKo(activeHomeCategory.id)} 분석 화면으로 이동</StudioLink>
            </div>
          </div>
        </div>
      </section>

      <section className="editorial-gallery">
        {[sensorPortrait, signalWave, fusionGrid].map((image, index) => (
          <article key={index} className="editorial-card tone-violet">
            <div className="editorial-media"><img src={image} alt={`visual-${index}`} loading="lazy" /></div>
            <div className="editorial-copy"><span className="showcase-kicker">분석 단서</span><h3>{index === 0 ? '시각 단서 레이어' : index === 1 ? '동기화·주파수 단서' : '최종 융합 판정'}</h3><p>{index === 0 ? '장면, 얼굴, 경계 흔들림처럼 눈에 보이는 단서를 읽습니다.' : index === 1 ? '오디오, 립싱크, 주파수 흔적을 함께 묶어 해석합니다.' : '모든 신호를 결합해 최종 진위 판단과 근거를 정리합니다.'}</p></div>
          </article>
        ))}
      </section>

      <section className="highlight-row">
        {HOME_HIGHLIGHTS.map((item) => (
          <article key={item.title} className="highlight-card"><span className="highlight-dot" /><h3>{item.title}</h3><p>{item.body}</p></article>
        ))}
      </section>

      <MultimodalMethodsSection onOpenCategory={onOpenCategory} />

      <section className="cinematic-state">
        <div className="cinematic-copy">
          <span className="eyebrow">MODALITY PREVIEW</span>
          <h2>모달리티별 판별 경험을 미리 보여줍니다.</h2>
          <p>메인 화면에서는 Image, Text, Video, Multimodal이 어떤 단서를 읽는지 먼저 보여주고, 상세 모델 비교는 아래 6가지 멀티모달 방법 보드에서 이어집니다.</p>
        </div>
        <div className="demo-grid">
          <article className="demo-card tone-cyan">
            <div className="demo-head">
              <span>IMAGE</span>
              <strong>빠른 판별 / 정밀 판별</strong>
            </div>
            <div className="idle-visual idle-bars" aria-hidden="true">
              <i /><i /><i /><i /><i />
            </div>
          </article>
          <article className="demo-card tone-amber">
            <div className="demo-head">
              <span>TEXT</span>
              <strong>토큰 강조 / 출처 검증</strong>
            </div>
            <div className="idle-visual idle-text" aria-hidden="true">
              <b /><b /><b /><b />
            </div>
          </article>
          <article className="demo-card tone-emerald">
            <div className="demo-head">
              <span>VIDEO</span>
              <strong>립싱크 / 시간축 단서</strong>
            </div>
            <div className="idle-visual idle-sync" aria-hidden="true">
              <div className="idle-sync-mouth">
                <span className="upper-lip" />
                <span className="mouth-core" />
                <span className="lower-lip" />
              </div>
              <div className="idle-sync-track"><em /><em /><em /><em /><em /><em /></div>
            </div>
          </article>
          <article className="demo-card tone-violet">
            <div className="demo-head">
              <span>MULTIMODAL</span>
              <strong>교차 신호 융합 판별</strong>
            </div>
            <div className="idle-visual idle-fusion" aria-hidden="true">
              <span /><span /><span /><span />
            </div>
          </article>
        </div>
      </section>

      <section className="brand-finale">
        <div className="brand-finale-copy">
          <span className="eyebrow">BRAND FINALE</span>
          <h2>Trust needs more than a score.</h2>
          <p>I SEE YOU turns multimodal authenticity checks into a product experience users can read, follow, and believe.</p>
          <div className="brand-finale-values">
            <article className="brand-value-card">
              <span>Readable evidence</span>
              <p>Scores, overlays, and timelines work together so the decision never feels opaque.</p>
            </article>
            <article className="brand-value-card">
              <span>Cross-signal judgment</span>
              <p>Image, text, audio, motion, and frequency cues are evaluated as one connected system.</p>
            </article>
            <article className="brand-value-card">
              <span>Built for real uploads</span>
              <p>From drag-and-drop to model choice and XAI, the workflow is designed for actual user verification.</p>
            </article>
          </div>
        </div>
        <div className="brand-finale-stage">
          <div className="brand-finale-orbit" />
          <model-viewer class="brand-finale-model" src={BRAND_MODEL_SRC} camera-controls auto-rotate auto-rotate-delay="0" rotation-per-second="10deg" interaction-prompt="none" shadow-intensity="1" exposure="1.08" touch-action="pan-y" />
          <div className="brand-finale-caption"><span>Consistency, explained.</span><strong>I SEE YOU</strong></div>
        </div>
      </section>
    </main>
  )
}

function CategoryGlyph({ category }: { category: CategoryId }) {
  const path = category === 'image'
    ? 'M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5zM8.3 15.8h7.5l-2.65-3.4-1.9 2.25-1.35-1.6zm2.1-6.3a1.35 1.35 0 1 0 0-2.7 1.35 1.35 0 0 0 0 2.7'
    : category === 'text'
      ? 'M6 5h12v2H6zm0 4h12v2H6zm0 4h8v2H6zm0 4h12v2H6z'
      : category === 'video'
        ? 'M5 6.25A2.25 2.25 0 0 1 7.25 4h7.5A2.25 2.25 0 0 1 17 6.25v1.7l3.1-1.8c.42-.25.9.05.9.54v10.6c0 .49-.48.79-.9.54L17 16.03v1.72A2.25 2.25 0 0 1 14.75 20h-7.5A2.25 2.25 0 0 1 5 17.75z'
        : 'M6.5 5h4.25A1.5 1.5 0 0 1 12.2 6l.45 1.35c.2.58.74.97 1.36.97H17.5A1.5 1.5 0 0 1 19 9.82v7.68A1.5 1.5 0 0 1 17.5 19h-11A1.5 1.5 0 0 1 5 17.5v-11A1.5 1.5 0 0 1 6.5 5m2.2 4.2v5.6l4.7-2.8z'
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="category-glyph"><path d={path} /></svg>
}

function getAllowedFileMessage(category: CategoryConfig) {
  if (category.uploadKind === 'text') {
    return '이 페이지에서는 TXT 파일만 업로드할 수 있습니다.'
  }

  if (category.uploadKind === 'image') {
    return '이 페이지에서는 이미지 파일만 업로드할 수 있습니다.'
  }

  return '이 페이지에서는 비디오 파일만 업로드할 수 있습니다.'
}

function isAllowedFile(category: CategoryConfig, file: File) {
  const fileName = file.name.toLowerCase()
  const mimeType = file.type.toLowerCase()

  if (category.uploadKind === 'text') {
    return mimeType === 'text/plain' || fileName.endsWith('.txt')
  }

  if (category.uploadKind === 'image') {
    return mimeType.startsWith('image/')
  }

  if (category.uploadKind === 'video') {
    return mimeType.startsWith('video/')
  }

  return false
}

function UploadZone({
  category,
  upload,
  onUploadState,
}: {
  category: CategoryConfig
  upload: UploadState
  onUploadState: Dispatch<SetStateAction<UploadState>>
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const setFile = async (file: File | null) => {
    if (!file) return

    if (!isAllowedFile(category, file)) {
      alert(getAllowedFileMessage(category))
      return
    }

    onUploadState((current) => {
      if (current.previewUrl) {
        URL.revokeObjectURL(current.previewUrl)
      }

      return {
        ...current,
        file,
        previewUrl: category.uploadKind === 'text' ? '' : URL.createObjectURL(file),
      }
    })

    if (category.uploadKind === 'text') {
      const content = await file.text()
      onUploadState((current) => ({
        ...current,
        file,
        textValue: content,
      }))
    }
  }

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await setFile(event.target.files?.[0] ?? null)
    event.target.value = ''
  }

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    onUploadState((current) => ({ ...current, dragging: false }))
    await setFile(event.dataTransfer.files?.[0] ?? null)
  }

  return (
    <section
      className={`upload-surface ${upload.dragging ? 'is-dragging' : ''}`}
      onDragOver={(event) => {
        event.preventDefault()
        onUploadState((current) => ({ ...current, dragging: true }))
      }}
      onDragLeave={() =>
        onUploadState((current) => ({ ...current, dragging: false }))
      }
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={category.uploadAccept}
        hidden
        onChange={onFileChange}
      />

      <div className="upload-stage">
        {category.uploadKind === 'text' ? (
          <textarea
            className="upload-textarea"
            placeholder={category.inputHint}
            value={upload.textValue}
            onChange={(event) =>
              onUploadState((current) => ({
                ...current,
                textValue: event.target.value,
              }))
            }
          />
        ) : upload.previewUrl && upload.file?.type.startsWith('image/') ? (
          <img
            src={upload.previewUrl}
            alt="preview"
            className="upload-preview-image"
          />
        ) : upload.previewUrl && upload.file?.type.startsWith('video/') ? (
          <video
            src={upload.previewUrl}
            className="upload-preview-video"
            controls
          />
        ) : (
          <div className="upload-placeholder">
            <CategoryGlyph category={category.id} />
            <strong>{categoryNameKo(category.id)} 분석 스튜디오</strong>
            <span>{category.inputHint}</span>
          </div>
        )}
      </div>

      <div className="upload-toolbar">
        <div>
          <span className="upload-label">{category.kicker}</span>
          <strong>{upload.file?.name ?? '파일을 올려 주세요'}</strong>
        </div>
        <button
          type="button"
          className="secondary-cta"
          onClick={() => inputRef.current?.click()}
        >
          {category.uploadKind === 'text' ? 'TXT 업로드' : '파일 선택'}
        </button>
      </div>
    </section>
  )
}

function ProgressRail({ stages, progress, isAnalyzing }: { stages: string[]; progress: number; isAnalyzing: boolean }) {
  return (
    <section className="progress-rail">
      <div className="progress-rail-header"><div><span className="eyebrow">분석 진행</span><h3>현재 처리 상태</h3></div><strong>{Math.round(progress)}%</strong></div>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /><div className={`progress-glow ${isAnalyzing ? 'is-live' : ''}`} style={{ left: `${progress}%` }} /></div>
      <div className="progress-stage-row">{stages.map((stage, index) => <div key={stage} className={`progress-stage ${progress >= ((index + 1) / stages.length) * 100 ? 'is-active' : ''}`}><span>{String(index + 1).padStart(2, '0')}</span><strong>{stage}</strong></div>)}</div>
    </section>
  )
}

function ResultPanelPlaceholder({ profile, category }: { profile: Profile; category: CategoryConfig }) {
  const previewChips = category.id === 'image' ? ['장면 신뢰도', '얼굴 중심 판독', '아티팩트 오버레이'] : category.id === 'text' ? ['토큰 강조', '주장 근거', '출처 일치도'] : category.id === 'video' ? ['프레임 리듬', '립싱크', '시간축 이상 징후'] : ['교차 신호 점수', '융합 근거', '타임라인 XAI']
  return (
    <section className={`result-panel-placeholder tone-${profile.accent}`}>
      <div className="panel-header"><div><span className="eyebrow">결과 패널</span><h3>분석 결과가 이곳에 표시됩니다.</h3></div><span className="panel-chip">{profile.xai}</span></div>
      <div className="result-placeholder-core" aria-hidden="true"><div className="result-placeholder-ring" /><div className="result-placeholder-inner"><strong>진짜 / 가짜</strong><span>결과 대기 중</span></div></div>
      <p>파일을 업로드한 뒤 <strong>진위 판별 시작</strong>을 누르면 진짜/가짜 비율, 핵심 근거, XAI 결과가 이곳에 나타납니다.</p>
      <div className="result-placeholder-list">{previewChips.map((item) => <span key={item}>{item}</span>)}</div>
    </section>
  )
}

function ResultDashboard({ analysis, upload, category, profile }: { analysis: Analysis; upload: UploadState; category: CategoryConfig; profile: Profile }) {
  return (
    <section className="result-dashboard">
      <div className="result-summary">
        <div className="summary-copy">
          <span className="eyebrow">{category.kicker}</span>
          <h2>{analysis.summary}</h2>
          <p>{profile.title} / {profile.badge} / {profile.xai}</p>
        </div>
        <article className="confidence-dial">
          <div className="confidence-ring" style={{ backgroundImage: `conic-gradient(from 180deg, rgba(63,197,255,0.2) 0deg, rgba(118,255,204,0.9) ${analysis.fakePercent * 1.8}deg, rgba(255,255,255,0.08) ${analysis.fakePercent * 3.6}deg, rgba(255,255,255,0.04) 360deg)` }}>
            <div className="confidence-core"><span>{analysis.verdictLabel}</span><strong>{formatPercent(Math.max(analysis.fakePercent, analysis.realPercent))}</strong><small>confidence {analysis.confidence}%</small></div>
          </div>
          <div className="confidence-legend"><div><span>Real</span><strong>{formatPercent(analysis.realPercent)}</strong></div><div><span>Fake</span><strong>{formatPercent(analysis.fakePercent)}</strong></div></div>
        </article>
      </div>

      <div className="metric-grid">{analysis.metrics.map((metric) => <article key={metric.label} className="metric-card"><span>{metric.label}</span><strong>{metric.value}</strong><p>{metric.detail}</p></article>)}</div>

      <div className="result-grid">
        <article className="evidence-panel">
          <div className="panel-header"><div><span className="eyebrow">XAI VISUALIZATION</span><h3>XAI 시각화 보드</h3></div><span className="panel-chip">{category.id === 'text' ? 'Token trace' : 'Spatial overlay'}</span></div>
          {category.id === 'text' ? (
            <div className="text-highlight-cloud">{analysis.tokens.map((token) => <span key={`${token.tag}-${token.text}`} className="text-highlight-chip" style={{ opacity: 0.45 + token.weight * 0.55 }}>{token.text}<small>{token.tag}</small></span>)}</div>
          ) : (
            <div className="visual-stage">
              {upload.previewUrl ? (upload.file?.type.startsWith('video/') ? <video src={upload.previewUrl} className="visual-media" controls /> : <img src={upload.previewUrl} alt="analysis preview" className="visual-media" />) : <div className="visual-fallback">Preview not available</div>}
              <div className="visual-overlay">{analysis.regions.map((region) => <div key={region.id} className="focus-box" style={{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.width}%`, height: `${region.height}%`, ['--box-opacity' as string]: '0.75' } as CSSProperties}><span>{region.label}</span></div>)}</div>
            </div>
          )}
          <p className="panel-caption">{analysis.reasons[2]?.body ?? '가장 강한 단서가 집중된 영역과 구간을 시각적으로 강조했습니다.'}</p>
        </article>

        <article className="reasoning-panel">
          <div className="panel-header"><div><span className="eyebrow">EXPLANATION</span><h3>왜 이렇게 판단했는가</h3></div><span className="panel-chip">{analysis.verdictLabel}</span></div>
          <div className="reasoning-list">{analysis.reasons.map((reason) => <div key={reason.title} className="reasoning-card"><strong>{reason.title}</strong><p>{reason.body}</p></div>)}</div>
          <div className="modality-bars">{analysis.bars.map((bar) => <div key={bar.label} className="modality-row"><div className="modality-head"><strong>{bar.label}</strong><span>{Math.round(bar.score * 100)}%</span></div><div className="timeline-bar"><div className="timeline-bar-fill" style={{ width: `${bar.score * 100}%` }} /></div><p>{bar.note}</p></div>)}</div>
        </article>
      </div>

      <div className="result-grid secondary">
        <article className="pipeline-panel"><div className="panel-header"><div><span className="eyebrow">PIPELINE TRACE</span><h3>파이프라인 단계</h3></div><span className="panel-chip">Explainable flow</span></div><div className="reasoning-list compact">{analysis.metrics.length ? analysis.metrics.slice(0, 1).map((metric) => <div key={metric.label} className="studio-inline-note-card"><strong>{metric.label}</strong><span>{metric.value}</span><p>{metric.detail}</p></div>) : null}{analysis.timeline.length ? <p className="panel-caption">{analysis.summary}</p> : null}{category.stageLabels.map((stage, index) => <div key={stage} className="reasoning-card"><span className="stage-index">{String(index + 1).padStart(2, '0')}</span><strong>{analysis.timeline[index]?.label ?? stage}</strong><p>{analysis.reasons[index % analysis.reasons.length].body}</p></div>)}</div></article>
        <article className="timeline-panel"><div className="panel-header"><div><span className="eyebrow">TIMELINE EVIDENCE</span><h3>증거 타임라인</h3></div></div><div className="timeline-list">{analysis.timeline.map((slice) => <div key={`${slice.label}-${slice.start}`} className="timeline-item"><div className="timeline-meta"><strong>{slice.label}</strong><span>{slice.start} - {slice.end}</span></div><div className="timeline-bar"><div className="timeline-bar-fill" style={{ width: `${slice.score * 100}%` }} /></div><p>{slice.note}</p></div>)}</div></article>
      </div>
    </section>
  )
}
function StudioPage({ category, onBack }: { category: CategoryConfig; onBack: () => void }) {
  const [activeProfileId, setActiveProfileId] = useState(getDefaultProfile(category).id)
  const [upload, setUpload] = useState<UploadState>(initialUploadState)
  const [progress, setProgress] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [imageScope, setImageScope] = useState<'full-scene' | 'face-focus'>('full-scene')
  const [xaiDepth, setXaiDepth] = useState<'signature' | 'deep-dive'>('signature')
  const [companionText, setCompanionText] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    setActiveProfileId(getDefaultProfile(category).id)
    setUpload(initialUploadState())
    setProgress(0)
    setIsAnalyzing(false)
    setAnalysis(null)
    setErrorMessage('')
  }, [category])

  useEffect(() => () => { if (timerRef.current) window.clearInterval(timerRef.current) }, [])

  const activeProfile = category.profiles.find((profile) => profile.id === activeProfileId) ?? category.profiles[0]
  const canAnalyze = category.uploadKind === 'text' ? upload.textValue.trim().length > 0 || upload.file !== null : upload.file !== null

  const handleAnalyze = async () => {
    if (!canAnalyze) return
    setAnalysis(null)
    setErrorMessage('')
    setIsAnalyzing(true)
    setProgress(4)
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 94) return current
        const step = current < 30 ? 8 : current < 65 ? 5 : 2
        return Math.min(94, current + step)
      })
    }, 260)
    try {
      const nextAnalysis = await requestAnalysis({
        category,
        activeProfile,
        upload,
        imageScope,
        xaiDepth,
        companionText,
      })
      if (timerRef.current) window.clearInterval(timerRef.current)
      setProgress(100)
      setAnalysis(nextAnalysis)
    } catch (error) {
      console.error(error)
      if (timerRef.current) window.clearInterval(timerRef.current)

      const message =
        error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.'

      const isFileTypeError =
        message.includes('TXT 파일만 업로드할 수 있습니다.') ||
        message.includes('이미지 파일만 업로드할 수 있습니다.') ||
        message.includes('비디오 파일만 업로드할 수 있습니다.')

      if (isFileTypeError) {
        setProgress(0)
        setAnalysis(null)
        setErrorMessage(message)
      } else {
        setProgress(100)
        setAnalysis(buildAnalysis(category, activeProfile, upload))
        setErrorMessage('실시간 API 연결에 실패해 데모 분석 결과로 전환했습니다.')
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const base = (
    <main className="page page-studio">
      <section className="studio-hero">
        <div className="studio-copy">
          <button type="button" className="ghost-back" onClick={onBack}>메인으로 돌아가기</button>
          <span className="eyebrow">{category.kicker}</span>
          <h1>{activeProfile.title}</h1>
          <p>{activeProfile.description}</p>
          <div className="category-sense-row">{activeProfile.capabilities.map((item) => <span key={item}>{item}</span>)}</div>
        </div>
        <div className={`studio-highlight studio-atlas tone-${activeProfile.accent}`}><div className="studio-atlas-media"><model-viewer class="studio-brand-model" src={BRAND_MODEL_SRC} camera-controls auto-rotate auto-rotate-delay="0" rotation-per-second="12deg" interaction-prompt="none" shadow-intensity="1" exposure="1.05" disable-zoom touch-action="pan-y" /></div><div className="studio-atlas-copy"><span>{activeProfile.badge}</span><strong>{activeProfile.xai}</strong><small>{activeProfile.latency}</small></div></div>
      </section>

      <section className="selector-rack">{category.profiles.map((profile) => <button key={profile.id} type="button" className={`selector-pill ${profile.id === activeProfileId ? 'is-active' : ''} tone-${profile.accent}`} onClick={() => setActiveProfileId(profile.id)}><strong>{profile.title}</strong><span>{profile.subtitle}</span></button>)}</section>

      <section className="studio-workbench">
        <aside className="studio-side-panel">
          <article className="studio-preamble-card"><span className="eyebrow">분석 결과</span><h3>선택한 모델 기준으로 결과 카드와 설명 패널이 생성됩니다.</h3><p>진짜/가짜 비율, 핵심 근거 카드, 설명 가능한 시각화, 타임라인 분석까지 한 번에 확인할 수 있습니다.</p><div className="mission-steps">{category.stageLabels.map((stage, index) => <span key={stage}>{String(index + 1).padStart(2, '0')} {stage}</span>)}</div></article>
          <aside className="control-panel">
            <div className="panel-header"><div><span className="eyebrow">설정</span><h3>모델 설정</h3></div></div>
            {category.id === 'image' ? <div className="control-block"><label>Vision focus</label><div className="segmented"><button type="button" className={imageScope === 'full-scene' ? 'is-active' : ''} onClick={() => setImageScope('full-scene')}>전체 배경 AI 모델</button><button type="button" className={imageScope === 'face-focus' ? 'is-active' : ''} onClick={() => setImageScope('face-focus')}>얼굴 전용 모델</button></div></div> : null}
            {category.id === 'video' || category.id === 'multimodal' ? <div className="control-block"><label>XAI 깊이</label><div className="segmented"><button type="button" className={xaiDepth === 'signature' ? 'is-active' : ''} onClick={() => setXaiDepth('signature')}>기본</button><button type="button" className={xaiDepth === 'deep-dive' ? 'is-active' : ''} onClick={() => setXaiDepth('deep-dive')}>상세</button></div></div> : null}
            {category.id === 'text' || category.id === 'multimodal' ? <div className="control-block"><label>{category.id === 'text' ? '입력 텍스트' : '보조 설명'}</label><textarea className="side-textarea" placeholder={category.id === 'text' ? '분석할 텍스트를 붙여넣거나 TXT 파일을 업로드하세요.' : '선택 사항: 캡션, 설명, 기사 문장 등을 함께 입력하세요.'} value={category.id === 'text' ? upload.textValue : companionText} onChange={(event) => category.id === 'text' ? setUpload((current) => ({ ...current, textValue: event.target.value })) : setCompanionText(event.target.value)} /></div> : null}
            <div className="control-list">{activeProfile.capabilities.map((capability) => <div key={capability} className="control-capability"><span className="highlight-dot" /><strong>{capability}</strong></div>)}</div>
            {errorMessage ? <p className="studio-inline-note">{errorMessage}</p> : null}
            <div className="action-row">
              <button type="button" className="primary-cta wide" onClick={handleAnalyze} disabled={!canAnalyze || isAnalyzing}>{isAnalyzing ? '분석 중...' : '진위 판별 시작'}</button>
              <button type="button" className="secondary-cta wide" onClick={() => { setUpload(initialUploadState()); setProgress(0); setIsAnalyzing(false); setAnalysis(null); setCompanionText(''); setErrorMessage('') }}>초기화</button>
            </div>
          </aside>
        </aside>

        <section className="studio-center-panel">
          <article className="studio-preamble-card"><span className="eyebrow">업로드 흐름</span><h3>파일을 올리면 중앙 무대에서 분석이 순차적으로 진행됩니다.</h3><p>드래그 앤 드롭, 선택한 모델, 진행 게이지가 함께 보이며 분석 완료 후 우측 패널에 결과가 채워집니다.</p></article>
          <section className="studio-status-strip"><article className="studio-status-card"><span>선택 모델</span><strong>{activeProfile.title}</strong><small>{activeProfile.subtitle}</small></article><article className="studio-status-card"><span>입력 상태</span><strong>{upload.file ? upload.file.name : category.uploadKind === 'text' && upload.textValue ? '텍스트 입력 완료' : '입력을 기다리는 중'}</strong><small>{category.uploadKind === 'text' ? '텍스트 / 근거 / 설명' : '파일을 드래그하거나 직접 선택하세요'}</small></article><article className="studio-status-card"><span>분석 상태</span><strong>{isAnalyzing ? '분석 진행 중' : analysis ? '결과 준비 완료' : '대기 중'}</strong><small>{Math.round(progress)}% 진행</small></article></section>
          <UploadZone category={category} upload={upload} onUploadState={setUpload} />
          <ProgressRail stages={category.stageLabels} progress={progress} isAnalyzing={isAnalyzing} />
        </section>

        <aside className="studio-result-panel">
          {analysis ? <ResultDashboard analysis={analysis} upload={upload} category={category} profile={activeProfile} /> : <ResultPanelPlaceholder profile={activeProfile} category={category} />}
        </aside>
      </section>
    </main>
  )

  if (category.id === 'image') return <ImageStudioRoute>{base}</ImageStudioRoute>
  if (category.id === 'text') return <TextStudioRoute>{base}</TextStudioRoute>
  if (category.id === 'video') return <VideoStudioRoute>{base}</VideoStudioRoute>
  return <MultimodalStudioRoute>{base}</MultimodalStudioRoute>
}

export default function App() {
  const [view, setView] = useState<View>(() => parseHashToView(window.location.hash))
  const activeCategory = view.screen === 'studio' ? view.category : null

  useEffect(() => {
    const handleHashChange = () => {
      setView(parseHashToView(window.location.hash))
    }

    window.addEventListener('hashchange', handleHashChange)
    handleHashChange()
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const openHome = () => {
    const nextView: View = { screen: 'home' }
    transitionTo(() => setView(nextView))
    syncHash(nextView)
  }

  const openStudio = (category: CategoryId) => {
    const nextView: View = { screen: 'studio', category }
    transitionTo(() => setView(nextView))
    syncHash(nextView)
  }

  return (
    <Shell onHome={openHome} onSelectCategory={openStudio} activeCategory={activeCategory}>
      {view.screen === 'home' ? <HomePage onOpenCategory={openStudio} /> : <StudioPage key={view.category} category={CATEGORY_CONFIG[view.category]} onBack={openHome} />}
    </Shell>
  )
}

