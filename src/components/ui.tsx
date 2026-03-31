import React from 'react'
import { Box, Text } from 'ink'

// ===== Step Progress =====

const STEP_LABELS = ['Remote', 'Branch', 'Commits', 'Confirm', 'Sync']

interface StepProgressProps {
  current: number // 1-based
}

export function StepProgress({ current }: StepProgressProps) {
  return (
    <Box>
      {STEP_LABELS.map((label, i) => {
        const step = i + 1
        const isActive = step === current
        const isDone = step < current
        const isLast = i === STEP_LABELS.length - 1

        return (
          <React.Fragment key={label}>
            <Text color={isActive ? 'cyan' : isDone ? 'green' : 'gray'} dimColor={!isActive && !isDone}>
              {isDone ? '●' : isActive ? '◆' : '○'}{' '}
              {isActive ? <Text bold>{label}</Text> : label}
            </Text>
            {!isLast && (
              <Text color={isDone ? 'green' : 'gray'} dimColor={!isDone}> {'───'} </Text>
            )}
          </React.Fragment>
        )
      })}
    </Box>
  )
}

// ===== Section Header =====

interface SectionHeaderProps {
  title: string
  subtitle?: string
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        {'▾ '}{title}
      </Text>
      {subtitle && (
        <Text color="gray" dimColor>{'  '}{subtitle}</Text>
      )}
    </Box>
  )
}

// ===== Divider =====

export function Divider({ width = 48 }: { width?: number }) {
  return <Text color="gray" dimColor>{'─'.repeat(width)}</Text>
}

// ===== Key Hints =====

interface KeyHint {
  key: string
  label: string
}

export function KeyHints({ hints }: { hints: KeyHint[] }) {
  return (
    <Box gap={1} flexWrap="wrap">
      {hints.map(({ key, label }) => (
        <Box key={key}>
          <Text backgroundColor="gray" color="white" bold>{` ${key} `}</Text>
          <Text color="gray"> {label}</Text>
        </Box>
      ))}
    </Box>
  )
}

// ===== Inline Key Hints =====

export function InlineKeys({ hints }: { hints: KeyHint[] }) {
  return (
    <Box gap={1}>
      {hints.map(({ key, label }, i) => (
        <React.Fragment key={key}>
          <Text color="green" bold>[{key}]</Text>
          <Text> {label}</Text>
          {i < hints.length - 1 && <Text color="gray" dimColor> / </Text>}
        </React.Fragment>
      ))}
    </Box>
  )
}

// ===== Status Panel =====

type PanelType = 'info' | 'warn' | 'error' | 'success'

const PANEL_CONFIG: Record<PanelType, { icon: string; color: string; borderColor: string }> = {
  info: { icon: '◆', color: 'cyan', borderColor: 'cyan' },
  warn: { icon: '▲', color: 'yellow', borderColor: 'yellow' },
  error: { icon: '✖', color: 'red', borderColor: 'red' },
  success: { icon: '✔', color: 'green', borderColor: 'green' },
}

interface StatusPanelProps {
  type: PanelType
  title: string
  children?: React.ReactNode
}

export function StatusPanel({ type, title, children }: StatusPanelProps) {
  const { icon, color, borderColor } = PANEL_CONFIG[type]
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={borderColor} paddingX={1}>
      <Text bold color={color}>
        {icon} {title}
      </Text>
      {children}
    </Box>
  )
}

// ===== Badge =====

interface BadgeProps {
  label: string
  color?: string
}

export function Badge({ label, color = 'cyan' }: BadgeProps) {
  return (
    <Text backgroundColor={color} color="white" bold>
      {` ${label} `}
    </Text>
  )
}

// ===== App Header =====

interface AppHeaderProps {
  step: number
  stashed?: boolean
}

export function AppHeader({ step, stashed }: AppHeaderProps) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box gap={1}>
        <Text backgroundColor="cyan" color="white" bold>{' git-sync-tui '}</Text>
        <Text color="gray">cherry-pick --no-commit</Text>
        {stashed && (
          <Text backgroundColor="yellow" color="white" bold>{' STASHED '}</Text>
        )}
      </Box>
      <Box marginTop={0}>
        <Text color="gray" dimColor>{'  '}</Text>
        <StepProgress current={step} />
      </Box>
    </Box>
  )
}
