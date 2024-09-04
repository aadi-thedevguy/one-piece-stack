import { z } from 'zod'
import { v4 as cuid } from 'uuid'

export const providerNames = ['google'] as const
const types = ['onboarding', 'reset-password', 'change-email'] as const
export const codeQueryParam = 'code'
export const targetQueryParam = 'target'
export const typeQueryParam = 'type'
export const redirectToQueryParam = 'redirectTo'

export const BreadcrumbHandle = z.object({ breadcrumb: z.any() })
export const ToastSchema = z.object({
    description: z.string(),
    id: z.string().default(() => cuid()),
    title: z.string().optional(),
    type: z.enum(['message', 'success', 'error']).default('message'),
})
export const VerificationTypeSchema = z.enum(types)
export const ProviderNameSchema = z.enum(providerNames)
export const VerifySchema = z.object({
    [codeQueryParam]: z.string().min(6).max(6),
    [typeQueryParam]: VerificationTypeSchema,
    [targetQueryParam]: z.string(),
    [redirectToQueryParam]: z.string().optional(),
})
export const ThemeFormSchema = z.object({
    theme: z.enum(['system', 'light', 'dark']),
    // this is useful for progressive enhancement
    redirectTo: z.string().optional(),
})

export type Toast = z.infer<typeof ToastSchema>
export type ToastInput = z.input<typeof ToastSchema>
export type ProviderName = z.infer<typeof ProviderNameSchema>
export type VerificationTypes = z.infer<typeof VerificationTypeSchema>
export type BreadcrumbHandle = z.infer<typeof BreadcrumbHandle>
