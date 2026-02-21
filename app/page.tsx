'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { callAIAgent, uploadFiles } from '@/lib/aiAgent'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { FiFileText, FiUpload, FiDownload, FiCopy, FiCheck, FiClock, FiSearch, FiArrowLeft, FiX } from 'react-icons/fi'
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

// =============================================================================
// Sample Data
// =============================================================================

const SAMPLE_RESULT: ResumeResult = {
  improved_resume: "# John Smith\n**Senior Product Manager**\njohn.smith@email.com | (555) 123-4567 | linkedin.com/in/johnsmith\n\n## Professional Summary\nResults-driven Senior Product Manager with 8+ years of experience leading cross-functional teams to deliver high-impact digital products. Proven track record of driving 40% revenue growth through data-informed product strategies and agile methodologies.\n\n## Professional Experience\n\n### Senior Product Manager | TechCorp Inc.\n*Jan 2020 - Present*\n- Spearheaded product roadmap strategy resulting in 35% increase in user engagement\n- Orchestrated cross-functional team of 12 engineers, 3 designers, and 2 data scientists\n- Drove A/B testing program that improved conversion rates by 22%\n- Managed $2.5M annual product budget with 98% utilization efficiency\n\n### Product Manager | StartupXYZ\n*Jun 2017 - Dec 2019*\n- Launched 3 new product features generating $1.2M in ARR within first year\n- Implemented user research framework reducing feature development waste by 30%\n- Collaborated with engineering to reduce sprint cycle time by 25%\n\n## Education\n**MBA, Product Management** | Stanford University | 2017\n**BS, Computer Science** | UC Berkeley | 2015\n\n## Skills\nProduct Strategy, Agile/Scrum, Data Analytics, A/B Testing, SQL, Jira, Figma, Stakeholder Management, OKRs, User Research",
  ats_score: 92,
  score_justification: "The resume scores 92/100 for ATS readiness. Strong keyword alignment with target role, clear section headers, quantified achievements, and proper formatting. Minor improvements possible in skills section keyword density.",
  changes_made: [
    {
      original: "Managed product features and led team members",
      improved: "Spearheaded product roadmap strategy resulting in 35% increase in user engagement",
      reason: "Added quantified impact metrics and replaced weak verb 'managed' with action verb 'spearheaded'"
    },
    {
      original: "Worked with engineers and designers on projects",
      improved: "Orchestrated cross-functional team of 12 engineers, 3 designers, and 2 data scientists",
      reason: "Quantified team size and used stronger action verb 'orchestrated' to demonstrate leadership scope"
    },
    {
      original: "Helped improve website conversion",
      improved: "Drove A/B testing program that improved conversion rates by 22%",
      reason: "Replaced vague 'helped improve' with specific methodology and measurable outcome"
    },
    {
      original: "Created new features for the product",
      improved: "Launched 3 new product features generating $1.2M in ARR within first year",
      reason: "Added revenue impact metrics and specific count of features delivered"
    }
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
// ErrorBoundary
// =============================================================================

class InlineErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium border-2 border-foreground"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// =============================================================================
// Markdown Renderer
// =============================================================================

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-bold">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return (
            <h4 key={i} className="font-bold text-sm mt-3 mb-1">
              {line.slice(4)}
            </h4>
          )
        if (line.startsWith('## '))
          return (
            <h3 key={i} className="font-bold text-base mt-3 mb-1">
              {line.slice(3)}
            </h3>
          )
        if (line.startsWith('# '))
          return (
            <h2 key={i} className="font-bold text-lg mt-4 mb-2">
              {line.slice(2)}
            </h2>
          )
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <li key={i} className="ml-4 list-disc text-sm leading-relaxed">
              {formatInline(line.slice(2))}
            </li>
          )
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-4 list-decimal text-sm leading-relaxed">
              {formatInline(line.replace(/^\d+\.\s/, ''))}
            </li>
          )
        if (!line.trim()) return <div key={i} className="h-2" />
        return (
          <p key={i} className="text-sm leading-relaxed">
            {formatInline(line)}
          </p>
        )
      })}
    </div>
  )
}

// =============================================================================
// Copy Button Component
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
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="border-2 border-foreground font-medium text-xs gap-1"
    >
      {copied ? <FiCheck className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
      {label ?? (copied ? 'Copied' : 'Copy')}
    </Button>
  )
}

// =============================================================================
// ATS Score Circle
// =============================================================================

function ATSScoreCircle({ score }: { score: number }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? 'hsl(120, 60%, 40%)' : score >= 60 ? 'hsl(50, 100%, 45%)' : 'hsl(0, 100%, 50%)'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: 108, height: 108 }}>
      <svg width="108" height="108" viewBox="0 0 108 108" className="transform -rotate-90">
        <circle cx="54" cy="54" r={radius} fill="none" stroke="hsl(0, 0%, 90%)" strokeWidth="6" />
        <circle
          cx="54"
          cy="54"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="butt"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-bold">{score}</span>
        <span className="text-xs text-muted-foreground font-medium">/100</span>
      </div>
    </div>
  )
}

// =============================================================================
// File Dropzone
// =============================================================================

function FileDropzone({
  file,
  onFileSelect,
  onRemove,
  disabled,
}: {
  file: File | null
  onFileSelect: (f: File) => void
  onRemove: () => void
  disabled: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      if (disabled) return
      const droppedFile = e.dataTransfer?.files?.[0]
      if (droppedFile) {
        const name = droppedFile.name.toLowerCase()
        if (name.endsWith('.pdf') || name.endsWith('.docx') || name.endsWith('.doc')) {
          onFileSelect(droppedFile)
        }
      }
    },
    [disabled, onFileSelect]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      onFileSelect(selected)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (file) {
    return (
      <div className="border-2 border-foreground bg-muted p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-foreground flex items-center justify-center bg-background">
            <FiFileText className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-sm">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
          </div>
        </div>
        {!disabled && (
          <button
            onClick={onRemove}
            className="w-8 h-8 border-2 border-foreground flex items-center justify-center hover:bg-background transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`border-2 border-dashed p-12 flex flex-col items-center justify-center gap-4 transition-colors cursor-pointer ${isDragging ? 'border-primary bg-red-50' : 'border-foreground bg-background hover:bg-muted'}`}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <div className="w-16 h-16 border-2 border-foreground flex items-center justify-center">
        <FiUpload className="w-8 h-8" />
      </div>
      <div className="text-center">
        <p className="font-bold text-base">Drop your resume here</p>
        <p className="text-sm text-muted-foreground mt-1">PDF or DOCX files accepted</p>
      </div>
      <Button
        variant="outline"
        className="border-2 border-foreground font-medium"
        onClick={(e) => {
          e.stopPropagation()
          inputRef.current?.click()
        }}
      >
        Browse Files
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}

// =============================================================================
// Results Panel
// =============================================================================

function ResultsPanel({
  data,
  moduleOutputs,
}: {
  data: ResumeResult
  moduleOutputs: ArtifactFile[]
}) {
  const changes = Array.isArray(data?.changes_made) ? data.changes_made : []
  const keywords = Array.isArray(data?.keywords_added) ? data.keywords_added : []
  const files = Array.isArray(moduleOutputs) ? moduleOutputs : []
  const atsScore = data?.ats_score ?? 0

  return (
    <Tabs defaultValue="resume" className="w-full">
      <TabsList className="w-full border-2 border-foreground bg-muted p-0 h-auto flex">
        <TabsTrigger value="resume" className="flex-1 font-bold text-sm py-3 rounded-none data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none">
          Improved Resume
        </TabsTrigger>
        <TabsTrigger value="changes" className="flex-1 font-bold text-sm py-3 rounded-none data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none border-l-2 border-foreground">
          What Changed
        </TabsTrigger>
        <TabsTrigger value="profile" className="flex-1 font-bold text-sm py-3 rounded-none data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none border-l-2 border-foreground">
          Profile Text
        </TabsTrigger>
      </TabsList>

      {/* Tab 1: Improved Resume */}
      <TabsContent value="resume" className="mt-0 border-2 border-t-0 border-foreground">
        <div className="p-6">
          {/* ATS Score + Downloads Row */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-6">
              <ATSScoreCircle score={atsScore} />
              <div>
                <p className="font-bold text-lg">ATS Score</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  {data?.score_justification ?? 'No justification available.'}
                </p>
              </div>
            </div>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((f, idx) => (
                  <a
                    key={f?.file_url ?? idx}
                    href={f?.file_url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center gap-2 px-4 py-2 border-2 border-foreground bg-foreground text-background font-bold text-sm hover:bg-primary hover:border-primary transition-colors"
                  >
                    <FiDownload className="w-4 h-4" />
                    {f?.format_type?.toUpperCase() ?? f?.name ?? 'Download'}
                  </a>
                ))}
              </div>
            )}
          </div>

          <Separator className="bg-foreground h-[2px] mb-6" />

          {/* Keywords */}
          {keywords.length > 0 && (
            <div className="mb-6">
              <p className="font-bold text-sm mb-2 uppercase tracking-wide">Keywords Added</p>
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw, i) => (
                  <Badge key={i} variant="outline" className="border-2 border-foreground font-medium text-xs py-1 px-2">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Improvement Summary */}
          {data?.improvement_summary && (
            <div className="mb-6 border-2 border-foreground p-4 bg-muted">
              <p className="font-bold text-sm mb-2 uppercase tracking-wide">Improvement Summary</p>
              {renderMarkdown(data.improvement_summary)}
            </div>
          )}

          {/* Resume Content */}
          <div className="border-2 border-foreground p-6 bg-background">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-sm uppercase tracking-wide">Full Resume</p>
              <CopyButton text={data?.improved_resume ?? ''} label="Copy Resume" />
            </div>
            <ScrollArea className="max-h-[500px]">
              {renderMarkdown(data?.improved_resume ?? '')}
            </ScrollArea>
          </div>
        </div>
      </TabsContent>

      {/* Tab 2: What Changed */}
      <TabsContent value="changes" className="mt-0 border-2 border-t-0 border-foreground">
        <div className="p-6">
          <p className="font-bold text-lg mb-1">Changes Made</p>
          <p className="text-sm text-muted-foreground mb-6">
            {changes.length} improvement{changes.length !== 1 ? 's' : ''} applied to your resume
          </p>

          {changes.length === 0 && (
            <p className="text-sm text-muted-foreground">No specific changes recorded.</p>
          )}

          <div className="space-y-4">
            {changes.map((change, i) => (
              <div key={i} className="border-2 border-foreground">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="p-4 bg-red-50 border-b-2 md:border-b-0 md:border-r-2 border-foreground">
                    <p className="font-bold text-xs uppercase tracking-wide text-red-700 mb-2">Original</p>
                    <p className="text-sm leading-relaxed">{change?.original ?? ''}</p>
                  </div>
                  <div className="p-4 bg-green-50">
                    <p className="font-bold text-xs uppercase tracking-wide text-green-700 mb-2">Improved</p>
                    <p className="text-sm leading-relaxed">{change?.improved ?? ''}</p>
                  </div>
                </div>
                <div className="border-t-2 border-foreground p-3 bg-muted">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-bold uppercase tracking-wide">Reason:</span>{' '}
                    {change?.reason ?? ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      {/* Tab 3: Profile Text */}
      <TabsContent value="profile" className="mt-0 border-2 border-t-0 border-foreground">
        <div className="p-6 space-y-6">
          {/* LinkedIn Headline */}
          <div className="border-2 border-foreground">
            <div className="flex items-center justify-between p-4 bg-muted border-b-2 border-foreground">
              <p className="font-bold text-sm uppercase tracking-wide">LinkedIn Headline</p>
              <CopyButton text={data?.linkedin_headline ?? ''} />
            </div>
            <div className="p-4">
              <p className="text-sm leading-relaxed font-medium">{data?.linkedin_headline ?? 'No headline generated.'}</p>
            </div>
          </div>

          {/* LinkedIn Summary */}
          <div className="border-2 border-foreground">
            <div className="flex items-center justify-between p-4 bg-muted border-b-2 border-foreground">
              <p className="font-bold text-sm uppercase tracking-wide">LinkedIn Summary</p>
              <CopyButton text={data?.linkedin_summary ?? ''} />
            </div>
            <div className="p-4">
              {renderMarkdown(data?.linkedin_summary ?? 'No summary generated.')}
            </div>
          </div>

          {/* Job Board Bio */}
          <div className="border-2 border-foreground">
            <div className="flex items-center justify-between p-4 bg-muted border-b-2 border-foreground">
              <p className="font-bold text-sm uppercase tracking-wide">Job Board Bio</p>
              <CopyButton text={data?.job_board_bio ?? ''} />
            </div>
            <div className="p-4">
              {renderMarkdown(data?.job_board_bio ?? 'No bio generated.')}
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

// =============================================================================
// History View
// =============================================================================

function HistoryView({
  history,
  onSelect,
  onBack,
}: {
  history: HistoryItem[]
  onSelect: (item: HistoryItem) => void
  onBack: () => void
}) {
  const [search, setSearch] = useState('')

  const filtered = history.filter((item) => {
    const q = search.toLowerCase()
    return (
      (item?.fileName ?? '').toLowerCase().includes(q) ||
      (item?.targetRole ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="w-10 h-10 border-2 border-foreground flex items-center justify-center hover:bg-muted transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-2xl">History</h2>
      </div>

      <div className="relative mb-6">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search by file name or target role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 border-2 border-foreground h-11 font-sans"
        />
      </div>

      {filtered.length === 0 && history.length === 0 && (
        <div className="border-2 border-dashed border-foreground p-12 text-center">
          <FiClock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="font-bold text-lg mb-1">No resumes improved yet</p>
          <p className="text-sm text-muted-foreground">Upload your first resume to get started.</p>
        </div>
      )}

      {filtered.length === 0 && history.length > 0 && (
        <div className="border-2 border-dashed border-foreground p-8 text-center">
          <p className="text-sm text-muted-foreground">No results match your search.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="border-2 border-foreground p-4 flex items-center justify-between hover:bg-muted transition-colors cursor-pointer"
            onClick={() => onSelect(item)}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 border-2 border-foreground flex items-center justify-center bg-background">
                <FiFileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">{item?.fileName ?? 'Unknown file'}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {item?.targetRole && (
                    <Badge variant="outline" className="border border-foreground text-xs font-medium">
                      {item.targetRole}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{item?.date ?? ''}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="font-mono font-bold text-lg">{item?.atsScore ?? 0}</p>
                <p className="text-xs text-muted-foreground">ATS</p>
              </div>
              <Button variant="outline" size="sm" className="border-2 border-foreground font-bold text-xs">
                Open
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Agent Status Panel
// =============================================================================

function AgentStatusPanel({ activeAgentId }: { activeAgentId: string | null }) {
  const agents = [
    { id: MANAGER_AGENT_ID, name: 'Resume Coordinator', role: 'Orchestrates pipeline' },
    { id: ATS_OPTIMIZER_ID, name: 'ATS Optimizer', role: 'Keywords & formatting' },
    { id: CONTENT_ENHANCEMENT_ID, name: 'Content Enhancer', role: 'Impact & action verbs' },
    { id: PROFILE_GENERATOR_ID, name: 'Profile Generator', role: 'LinkedIn & job boards' },
  ]

  return (
    <div className="border-2 border-foreground bg-background">
      <div className="p-3 bg-muted border-b-2 border-foreground">
        <p className="font-bold text-xs uppercase tracking-wide">Agent Pipeline</p>
      </div>
      <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        {agents.map((agent) => {
          const isActive = activeAgentId === agent.id
          return (
            <div key={agent.id} className={`p-2 border-2 ${isActive ? 'border-primary bg-red-50' : 'border-foreground'}`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className={`w-2 h-2 flex-shrink-0 ${isActive ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
                <p className="font-bold text-xs truncate">{agent.name}</p>
              </div>
              <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =============================================================================
// Main Page
// =============================================================================

export default function Page() {
  const [file, setFile] = useState<File | null>(null)
  const [targetRole, setTargetRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultData, setResultData] = useState<ResumeResult | null>(null)
  const [moduleOutputs, setModuleOutputs] = useState<ArtifactFile[]>([])
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [sampleMode, setSampleMode] = useState(false)
  const [historyItem, setHistoryItem] = useState<HistoryItem | null>(null)

  // Load history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setHistory(parsed)
        }
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  // Save history helper
  const saveHistory = useCallback(
    (item: HistoryItem) => {
      setHistory((prev) => {
        const updated = [item, ...prev]
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
        } catch {
          // ignore storage errors
        }
        return updated
      })
    },
    []
  )

  // Handle submit
  const handleSubmit = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResultData(null)
    setModuleOutputs([])
    setActiveAgentId(MANAGER_AGENT_ID)
    setHistoryItem(null)

    try {
      // 1. Upload file
      const uploadResult = await uploadFiles(file)
      if (!uploadResult?.success || !Array.isArray(uploadResult?.asset_ids) || uploadResult.asset_ids.length === 0) {
        setError('File upload failed. Please check your file and try again.')
        setLoading(false)
        setActiveAgentId(null)
        return
      }

      // 2. Build message and call agent
      const message = `Please improve the following resume.${targetRole ? ' Target role: ' + targetRole + '.' : ''} Analyze the uploaded resume and provide a comprehensive improvement including ATS optimization, content enhancement, and profile text generation.`
      const result = await callAIAgent(message, MANAGER_AGENT_ID, {
        assets: uploadResult.asset_ids,
      })

      setActiveAgentId(null)

      if (!result?.success) {
        setError(result?.error ?? 'Agent call failed. Please try again.')
        setLoading(false)
        return
      }

      // 3. Parse response - handle both string and object
      let data = result?.response?.result
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data)
        } catch {
          data = { improved_resume: data }
        }
      }

      const parsedData: ResumeResult = data ?? {}
      setResultData(parsedData)

      // 4. Extract module outputs at TOP LEVEL
      const artifacts = Array.isArray(result?.module_outputs?.artifact_files)
        ? result.module_outputs.artifact_files
        : []
      setModuleOutputs(artifacts)

      // 5. Save to history
      const histEntry: HistoryItem = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
        fileName: file.name,
        targetRole: targetRole,
        atsScore: parsedData?.ats_score ?? 0,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        result: parsedData,
        moduleOutputs: artifacts,
      }
      saveHistory(histEntry)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.')
      setActiveAgentId(null)
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }

  // Handle history item selection
  const handleHistorySelect = (item: HistoryItem) => {
    setHistoryItem(item)
    setResultData(item.result)
    setModuleOutputs(Array.isArray(item?.moduleOutputs) ? item.moduleOutputs : [])
    setShowHistory(false)
    setError(null)
  }

  // Reset to upload view
  const handleReset = () => {
    setFile(null)
    setTargetRole('')
    setResultData(null)
    setModuleOutputs([])
    setError(null)
    setHistoryItem(null)
  }

  // Current display data (sample or real)
  const displayData = sampleMode ? SAMPLE_RESULT : resultData
  const displayOutputs = sampleMode ? SAMPLE_MODULE_OUTPUTS : moduleOutputs
  const hasResults = displayData !== null

  return (
    <InlineErrorBoundary>
      <div className="min-h-screen bg-background text-foreground font-sans">
        {/* Navigation Bar */}
        <nav className="border-b-2 border-foreground bg-background sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => {
                setShowHistory(false)
                handleReset()
              }}
            >
              <div className="w-8 h-8 bg-primary flex items-center justify-center">
                <FiFileText className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg tracking-tight">SmartResume AI</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="sample-toggle" className="text-xs font-bold uppercase tracking-wide text-muted-foreground cursor-pointer">
                  Sample Data
                </Label>
                <Switch id="sample-toggle" checked={sampleMode} onCheckedChange={setSampleMode} />
              </div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border-2 font-bold text-sm transition-colors ${showHistory ? 'border-foreground bg-foreground text-background' : 'border-foreground hover:bg-muted'}`}
              >
                <FiClock className="w-3.5 h-3.5" />
                History
              </button>
            </div>
          </div>
        </nav>

        {/* History View */}
        {showHistory && (
          <HistoryView
            history={history}
            onSelect={handleHistorySelect}
            onBack={() => setShowHistory(false)}
          />
        )}

        {/* Main Content */}
        {!showHistory && (
          <main className="max-w-4xl mx-auto px-6 py-8">
            {/* Upload Section - show if no results and not loading */}
            {!hasResults && !loading && (
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="font-bold text-4xl tracking-tight mb-2">Optimize Your Resume</h1>
                  <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed">
                    Upload your resume and our AI pipeline will optimize it for ATS systems, enhance content with impact metrics, and generate professional profile texts.
                  </p>
                </div>

                {/* Dropzone Card */}
                <Card className="border-2 border-foreground shadow-none">
                  <CardContent className="p-6 space-y-4">
                    <FileDropzone
                      file={file}
                      onFileSelect={setFile}
                      onRemove={() => setFile(null)}
                      disabled={loading}
                    />

                    {/* Target Role Input */}
                    <div>
                      <Label htmlFor="target-role" className="font-bold text-sm uppercase tracking-wide mb-2 block">
                        Target Role (Optional)
                      </Label>
                      <Input
                        id="target-role"
                        placeholder="e.g., Senior Product Manager"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className="border-2 border-foreground h-11 font-sans"
                        disabled={loading}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      onClick={handleSubmit}
                      disabled={!file || loading}
                      className="w-full h-12 bg-primary text-primary-foreground font-bold text-base border-2 border-foreground hover:bg-red-700 disabled:opacity-40"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin" />
                          Optimizing your resume...
                        </span>
                      ) : (
                        'Improve My Resume'
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Error */}
                {error && (
                  <div className="border-2 border-primary bg-red-50 p-4">
                    <p className="font-bold text-sm text-red-700 mb-1">Error</p>
                    <p className="text-sm text-red-600">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSubmit}
                      disabled={!file}
                      className="mt-3 border-2 border-foreground font-bold text-xs"
                    >
                      Retry
                    </Button>
                  </div>
                )}

                {/* Agent Status */}
                <AgentStatusPanel activeAgentId={activeAgentId} />
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="space-y-6">
                <div className="border-2 border-foreground p-12 text-center">
                  <AiOutlineLoading3Quarters className="w-12 h-12 animate-spin mx-auto mb-4" />
                  <p className="font-bold text-xl mb-1">Optimizing your resume</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Our AI agents are analyzing, optimizing, and enhancing your resume. This may take a moment.
                  </p>
                  <div className="max-w-xs mx-auto">
                    <div className="w-full h-1 bg-muted border border-foreground overflow-hidden">
                      <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }} />
                    </div>
                  </div>
                </div>
                <AgentStatusPanel activeAgentId={activeAgentId} />
              </div>
            )}

            {/* Results */}
            {hasResults && !loading && (
              <div className="space-y-6">
                {/* Back / Title Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleReset}
                      className="w-10 h-10 border-2 border-foreground flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <FiArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="font-bold text-2xl">
                        {historyItem ? historyItem.fileName : file?.name ?? 'Resume Results'}
                      </h2>
                      {(historyItem?.targetRole || targetRole) && (
                        <Badge variant="outline" className="border border-foreground text-xs font-medium mt-1">
                          {historyItem?.targetRole ?? targetRole}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {sampleMode && (
                    <Badge className="bg-accent text-accent-foreground font-bold text-xs border-2 border-foreground">
                      SAMPLE DATA
                    </Badge>
                  )}
                </div>

                {/* Results Panel */}
                <ResultsPanel data={displayData!} moduleOutputs={displayOutputs} />

                {/* Error */}
                {error && (
                  <div className="border-2 border-primary bg-red-50 p-4">
                    <p className="font-bold text-sm text-red-700 mb-1">Error</p>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Agent Status */}
                <AgentStatusPanel activeAgentId={activeAgentId} />
              </div>
            )}
          </main>
        )}
      </div>
    </InlineErrorBoundary>
  )
}
