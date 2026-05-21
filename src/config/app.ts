import type React from 'react'
import { theme } from '../assets/colors'

export const apiBaseUrl = import.meta.env.VITE_CORE_API ?? 'http://localhost:8000'
export const adminUsername = import.meta.env.VITE_ADMIN_USERNAME ?? 'admin'
export const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD ?? ''
export const pageSizeOptions = [10, 25, 50]
export const defaultWatchlist = ['MSFT', 'KO']

export const dateWindowOptions = [
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Custom', value: 'custom' },
] as const

export const queryPresets = [
  'Which upcoming dividends have yield above 5%?',
  'Summarize payment dates for my watchlist.',
  'Find confirmed dividends this week.',
]

type ThemeVars = React.CSSProperties & Record<`--${string}`, string>

export const themeVars: ThemeVars = {
  '--bg': theme.colors.surface.base,
  '--section': theme.colors.surface.containerLow,
  '--field': theme.colors.surface.containerHighest,
  '--card': theme.colors.surface.containerLowest,
  '--dim': theme.colors.surface.dim,
  '--text': theme.colors.text.primary,
  '--muted': theme.colors.text.secondary,
  '--faint': theme.colors.text.tertiary,
  '--brand': theme.colors.primary.container,
  '--brand-dark': theme.colors.primary.main,
  '--brand-text': theme.colors.primary.onPrimaryContainer,
  '--line': theme.colors.outline.variant,
  '--ghost': theme.colors.outline.ghost,
  '--divider': theme.colors.outline.divider,
  '--success': theme.colors.status.success,
  '--error-bg': theme.colors.status.errorContainer,
  '--error-text': theme.colors.status.onErrorContainer,
  '--grad-primary': theme.gradients.primary,
  '--grad-soft': theme.gradients.secondary,
  '--shadow-card': theme.shadows.card,
  '--shadow-elevated': theme.shadows.elevated,
  '--radius-sm': theme.radius.sm,
  '--radius-md': theme.radius.md,
  '--radius-lg': theme.radius.lg,
}
