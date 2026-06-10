import { useState, useCallback } from 'react'
import {
  calculate,
  getTierProgress,
  formatCurrency,
  CommissionInputs,
  CommissionResult,
  KPIDetail,
  TIER_LABELS,
  NDR_THRESHOLDS,
  LORG_THRESHOLDS,
  BONUS_AMOUNTS,
  PER_SIF_RATE,
} from '../lib/commission'

// ─── Default form state ───────────────────────────────────────────────────────

const DEFAULT_INPUTS: CommissionInputs = {
  totalSIFs: 0,
  acceptedSIFs: 0,
  paidSIFs: 0,
  sameMonthGrads: 0,
  totalGrads: 0,
  ccPct: 0,
  spiff: 0,
}

// ─── Tier color helpers ───────────────────────────────────────────────────────

function tierColor(tier: number, isDark: boolean): string {
  const dark  = ['text-slate-400', 'text-emerald-400', 'text-teal-300', 'text-cyan-300', 'text-amber-300']
  const light = ['text-slate-500', 'text-emerald-600', 'text-teal-600', 'text-cyan-700', 'text-amber-600']
  return isDark ? (dark[tier] ?? dark[0]) : (light[tier] ?? light[0])
}

function tierBadgeBg(tier: number, isDark: boolean): string {
  const dark  = ['bg-slate-700/60', 'bg-emerald-900/40', 'bg-teal-900/40', 'bg-cyan-900/40', 'bg-amber-900/40']
  const light = ['bg-slate-100', 'bg-emerald-50', 'bg-teal-50', 'bg-cyan-50', 'bg-amber-50']
  return isDark ? (dark[tier] ?? dark[0]) : (light[tier] ?? light[0])
}

function tierBorder(tier: number, isDark: boolean): string {
  const dark  = ['border-slate-600/40', 'border-emerald-600/40', 'border-teal-500/40', 'border-cyan-500/40', 'border-amber-500/40']
  const light = ['border-slate-200', 'border-emerald-200', 'border-teal-200', 'border-cyan-200', 'border-amber-200']
  return isDark ? (dark[tier] ?? dark[0]) : (light[tier] ?? light[0])
}

function progressBarColor(tier: number): string {
  return ['bg-slate-500', 'bg-emerald-500', 'bg-teal-400', 'bg-cyan-400', 'bg-amber-400'][tier] ?? 'bg-slate-500'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface InputFieldProps {
  label: string
  sublabel?: string
  value: string
  onChange: (v: string) => void
  min?: number
  max?: number
  step?: number
  prefix?: string
  suffix?: string
  isDark: boolean
}

function InputField({ label, sublabel, value, onChange, min = 0, step = 1, prefix, suffix, isDark }: InputFieldProps) {
  const [focused, setFocused] = useState(false)

  const base = isDark
    ? 'bg-slate-800/80 border-slate-600/50 text-white placeholder-slate-500 focus:border-emerald-500/70 focus:ring-emerald-500/20'
    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20'

  return (
    <div className="space-y-1.5">
      <label className={`block text-xs font-semibold tracking-widest uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {label}
      </label>
      {sublabel && (
        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{sublabel}</p>
      )}
      <div className={`relative flex items-center rounded-lg border transition-all duration-200 ${base} ${focused ? 'ring-2 shadow-sm' : ''}`}>
        {prefix && (
          <span className={`pl-3 text-sm font-medium select-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{prefix}</span>
        )}
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full bg-transparent py-2.5 text-sm font-mono outline-none ${prefix ? 'pl-1.5 pr-3' : 'px-3'} ${suffix ? 'pr-1.5' : ''}`}
          placeholder="0"
        />
        {suffix && (
          <span className={`pr-3 text-sm font-medium select-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{suffix}</span>
        )}
      </div>
    </div>
  )
}

interface KPICardProps {
  detail: KPIDetail
  isDark: boolean
}

function KPICard({ detail, isDark }: KPICardProps) {
  const { label, value, tier, bonus, thresholds, remaining, unit } = detail
  const progress = getTierProgress(value, thresholds)
  const nextTierLabel = tier < 4 ? TIER_LABELS[tier + 1] : null
  const barColor = progressBarColor(tier)
  const cardBg = isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'

  return (
    <div className={`rounded-xl border p-4 space-y-3 transition-all duration-200 ${cardBg}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`text-xs font-semibold tracking-widest uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {label}
          </p>
          <p className={`text-2xl font-mono font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {unit === '%' ? `${value.toFixed(2)}%` : value.toLocaleString()}
          </p>
        </div>
        <div className={`flex-shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold border ${tierBadgeBg(tier, isDark)} ${tierColor(tier, isDark)} ${tierBorder(tier, isDark)}`}>
          {TIER_LABELS[tier]}
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className={`flex justify-between mt-1.5 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>
            {bonus > 0
              ? <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>+{formatCurrency(bonus)}</span>
              : <span>No bonus</span>
            }
          </span>
          {remaining !== null && nextTierLabel ? (
            <span>{remaining.toFixed(unit === '%' ? 2 : 0)} {unit} to {nextTierLabel}</span>
          ) : (
            <span className={`font-semibold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Max tier</span>
          )}
        </div>
      </div>

      {/* Tier threshold pills */}
      <div className="flex gap-1 flex-wrap">
        {thresholds.map((thresh, i) => {
          const active = tier >= i + 1
          return (
            <span
              key={i}
              className={`text-xs px-1.5 py-0.5 rounded font-mono transition-all ${
                active
                  ? isDark ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : isDark ? 'bg-slate-700/40 text-slate-500 border border-slate-600/30' : 'bg-slate-50 text-slate-400 border border-slate-200'
              }`}
            >
              T{i + 1}: {unit === '%' ? `${thresh}%` : thresh}
            </span>
          )
        })}
      </div>
    </div>
  )
}

interface ResultCardProps {
  label: string
  value: string
  accent?: boolean
  subtext?: string
  isDark: boolean
}

function ResultCard({ label, value, accent, subtext, isDark }: ResultCardProps) {
  const bg = accent
    ? isDark ? 'bg-emerald-900/30 border-emerald-700/40' : 'bg-emerald-50 border-emerald-200'
    : isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200'

  const valColor = accent
    ? isDark ? 'text-emerald-300' : 'text-emerald-700'
    : isDark ? 'text-white' : 'text-slate-900'

  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <p className={`text-xs font-semibold tracking-widest uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {label}
      </p>
      <p className={`text-2xl font-mono font-bold ${valColor}`}>{value}</p>
      {subtext && (
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{subtext}</p>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CommissionCalculator() {
  const [isDark, setIsDark] = useState(true)
  const [rawInputs, setRawInputs] = useState<Record<keyof CommissionInputs, string>>({
    totalSIFs:      '0',
    acceptedSIFs:   '0',
    paidSIFs:       '0',
    sameMonthGrads: '0',
    totalGrads:     '0',
    ccPct:          '0',
    spiff:          '0',
  })
  const [showBreakdown, setShowBreakdown] = useState(true)
  const [showLORG, setShowLORG] = useState(false)

  const inputs: CommissionInputs = {
    totalSIFs:      Math.max(0, parseFloat(rawInputs.totalSIFs)      || 0),
    acceptedSIFs:   Math.max(0, parseFloat(rawInputs.acceptedSIFs)   || 0),
    paidSIFs:       Math.max(0, parseFloat(rawInputs.paidSIFs)       || 0),
    sameMonthGrads: Math.max(0, parseFloat(rawInputs.sameMonthGrads) || 0),
    totalGrads:     Math.max(0, parseFloat(rawInputs.totalGrads)     || 0),
    ccPct:          Math.max(0, parseFloat(rawInputs.ccPct)           || 0),
    spiff:          Math.max(0, parseFloat(rawInputs.spiff)           || 0),
  }

  const result: CommissionResult = calculate(inputs)

  const setField = useCallback((key: keyof CommissionInputs) => (v: string) => {
    setRawInputs(prev => ({ ...prev, [key]: v }))
  }, [])

  const handleReset = () => {
    setRawInputs({
      totalSIFs: '0', acceptedSIFs: '0', paidSIFs: '0',
      sameMonthGrads: '0', totalGrads: '0', ccPct: '0', spiff: '0',
    })
  }

  const bg     = isDark ? 'bg-slate-900'      : 'bg-slate-50'
  const card   = isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-slate-200'
  const text   = isDark ? 'text-white'         : 'text-slate-900'
  const muted  = isDark ? 'text-slate-400'     : 'text-slate-500'
  const divider = isDark ? 'border-slate-700/50' : 'border-slate-200'

  const overallTierColor = tierColor(result.overallTier, isDark)
  const overallTierBg    = tierBadgeBg(result.overallTier, isDark)
  const overallTierBdr   = tierBorder(result.overallTier, isDark)

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bg} font-sans`}>
      {/* Header */}
      <header className={`sticky top-0 z-20 border-b backdrop-blur-md ${isDark ? 'bg-slate-900/90 border-slate-700/50' : 'bg-white/90 border-slate-200'}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
              <svg className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className={`text-sm font-bold tracking-tight ${text}`}>Commission Calculator</h1>
              <p className={`text-xs ${muted}`}>Reach — NDR Track</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${isDark ? 'border-slate-600 text-slate-400 hover:text-white hover:border-slate-500' : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300'}`}
            >
              Reset
            </button>
            <button
              onClick={() => setIsDark(d => !d)}
              className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${isDark ? 'border-slate-600 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-900'}`}
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Summary banner */}
        <div className={`rounded-2xl border p-5 ${isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700/50' : 'bg-gradient-to-br from-white to-slate-50 border-slate-200'}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1.5 rounded-lg border text-sm font-bold ${overallTierBg} ${overallTierColor} ${overallTierBdr}`}>
                {TIER_LABELS[result.overallTier]}
              </div>
              <div>
                <p className={`text-xs ${muted}`}>KPI Score</p>
                <p className={`text-lg font-bold font-mono ${text}`}>{result.kpiScore}<span className={`text-sm font-normal ${muted}`}>/4</span></p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 sm:gap-8">
              <div className="text-right">
                <p className={`text-xs ${muted}`}>Bonus Earned</p>
                <p className={`text-xl font-bold font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {formatCurrency(result.monthlyBonus)}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-xs ${muted}`}>Total Commission</p>
                <p className={`text-xl font-bold font-mono ${text}`}>
                  {formatCurrency(result.totalCommission)}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-xs ${muted}`}>Total Payout</p>
                <p className={`text-2xl font-bold font-mono ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                  {formatCurrency(result.totalPayout)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Inputs ── */}
          <div className={`rounded-2xl border p-5 space-y-5 ${card}`}>
            <h2 className={`text-xs font-bold tracking-widest uppercase ${muted}`}>Inputs</h2>

            <div className="space-y-4">
              <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>SIF Metrics</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputField label="Total SIFs" sublabel="C14 in spreadsheet" value={rawInputs.totalSIFs} onChange={setField('totalSIFs')} isDark={isDark} />
                <InputField label="Accepted SIFs" sublabel="LORG accepted tracking" value={rawInputs.acceptedSIFs} onChange={setField('acceptedSIFs')} isDark={isDark} />
                <InputField label="Paid SIFs" sublabel="LORG paid tracking" value={rawInputs.paidSIFs} onChange={setField('paidSIFs')} isDark={isDark} />
              </div>
            </div>

            <div className={`border-t pt-4 ${divider} space-y-4`}>
              <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Graduation Metrics</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputField label="Same Month Grads" sublabel="C15 in spreadsheet" value={rawInputs.sameMonthGrads} onChange={setField('sameMonthGrads')} isDark={isDark} />
                <InputField label="Total Graduations" sublabel="C16 in spreadsheet" value={rawInputs.totalGrads} onChange={setField('totalGrads')} isDark={isDark} />
              </div>
            </div>

            <div className={`border-t pt-4 ${divider} space-y-4`}>
              <p className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Other</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputField label="Credit Card %" sublabel="C17 — enter as number (e.g. 46.17)" value={rawInputs.ccPct} onChange={setField('ccPct')} step={0.01} suffix="%" isDark={isDark} />
                <InputField label="SPIFF Amount" sublabel="C21 — one-time bonus" value={rawInputs.spiff} onChange={setField('spiff')} prefix="$" isDark={isDark} />
              </div>
            </div>
          </div>

          {/* ── Results ── */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultCard label="Bonus Earned" value={formatCurrency(result.monthlyBonus)} subtext="Sum of all KPI bonuses (B18)" isDark={isDark} accent />
              <ResultCard label="Graduation Bonus" value={formatCurrency(result.graduationBonus)} subtext="Total graduations bonus (D16)" isDark={isDark} />
              <ResultCard label="Base Commission" value={formatCurrency(result.baseSIFCommission)} subtext={`${inputs.totalSIFs} SIFs × $${PER_SIF_RATE}/SIF`} isDark={isDark} />
              <ResultCard label="KPI Score" value={`${result.kpiScore} / 4`} subtext="KPIs at Tier 1 or above" isDark={isDark} />
              <ResultCard label="Total Commission" value={formatCurrency(result.totalCommission)} subtext="Base + bonuses (B20)" isDark={isDark} />
              <ResultCard label="Total Payout" value={formatCurrency(result.totalPayout)} subtext={inputs.spiff > 0 ? `Includes ${formatCurrency(inputs.spiff)} SPIFF` : 'Commission + SPIFF (C22)'} isDark={isDark} accent />
            </div>

            {/* LORG goal tracking */}
            <div className={`rounded-xl border p-4 space-y-3 ${card}`}>
              <button
                onClick={() => setShowLORG(v => !v)}
                className="w-full flex items-center justify-between"
              >
                <span className={`text-xs font-bold tracking-widest uppercase ${muted}`}>LORG Goal Tracking</span>
                <svg className={`w-4 h-4 transition-transform ${showLORG ? 'rotate-180' : ''} ${muted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showLORG && (
                <div className="space-y-3 pt-1">
                  {/* Paid SIFs progress */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className={`text-xs ${muted}`}>Paid SIFs</span>
                      <span className={`text-xs font-mono font-semibold ${text}`}>{inputs.paidSIFs} / {result.lorgPaidGoal}</span>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                      <div
                        className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (inputs.paidSIFs / result.lorgPaidGoal) * 100)}%` }}
                      />
                    </div>
                    <p className={`text-xs mt-1 ${muted}`}>
                      {result.lorgPaidRemaining > 0
                        ? `${result.lorgPaidRemaining} more needed`
                        : <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>Goal reached!</span>
                      }
                    </p>
                  </div>
                  {/* Accepted SIFs progress */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className={`text-xs ${muted}`}>Accepted SIFs</span>
                      <span className={`text-xs font-mono font-semibold ${text}`}>{inputs.acceptedSIFs} / {result.lorgAcceptedGoal.toFixed(0)}</span>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (inputs.acceptedSIFs / result.lorgAcceptedGoal) * 100)}%` }}
                      />
                    </div>
                    <p className={`text-xs mt-1 ${muted}`}>
                      {result.lorgAcceptedRemaining > 0
                        ? `${result.lorgAcceptedRemaining.toFixed(0)} more needed`
                        : <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>Goal reached!</span>
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── KPI Breakdown ── */}
        <div className={`rounded-2xl border overflow-hidden ${card}`}>
          <button
            onClick={() => setShowBreakdown(v => !v)}
            className={`w-full flex items-center justify-between px-5 py-4 hover:opacity-80 transition-opacity`}
          >
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold tracking-widest uppercase ${muted}`}>KPI Breakdown</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                {result.kpiScore}/4 active
              </span>
            </div>
            <svg className={`w-4 h-4 transition-transform ${showBreakdown ? 'rotate-180' : ''} ${muted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showBreakdown && (
            <div className={`border-t px-5 pb-5 pt-4 ${divider}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.kpiDetails.map(detail => (
                  <KPICard key={detail.label} detail={detail} isDark={isDark} />
                ))}
              </div>

              {/* Formula breakdown table */}
              <div className={`mt-4 rounded-xl border overflow-hidden ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                <div className={`px-4 py-2 ${isDark ? 'bg-slate-800/60' : 'bg-slate-50'}`}>
                  <span className={`text-xs font-bold tracking-widest uppercase ${muted}`}>Formula Breakdown</span>
                </div>
                <div className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
                  {[
                    { label: 'SIF Bonus (D14)', formula: `LOOKUP(${inputs.totalSIFs}, [87,100,113,126], [300,400,500,600])`, value: result.sifBonus },
                    { label: 'Same Month Grad Bonus (D15)', formula: `LOOKUP(${inputs.sameMonthGrads}, [8,11,15,18], [300,400,500,600])`, value: result.sameMonthGradBonus },
                    { label: 'Total Grad Bonus (D16)', formula: `LOOKUP(${inputs.totalGrads}, [31,39,49,58], [300,400,500,600])`, value: result.gradTotalBonus },
                    { label: 'CC% Bonus (D17)', formula: `LOOKUP(${inputs.ccPct}, [46.17,52.85,58.93,65.61], [300,400,500,600])`, value: result.ccPctBonus },
                    { label: 'Monthly Bonus (B18)', formula: `SUM(IFERROR(D14:D17, 0))`, value: result.monthlyBonus },
                    { label: 'Base SIF Commission (F17)', formula: `${inputs.totalSIFs} SIFs × $${PER_SIF_RATE}/SIF (F15×F16)`, value: result.baseSIFCommission },
                    { label: 'Total Commission (B20)', formula: `F17 + B18`, value: result.totalCommission },
                    { label: 'Total Payout (C22)', formula: `B20 + ${formatCurrency(inputs.spiff)} SPIFF`, value: result.totalPayout },
                  ].map(row => (
                    <div key={row.label} className={`flex items-center justify-between px-4 py-2.5 gap-4 ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold ${text}`}>{row.label}</p>
                        <p className={`text-xs font-mono mt-0.5 truncate ${muted}`}>{row.formula}</p>
                      </div>
                      <span className={`text-sm font-mono font-bold flex-shrink-0 ${row.value > 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : muted}`}>
                        {formatCurrency(row.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tier Reference Table */}
              <div className={`mt-4 rounded-xl border overflow-hidden ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                <div className={`px-4 py-2 ${isDark ? 'bg-slate-800/60' : 'bg-slate-50'}`}>
                  <span className={`text-xs font-bold tracking-widest uppercase ${muted}`}>NDR Tier Reference</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={isDark ? 'bg-slate-800/40' : 'bg-slate-50'}>
                        <th className={`px-4 py-2 text-left font-semibold ${muted}`}>KPI</th>
                        <th className={`px-3 py-2 text-center font-semibold ${muted}`}>Tier 0</th>
                        <th className={`px-3 py-2 text-center font-semibold text-emerald-500`}>T1 $300</th>
                        <th className={`px-3 py-2 text-center font-semibold text-teal-400`}>T2 $400</th>
                        <th className={`px-3 py-2 text-center font-semibold text-cyan-400`}>T3 $500</th>
                        <th className={`px-3 py-2 text-center font-semibold text-amber-400`}>T4 $600</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-700/40' : 'divide-slate-100'}`}>
                      {[
                        { label: 'Total SIFs', t0: '<87', thresholds: NDR_THRESHOLDS.sifs, unit: '' },
                        { label: 'Same Month Grads', t0: '<8', thresholds: NDR_THRESHOLDS.sameMonthGrad, unit: '' },
                        { label: 'Total Grads', t0: '<31', thresholds: NDR_THRESHOLDS.gradTotal, unit: '' },
                        { label: 'CC%', t0: '<46.17%', thresholds: NDR_THRESHOLDS.ccPct, unit: '%' },
                      ].map(row => (
                        <tr key={row.label} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                          <td className={`px-4 py-2 font-medium ${text}`}>{row.label}</td>
                          <td className={`px-3 py-2 text-center font-mono ${muted}`}>{row.t0}</td>
                          {row.thresholds.map((t, i) => (
                            <td key={i} className={`px-3 py-2 text-center font-mono ${['text-emerald-500','text-teal-400','text-cyan-400','text-amber-400'][i]}`}>
                              ≥{row.unit === '%' ? `${t}%` : t}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Assumptions notice */}
        <div className={`rounded-xl border p-4 ${isDark ? 'bg-slate-800/30 border-slate-700/40' : 'bg-slate-50 border-slate-200'}`}>
          <p className={`text-xs font-bold tracking-widest uppercase mb-2 ${muted}`}>Assumptions & Notes</p>
          <ul className={`text-xs space-y-1 ${muted}`}>
            <li>• <strong className={text}>Base commission</strong>: Calculated as Total SIFs × $7/SIF (cell F16 = 7 in spreadsheet, treating it as a per-SIF rate).</li>
            <li>• <strong className={text}>CC%</strong>: Enter as a whole percentage number (e.g. enter <code>46.17</code> for 46.17%). The spreadsheet stores C17 = 37 for 37%.</li>
            <li>• <strong className={text}>Accepted/Paid SIFs</strong>: Used only for LORG goal tracking (H14:I16). They do not affect the NDR commission calculation directly.</li>
            <li>• <strong className={text}>LOOKUP behavior</strong>: If a KPI is below Tier 1 threshold, its bonus is $0 (IFERROR replaces #N/A with 0, per B18 formula).</li>
            <li>• <strong className={text}>Overall Tier</strong>: Shown as the minimum tier achieved across all 4 KPIs. Individual KPI tiers are shown in the breakdown.</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
