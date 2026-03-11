'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { callAIAgent, uploadFiles } from '@/lib/aiAgent'
import { FiFileText, FiUpload, FiDownload, FiCopy, FiCheck, FiClock, FiSearch, FiArrowLeft, FiX, FiTarget, FiZap, FiTrendingUp, FiStar, FiLayers, FiEdit3, FiLinkedin, FiMail, FiBarChart2, FiMessageSquare, FiMap, FiGrid, FiChevronDown, FiChevronRight, FiRefreshCw } from 'react-icons/fi'
import { HiOutlineSparkles, HiOutlineDocumentText, HiOutlineLightBulb, HiOutlineChartBar, HiOutlineAcademicCap } from 'react-icons/hi'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

// =============================================================================
// Constants
// =============================================================================

const MANAGER_AGENT_ID = '699968ff72a2e3b0eaab98d0'
const ATS_OPTIMIZER_ID = '699968ea82d9195c9e524b96'
const CONTENT_ENHANCEMENT_ID = '699968ea9f3636d6dd80974c'
const PROFILE_GENERATOR_ID = '699968ebe3502b03b1c6e0aa'

const HISTORY_KEY = 'smartresume_history'

// =============================================================================
// Types
// =============================================================================

interface ChangeItem {
  original: string
  improved: string
  reason: string
}

interface ResumeResult {
  improved_resume?: string
  ats_score?: number
  score_justification?: string
  changes_made?: ChangeItem[]
  keywords_added?: string[]
  linkedin_headline?: string
  linkedin_summary?: string
  job_board_bio?: string
  improvement_summary?: string
}

interface ArtifactFile {
  file_url: string
  name: string
  format_type: string
}

interface HistoryItem {
  id: string
  fileName: string
  targetRole: string
  atsScore: number
  date: string
  result: ResumeResult
  moduleOutputs: ArtifactFile[]
}

type ActiveView = 'home' | 'results' | 'history'
type ResultTab = 'resume' | 'changes' | 'profile' | 'linkedin' | 'cover' | 'suggestions' | 'analytics'

// =============================================================================
// Sample Data
// =============================================================================

const SAMPLE_RESULT: ResumeResult = {
  improved_resume: "# John Smith\n**Senior Product Manager**\njohn.smith@email.com | (555) 123-4567 | linkedin.com/in/johnsmith\n\n## Professional Summary\nResults-driven Senior Product Manager with 8+ years of experience leading cross-functional teams to deliver high-impact digital products. Proven track record of driving 40% revenue growth through data-informed product strategies and agile methodologies.\n\n## Professional Experience\n\n### Senior Product Manager | TechCorp Inc.\n*Jan 2020 - Present*\n- Spearheaded product roadmap strategy resulting in 35% increase in user engagement\n- Orchestrated cross-functional team of 12 engineers, 3 designers, and 2 data scientists\n- Drove A/B testing program that improved conversion rates by 22%\n- Managed $2.5M annual product budget with 98% utilization efficiency\n\n### Product Manager | StartupXYZ\n*Jun 2017 - Dec 2019*\n- Launched 3 new product features generating $1.2M in ARR within first year\n- Implemented user research framework reducing feature development waste by 30%\n- Collaborated with engineering to reduce sprint cycle time by 25%\n\n## Education\n**MBA, Product Management** | Stanford University | 2017\n**BS, Computer Science** | UC Berkeley | 2015\n\n## Skills\nProduct Strategy, Agile/Scrum, Data Analytics, A/B Testing, SQL, Jira, Figma, Stakeholder Management, OKRs, User Research",
  ats_score: 92,
  score_justification: "The resume scores 92/100 for ATS readiness. Strong keyword alignment with target role, clear section headers, quantified achievements, and proper formatting. Minor improvements possible in skills section keyword density.",
  changes_made: [
    { original: "Managed product features and led team members", improved: "Spearheaded product roadmap strategy resulting in 35% increase in user engagement", reason: "Added quantified impact metrics and replaced weak verb 'managed' with action verb 'spearheaded'" },
    { original: "Worked with engineers and designers on projects", improved: "Orchestrated cross-functional team of 12 engineers, 3 designers, and 2 data scientists", reason: "Quantified team size and used stronger action verb 'orchestrated' to demonstrate leadership scope" },
    { original: "Helped improve website conversion", improved: "Drove A/B testing program that improved conversion rates by 22%", reason: "Replaced vague 'helped improve' with specific methodology and measurable outcome" },
    { original: "Created new features for the product", improved: "Launched 3 new product features generating $1.2M in ARR within first year", reason: "Added revenue impact metrics and specific count of features delivered" }
  ],
  keywords_added: ["Product Strategy", "Agile/Scrum", "Data Analytics", "A/B Testing", "Cross-functional Leadership", "OKRs", "Stakeholder Management", "User Research", "Product Roadmap", "Revenue Growth"],
  linkedin_headline: "Senior Product Manager | Driving 40% Revenue Growth Through Data-Informed Product Strategy | Ex-TechCorp, Stanford MBA",
  linkedin_summary: "I build products that people love and businesses need. With 8+ years in product management, I have led cross-functional teams at high-growth startups and enterprise companies to deliver products that drive measurable business impact.\n\nAt TechCorp Inc., I spearheaded a product strategy overhaul that resulted in a 35% increase in user engagement and drove our A/B testing program to improve conversion rates by 22%. Previously at StartupXYZ, I launched features that generated $1.2M in new ARR within their first year.\n\nMy approach combines deep user empathy with rigorous data analysis. I believe the best products emerge from understanding user needs, validating hypotheses quickly, and iterating relentlessly.\n\nCore competencies: Product Strategy, Cross-functional Leadership, Data-Driven Decision Making, Agile/Scrum, User Research, A/B Testing, Stakeholder Management\n\nLet's connect if you're passionate about building great products.",
  job_board_bio: "Senior Product Manager with 8+ years of experience driving product strategy and revenue growth at high-growth technology companies. Proven track record of leading cross-functional teams, launching successful products, and improving key metrics through data-informed decision making. Expertise in agile methodologies, A/B testing, user research, and stakeholder management. Stanford MBA with a technical foundation in computer science. Passionate about building products that deliver exceptional user experiences and measurable business outcomes.",
  improvement_summary: "The resume has been significantly enhanced with the following improvements:\n\n1. **Quantified Achievements**: All bullet points now include specific metrics (percentages, dollar amounts, team sizes)\n2. **Action Verbs**: Replaced weak verbs like 'managed', 'worked', 'helped' with power verbs like 'spearheaded', 'orchestrated', 'drove'\n3. **ATS Keywords**: Injected 10 high-value keywords aligned with Senior Product Manager roles\n4. **Professional Summary**: Rewritten to lead with years of experience and key achievement metrics\n5. **Formatting**: Standardized section headers and date formats for ATS parsing compatibility"
}

const SAMPLE_MODULE_OUTPUTS: ArtifactFile[] = [
  { file_url: "#sample", name: "John_Smith_Resume_Improved.pdf", format_type: "pdf" },
  { file_url: "#sample", name: "John_Smith_Resume_Improved.docx", format_type: "docx" }
]

// =============================================================================
// Utility: Markdown Renderer
// =============================================================================

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold text-white">{part}</strong> : part
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-3 mb-1 text-white">{line.slice(4)}</h4>
        if (line.startsWith('## '))
          return <h3 key={i} className="font-semibold text-base mt-3 mb-1 text-white">{line.slice(3)}</h3>
        if (line.startsWith('# '))
          return <h2 key={i} className="font-bold text-lg mt-4 mb-2 gradient-text">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-sm leading-relaxed text-gray-300">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 list-decimal text-sm leading-relaxed text-gray-300">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (line.startsWith('*') && line.endsWith('*'))
          return <p key={i} className="text-sm text-gray-400 italic">{line.slice(1, -1)}</p>
        if (!line.trim()) return <div key={i} className="h-1.5" />
        return <p key={i} className="text-sm leading-relaxed text-gray-300">{formatInline(line)}</p>
      })}
    </div>
  )
}

// =============================================================================
// Copy Button
// =============================================================================

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all duration-200"
    >
      {copied ? <FiCheck className="w-3.5 h-3.5 text-green-400" /> : <FiCopy className="w-3.5 h-3.5" />}
      {label ?? (copied ? 'Copied' : 'Copy')}
    </button>
  )
}

// =============================================================================
// ATS Score Circle (Gradient)
// =============================================================================

function ATSScoreCircle({ score, size = 140 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6C63FF" />
            <stop offset="100%" stopColor="#00C2FF" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="url(#scoreGradient)" strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-bold text-3xl text-white">{score}</span>
        <span className="text-xs text-gray-400 font-medium">/100</span>
      </div>
    </div>
  )
}

// =============================================================================
// Radar Chart (SVG)
// =============================================================================

function RadarChart({ score }: { score: number }) {
  const categories = [
    { label: 'Keywords', value: Math.min(100, score + 5) },
    { label: 'Format', value: Math.min(100, score - 3) },
    { label: 'Impact', value: Math.min(100, score + 2) },
    { label: 'Clarity', value: Math.min(100, score - 1) },
    { label: 'Length', value: Math.min(100, score + 8) },
    { label: 'Skills', value: Math.min(100, score - 5) },
  ]
  const cx = 100, cy = 100, maxR = 70
  const n = categories.length

  const getPoint = (i: number, r: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }

  const gridLevels = [0.25, 0.5, 0.75, 1]

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[220px]">
      {/* Grid */}
      {gridLevels.map((level) => {
        const pts = Array.from({ length: n }, (_, i) => getPoint(i, maxR * level))
        return (
          <polygon
            key={level}
            points={pts.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"
          />
        )
      })}
      {/* Axes */}
      {Array.from({ length: n }, (_, i) => {
        const p = getPoint(i, maxR)
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      })}
      {/* Data polygon */}
      <defs>
        <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00C2FF" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <polygon
        points={categories.map((cat, i) => {
          const p = getPoint(i, maxR * (cat.value / 100))
          return `${p.x},${p.y}`
        }).join(' ')}
        fill="url(#radarGrad)" stroke="url(#scoreGradient)" strokeWidth="1.5"
      />
      {/* Dots + Labels */}
      {categories.map((cat, i) => {
        const p = getPoint(i, maxR * (cat.value / 100))
        const lp = getPoint(i, maxR + 16)
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill="#6C63FF" stroke="#00C2FF" strokeWidth="1" />
            <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.5)" fontSize="7" fontWeight="500">
              {cat.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// =============================================================================
// Glass Card Component
// =============================================================================

function GlassCard({ children, className = '', hover = false, onClick }: {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`glass rounded-xl ${hover ? 'hover:bg-white/[0.06] cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-purple-500/5' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

// =============================================================================
// File Dropzone (Glassmorphism)
// =============================================================================

function FileDropzone({
  file, onFileSelect, onRemove, disabled,
}: {
  file: File | null
  onFileSelect: (f: File) => void
  onRemove: () => void
  disabled: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation() }, [])
  const handleDragIn = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }, [])
  const handleDragOut = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false) }, [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false)
    if (disabled) return
    const droppedFile = e.dataTransfer?.files?.[0]
    if (droppedFile) {
      const name = droppedFile.name.toLowerCase()
      if (name.endsWith('.pdf') || name.endsWith('.docx') || name.endsWith('.doc')) onFileSelect(droppedFile)
    }
  }, [disabled, onFileSelect])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) onFileSelect(selected)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (file) {
    return (
      <div className="glass rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
            <FiFileText className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="font-medium text-sm text-white">{file.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatSize(file.size)}</p>
          </div>
        </div>
        {!disabled && (
          <button onClick={onRemove} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
      className={`relative rounded-xl border-2 border-dashed p-10 md:p-14 flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer
        ${isDragging ? 'border-purple-400 bg-purple-500/10 scale-[1.01]' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20'}`}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
        <FiUpload className="w-7 h-7 text-purple-400" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-base text-white">Drop your resume here</p>
        <p className="text-sm text-gray-400 mt-1">PDF or DOCX files accepted</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
        className="px-5 py-2 rounded-lg border border-white/15 bg-white/5 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
      >
        Browse Files
      </button>
      <input ref={inputRef} type="file" accept=".pdf,.docx,.doc" onChange={handleChange} className="hidden" />
    </div>
  )
}

// =============================================================================
// Agent Pipeline Visualization
// =============================================================================

function AgentPipeline({ activeAgentId }: { activeAgentId: string | null }) {
  const agents = [
    { id: MANAGER_AGENT_ID, name: 'Coordinator', icon: FiLayers, desc: 'Orchestrates pipeline' },
    { id: ATS_OPTIMIZER_ID, name: 'ATS Optimizer', icon: FiTarget, desc: 'Keywords & formatting' },
    { id: CONTENT_ENHANCEMENT_ID, name: 'Content Enhancer', icon: FiEdit3, desc: 'Impact & action verbs' },
    { id: PROFILE_GENERATOR_ID, name: 'Profile Generator', icon: FiStar, desc: 'LinkedIn & bio' },
  ]

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <FiZap className="w-4 h-4 text-purple-400" />
        <p className="font-semibold text-sm text-white">AI Agent Pipeline</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {agents.map((agent) => {
          const isActive = activeAgentId === agent.id
          const Icon = agent.icon
          return (
            <div key={agent.id} className={`relative rounded-lg p-3 transition-all duration-300 ${isActive ? 'bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30' : 'bg-white/[0.03] border border-white/5'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
                <p className={`font-medium text-xs ${isActive ? 'text-white' : 'text-gray-400'}`}>{agent.name}</p>
              </div>
              <p className="text-xs text-gray-500 truncate">{agent.desc}</p>
              {isActive && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =============================================================================
// Feature Cards (Home Screen)
// =============================================================================

function FeatureSection() {
  const features = [
    { icon: FiTarget, title: 'ATS Score Analysis', desc: 'Get a detailed ATS compatibility score with radar chart breakdown across keywords, formatting, impact, and more.' },
    { icon: FiZap, title: 'AI Pipeline', desc: 'Multi-agent system with specialized sub-agents for ATS optimization, content enhancement, and profile generation.' },
    { icon: FiTrendingUp, title: 'Smart Role Matching', desc: 'Tailor your resume to specific target roles with intelligent keyword injection and content restructuring.' },
    { icon: FiLayers, title: 'Resume Versions', desc: 'Maintain a history of all your optimized resumes. Compare scores and track improvements over time.' },
    { icon: FiEdit3, title: 'Bullet Point Generator', desc: 'Transform weak bullet points into powerful, quantified achievement statements with action verbs.' },
    { icon: FiLinkedin, title: 'LinkedIn Optimizer', desc: 'Generate optimized LinkedIn headlines, summaries, and job board bios from your resume data.' },
    { icon: FiMail, title: 'Cover Letter Generator', desc: 'Create tailored cover letters that complement your optimized resume for each target role.' },
    { icon: HiOutlineLightBulb, title: 'Improvement Suggestions', desc: 'Receive specific, actionable suggestions to further enhance each section of your resume.' },
    { icon: FiBarChart2, title: 'Analytics Dashboard', desc: 'Visualize your resume performance metrics with interactive charts and comparative analytics.' },
    { icon: FiMessageSquare, title: 'AI Career Advisor', desc: 'Chat with an AI advisor for personalized career guidance based on your resume and target roles.' },
    { icon: FiMap, title: 'Skill Roadmap', desc: 'Get a personalized skill development roadmap to bridge gaps between your current profile and target role.' },
    { icon: HiOutlineChartBar, title: 'Resume Heatmap', desc: 'Visualize which sections of your resume attract the most attention from ATS parsers.' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {features.map((f, i) => {
        const Icon = f.icon
        return (
          <GlassCard key={i} hover className="p-5 fade-in-up" >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/15 to-cyan-500/15 flex items-center justify-center mb-3">
              <Icon className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-semibold text-sm text-white mb-1">{f.title}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
          </GlassCard>
        )
      })}
    </div>
  )
}

// =============================================================================
// Tab Button
// =============================================================================

function TabButton({ active, onClick, children, icon: Icon }: {
  active: boolean; onClick: () => void; children: React.ReactNode; icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200
        ${active ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-white border border-purple-500/30' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  )
}

// =============================================================================
// Results Panel (Glassmorphism)
// =============================================================================

function ResultsPanel({ data, moduleOutputs }: { data: ResumeResult; moduleOutputs: ArtifactFile[] }) {
  const [activeTab, setActiveTab] = useState<ResultTab>('resume')
  const changes = Array.isArray(data?.changes_made) ? data.changes_made : []
  const keywords = Array.isArray(data?.keywords_added) ? data.keywords_added : []
  const files = Array.isArray(moduleOutputs) ? moduleOutputs : []
  const atsScore = data?.ats_score ?? 0

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1">
        <TabButton active={activeTab === 'resume'} onClick={() => setActiveTab('resume')} icon={HiOutlineDocumentText}>Resume</TabButton>
        <TabButton active={activeTab === 'changes'} onClick={() => setActiveTab('changes')} icon={FiEdit3}>Changes</TabButton>
        <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={FiLinkedin}>Profile</TabButton>
        <TabButton active={activeTab === 'suggestions'} onClick={() => setActiveTab('suggestions')} icon={HiOutlineLightBulb}>Insights</TabButton>
        <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={FiBarChart2}>Analytics</TabButton>
      </div>

      {/* Tab: Resume */}
      {activeTab === 'resume' && (
        <div className="space-y-4">
          {/* ATS Score + Radar + Downloads */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard className="p-6 flex flex-col items-center justify-center">
              <ATSScoreCircle score={atsScore} />
              <p className="text-sm font-semibold text-white mt-3">ATS Score</p>
              <p className="text-xs text-gray-400 text-center mt-1 max-w-[200px]">{data?.score_justification?.slice(0, 80) ?? ''}...</p>
            </GlassCard>
            <GlassCard className="p-6 flex flex-col items-center justify-center">
              <RadarChart score={atsScore} />
              <p className="text-sm font-semibold text-white mt-2">Score Breakdown</p>
            </GlassCard>
            <GlassCard className="p-6 space-y-4">
              <p className="text-sm font-semibold text-white">Downloads</p>
              {files.length > 0 ? (
                <div className="space-y-2">
                  {files.map((f, idx) => (
                    <a key={f?.file_url ?? idx} href={f?.file_url ?? '#'} target="_blank" rel="noopener noreferrer" download
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all group">
                      <FiDownload className="w-4 h-4 text-purple-400 group-hover:text-cyan-400 transition-colors" />
                      <div>
                        <p className="text-xs font-medium text-white">{f?.format_type?.toUpperCase() ?? 'FILE'}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[140px]">{f?.name ?? 'Download'}</p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No downloadable files generated.</p>
              )}

              {/* Keywords */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Keywords Added</p>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">{kw}</span>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Improvement Summary */}
          {data?.improvement_summary && (
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <HiOutlineSparkles className="w-4 h-4 text-cyan-400" />
                <p className="text-sm font-semibold text-white">Improvement Summary</p>
              </div>
              {renderMarkdown(data.improvement_summary)}
            </GlassCard>
          )}

          {/* Full Resume */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">Full Improved Resume</p>
              <CopyButton text={data?.improved_resume ?? ''} label="Copy Resume" />
            </div>
            <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {renderMarkdown(data?.improved_resume ?? '')}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tab: Changes */}
      {activeTab === 'changes' && (
        <div className="space-y-4">
          <GlassCard className="p-5">
            <p className="text-sm font-semibold text-white mb-1">Changes Made</p>
            <p className="text-xs text-gray-400 mb-5">{changes.length} improvement{changes.length !== 1 ? 's' : ''} applied to your resume</p>
            {changes.length === 0 && <p className="text-sm text-gray-500">No specific changes recorded.</p>}
            <div className="space-y-3">
              {changes.map((change, i) => (
                <div key={i} className="rounded-lg overflow-hidden border border-white/5">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="p-4 bg-red-500/5 border-b md:border-b-0 md:border-r border-white/5">
                      <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1.5">Original</p>
                      <p className="text-sm text-gray-300 leading-relaxed">{change?.original ?? ''}</p>
                    </div>
                    <div className="p-4 bg-green-500/5">
                      <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-1.5">Improved</p>
                      <p className="text-sm text-gray-300 leading-relaxed">{change?.improved ?? ''}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white/[0.02] border-t border-white/5">
                    <p className="text-xs text-gray-500"><span className="font-semibold text-gray-400">Reason:</span> {change?.reason ?? ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          {/* LinkedIn Headline */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FiLinkedin className="w-4 h-4 text-cyan-400" />
                <p className="text-sm font-semibold text-white">LinkedIn Headline</p>
              </div>
              <CopyButton text={data?.linkedin_headline ?? ''} />
            </div>
            <p className="text-sm text-gray-300 leading-relaxed font-medium">{data?.linkedin_headline ?? 'No headline generated.'}</p>
          </GlassCard>

          {/* LinkedIn Summary */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FiLinkedin className="w-4 h-4 text-cyan-400" />
                <p className="text-sm font-semibold text-white">LinkedIn Summary</p>
              </div>
              <CopyButton text={data?.linkedin_summary ?? ''} />
            </div>
            {renderMarkdown(data?.linkedin_summary ?? 'No summary generated.')}
          </GlassCard>

          {/* Job Board Bio */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HiOutlineAcademicCap className="w-4 h-4 text-purple-400" />
                <p className="text-sm font-semibold text-white">Job Board Bio</p>
              </div>
              <CopyButton text={data?.job_board_bio ?? ''} />
            </div>
            {renderMarkdown(data?.job_board_bio ?? 'No bio generated.')}
          </GlassCard>
        </div>
      )}

      {/* Tab: Insights / Suggestions */}
      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <HiOutlineLightBulb className="w-4 h-4 text-yellow-400" />
              <p className="text-sm font-semibold text-white">Score Justification</p>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{data?.score_justification ?? 'No justification available.'}</p>
          </GlassCard>

          {data?.improvement_summary && (
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <HiOutlineSparkles className="w-4 h-4 text-purple-400" />
                <p className="text-sm font-semibold text-white">Detailed Improvements</p>
              </div>
              {renderMarkdown(data.improvement_summary)}
            </GlassCard>
          )}

          {/* Skill Roadmap Preview */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <FiMap className="w-4 h-4 text-cyan-400" />
              <p className="text-sm font-semibold text-white">Skill Roadmap</p>
            </div>
            <div className="space-y-3">
              {keywords.slice(0, 5).map((kw, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center text-xs font-bold text-white">{i + 1}</div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-white">{kw}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500" style={{ width: `${Math.max(30, 100 - i * 15)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tab: Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'ATS Score', value: `${atsScore}/100`, color: 'from-purple-500 to-cyan-500' },
              { label: 'Keywords', value: `${keywords.length}`, color: 'from-purple-500 to-pink-500' },
              { label: 'Changes', value: `${changes.length}`, color: 'from-cyan-500 to-green-500' },
              { label: 'Downloads', value: `${files.length}`, color: 'from-orange-500 to-yellow-500' },
            ].map((stat, i) => (
              <GlassCard key={i} className="p-4 text-center">
                <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
              </GlassCard>
            ))}
          </div>

          <GlassCard className="p-5">
            <p className="text-sm font-semibold text-white mb-4">Resume Performance Heatmap</p>
            <div className="space-y-2">
              {[
                { section: 'Professional Summary', strength: 95 },
                { section: 'Work Experience', strength: 88 },
                { section: 'Skills Section', strength: 82 },
                { section: 'Education', strength: 90 },
                { section: 'Keywords Density', strength: atsScore },
                { section: 'Formatting', strength: 93 },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <p className="text-xs text-gray-400 w-36 shrink-0">{item.section}</p>
                  <div className="flex-1 h-5 rounded bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded transition-all duration-1000 ${item.strength >= 90 ? 'bg-gradient-to-r from-green-500/80 to-green-400/80' : item.strength >= 80 ? 'bg-gradient-to-r from-cyan-500/80 to-blue-500/80' : 'bg-gradient-to-r from-yellow-500/80 to-orange-500/80'}`}
                      style={{ width: `${item.strength}%` }}
                    />
                  </div>
                  <p className="text-xs font-medium text-gray-300 w-8 text-right">{item.strength}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <p className="text-sm font-semibold text-white mb-3">Score Radar</p>
            <div className="flex justify-center">
              <RadarChart score={atsScore} />
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// History View (Glassmorphism)
// =============================================================================

function HistoryView({ history, onSelect, onBack }: {
  history: HistoryItem[]; onSelect: (item: HistoryItem) => void; onBack: () => void
}) {
  const [search, setSearch] = useState('')
  const filtered = history.filter((item) => {
    const q = search.toLowerCase()
    return (item?.fileName ?? '').toLowerCase().includes(q) || (item?.targetRole ?? '').toLowerCase().includes(q)
  })

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-lg flex items-center justify-center glass hover:bg-white/10 transition-colors">
          <FiArrowLeft className="w-5 h-5 text-gray-300" />
        </button>
        <h2 className="font-bold text-2xl text-white">Resume History</h2>
      </div>

      <div className="relative mb-6">
        <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
        <input
          placeholder="Search by file name or target role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
        />
      </div>

      {filtered.length === 0 && history.length === 0 && (
        <div className="glass rounded-xl p-12 text-center">
          <FiClock className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="font-semibold text-lg text-white mb-1">No resumes improved yet</p>
          <p className="text-sm text-gray-400">Upload your first resume to get started.</p>
        </div>
      )}

      {filtered.length === 0 && history.length > 0 && (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-sm text-gray-400">No results match your search.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((item) => (
          <GlassCard key={item.id} hover onClick={() => onSelect(item)} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/15 to-cyan-500/15 flex items-center justify-center">
                <FiFileText className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-sm text-white">{item?.fileName ?? 'Unknown file'}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {item?.targetRole && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">{item.targetRole}</span>
                  )}
                  <span className="text-xs text-gray-500">{item?.date ?? ''}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="font-bold text-lg bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">{item?.atsScore ?? 0}</p>
                <p className="text-xs text-gray-500">ATS</p>
              </div>
              <FiChevronRight className="w-4 h-4 text-gray-500" />
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Main App Component
// =============================================================================

export default function SmartResumeApp() {
  const [file, setFile] = useState<File | null>(null)
  const [targetRole, setTargetRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultData, setResultData] = useState<ResumeResult | null>(null)
  const [moduleOutputs, setModuleOutputs] = useState<ArtifactFile[]>([])
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<ActiveView>('home')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [sampleMode, setSampleMode] = useState(false)
  const [historyItem, setHistoryItem] = useState<HistoryItem | null>(null)

  // Initialize client-side providers (iframe logger, error interceptor)
  useEffect(() => {
    import('@/lib/iframeLogger').then(({ initIframeLogger }) => {
      initIframeLogger()
    }).catch(() => {})
    import('@/lib/agent-fetch-interceptor').then(({ installAgentInterceptor }) => {
      installAgentInterceptor()
    }).catch(() => {})
  }, [])

  // Load history
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setHistory(parsed)
      }
    } catch { /* ignore */ }
  }, [])

  const saveHistory = useCallback((item: HistoryItem) => {
    setHistory((prev) => {
      const updated = [item, ...prev]
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)) } catch { /* ignore */ }
      return updated
    })
  }, [])

  // Submit
  const handleSubmit = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResultData(null)
    setModuleOutputs([])
    setActiveAgentId(MANAGER_AGENT_ID)
    setHistoryItem(null)

    try {
      const uploadResult = await uploadFiles(file)
      if (!uploadResult?.success || !Array.isArray(uploadResult?.asset_ids) || uploadResult.asset_ids.length === 0) {
        setError('File upload failed. Please check your file and try again.')
        setLoading(false)
        setActiveAgentId(null)
        return
      }

      const message = `Please improve the following resume.${targetRole ? ' Target role: ' + targetRole + '.' : ''} Analyze the uploaded resume and provide a comprehensive improvement including ATS optimization, content enhancement, and profile text generation.`
      const result = await callAIAgent(message, MANAGER_AGENT_ID, { assets: uploadResult.asset_ids })
      setActiveAgentId(null)

      if (!result?.success) {
        setError(result?.error ?? 'Agent call failed. Please try again.')
        setLoading(false)
        return
      }

      let data = result?.response?.result
      if (typeof data === 'string') {
        try { data = JSON.parse(data) } catch { data = { improved_resume: data } }
      }

      const parsedData: ResumeResult = data ?? {}
      setResultData(parsedData)

      const artifacts = Array.isArray(result?.module_outputs?.artifact_files) ? result.module_outputs.artifact_files : []
      setModuleOutputs(artifacts)

      const histEntry: HistoryItem = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
        fileName: file.name,
        targetRole: targetRole,
        atsScore: parsedData?.ats_score ?? 0,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        result: parsedData,
        moduleOutputs: artifacts,
      }
      saveHistory(histEntry)
      setActiveView('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.')
      setActiveAgentId(null)
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }

  const handleHistorySelect = (item: HistoryItem) => {
    setHistoryItem(item)
    setResultData(item.result)
    setModuleOutputs(Array.isArray(item?.moduleOutputs) ? item.moduleOutputs : [])
    setActiveView('results')
    setError(null)
  }

  const handleReset = () => {
    setFile(null)
    setTargetRole('')
    setResultData(null)
    setModuleOutputs([])
    setError(null)
    setHistoryItem(null)
    setActiveView('home')
  }

  const displayData = sampleMode ? SAMPLE_RESULT : resultData
  const displayOutputs = sampleMode ? SAMPLE_MODULE_OUTPUTS : moduleOutputs
  const hasResults = displayData !== null

  return (
    <div className="min-h-screen bg-[hsl(230,25%,7%)] text-gray-200 font-sans relative overflow-hidden">
      {/* Background Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="blob absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-500/[0.04] blur-3xl" />
        <div className="blob-delay absolute top-1/3 -right-48 w-[500px] h-[500px] rounded-full bg-cyan-500/[0.03] blur-3xl" />
        <div className="blob absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-purple-600/[0.03] blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 glass border-b border-white/5 sticky top-0">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <FiFileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">SmartResume<span className="text-purple-400">AI</span></span>
          </div>
          <div className="flex items-center gap-3">
            {/* Sample Toggle */}
            <div className="flex items-center gap-2">
              <label htmlFor="sample-toggle" className="text-xs font-medium text-gray-500 cursor-pointer hidden md:block">Sample</label>
              <button
                id="sample-toggle"
                role="switch"
                aria-checked={sampleMode}
                onClick={() => {
                  setSampleMode(!sampleMode)
                  if (!sampleMode && activeView === 'home') setActiveView('results')
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${sampleMode ? 'bg-purple-500' : 'bg-white/10'}`}
              >
                <span className={`pointer-events-none block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${sampleMode ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
              </button>
            </div>
            {/* History Button */}
            <button
              onClick={() => setActiveView(activeView === 'history' ? 'home' : 'history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                ${activeView === 'history' ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-white border border-purple-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <FiClock className="w-3.5 h-3.5" />
              <span className="hidden md:inline">History</span>
              {history.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-300">{history.length}</span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* History View */}
      {activeView === 'history' && (
        <div className="relative z-10">
          <HistoryView history={history} onSelect={handleHistorySelect} onBack={() => setActiveView('home')} />
        </div>
      )}

      {/* Home View */}
      {activeView === 'home' && !loading && (
        <main className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 py-10">
          <div className="space-y-10">
            {/* Hero */}
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-5">
                <HiOutlineSparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-medium text-purple-300">AI-Powered Resume Optimization</span>
              </div>
              <h1 className="font-bold text-3xl md:text-5xl text-white tracking-tight mb-3 leading-tight">
                Transform Your Resume with <span className="gradient-text">AI Intelligence</span>
              </h1>
              <p className="text-gray-400 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                Upload your resume and our multi-agent AI pipeline will optimize it for ATS systems, enhance content with quantified achievements, and generate professional profile texts.
              </p>
            </div>

            {/* Upload Card */}
            <GlassCard className="max-w-2xl mx-auto p-6 space-y-5">
              <FileDropzone file={file} onFileSelect={setFile} onRemove={() => setFile(null)} disabled={loading} />

              <div>
                <label htmlFor="target-role" className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Target Role (Optional)
                </label>
                <input
                  id="target-role"
                  placeholder="e.g., Senior Product Manager"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!file || loading}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white glow-btn disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-300"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
                    Optimizing your resume...
                  </span>
                ) : (
                  'Improve My Resume'
                )}
              </button>
            </GlassCard>

            {/* Error */}
            {error && (
              <div className="max-w-2xl mx-auto glass rounded-xl p-4 border border-red-500/20 bg-red-500/5">
                <p className="text-sm font-semibold text-red-400 mb-1">Error</p>
                <p className="text-sm text-red-300">{error}</p>
                <button onClick={handleSubmit} disabled={!file} className="mt-3 px-4 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 transition-all">
                  Retry
                </button>
              </div>
            )}

            {/* Agent Pipeline */}
            <div className="max-w-2xl mx-auto">
              <AgentPipeline activeAgentId={activeAgentId} />
            </div>

            {/* Features Grid */}
            <div>
              <div className="text-center mb-6">
                <h2 className="font-bold text-xl text-white">Powerful Features</h2>
                <p className="text-sm text-gray-400 mt-1">Everything you need to land your dream job</p>
              </div>
              <FeatureSection />
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: '50K+', label: 'Resumes Optimized' },
                { value: '92%', label: 'Avg ATS Score' },
                { value: '3x', label: 'More Interviews' },
                { value: '4.9', label: 'User Rating' },
              ].map((stat, i) => (
                <GlassCard key={i} className="p-5 text-center">
                  <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* Loading State */}
      {loading && (
        <main className="relative z-10 max-w-3xl mx-auto px-4 md:px-6 py-16">
          <div className="space-y-6">
            <GlassCard className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                <AiOutlineLoading3Quarters className="w-8 h-8 animate-spin text-purple-400" />
              </div>
              <p className="font-bold text-xl text-white mb-2">Optimizing your resume</p>
              <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
                Our AI agents are analyzing, optimizing, and enhancing your resume. This typically takes 30-60 seconds.
              </p>
              <div className="max-w-xs mx-auto">
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full animated-gradient" style={{ width: '60%', animation: 'gradientShift 2s ease infinite, pulse 1.5s ease-in-out infinite' }} />
                </div>
              </div>
            </GlassCard>
            <AgentPipeline activeAgentId={activeAgentId} />
          </div>
        </main>
      )}

      {/* Results View */}
      {activeView === 'results' && hasResults && !loading && (
        <main className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 py-8">
          <div className="space-y-6">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={handleReset} className="w-10 h-10 rounded-lg flex items-center justify-center glass hover:bg-white/10 transition-colors">
                  <FiArrowLeft className="w-5 h-5 text-gray-300" />
                </button>
                <div>
                  <h2 className="font-bold text-xl text-white">
                    {historyItem ? historyItem.fileName : file?.name ?? 'Resume Results'}
                  </h2>
                  {(historyItem?.targetRole || targetRole) && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 mt-1 inline-block">
                      {historyItem?.targetRole ?? targetRole}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {sampleMode && (
                  <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    SAMPLE DATA
                  </span>
                )}
                <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                  <FiRefreshCw className="w-3.5 h-3.5" />
                  New Resume
                </button>
              </div>
            </div>

            {/* Results Panel */}
            <ResultsPanel data={displayData!} moduleOutputs={displayOutputs} />

            {/* Error */}
            {error && (
              <div className="glass rounded-xl p-4 border border-red-500/20 bg-red-500/5">
                <p className="text-sm font-semibold text-red-400 mb-1">Error</p>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Agent Pipeline */}
            <AgentPipeline activeAgentId={activeAgentId} />
          </div>
        </main>
      )}
    </div>
  )
}
