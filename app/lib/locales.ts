import { getClientLocales } from 'remix-utils/locales/server'
import { Currency } from '~/constants/index'

export function getDefaultCurrency(request: Request) {
    const locales = getClientLocales(request)

    // Set a default currency if no locales are found.
    if (!locales) return Currency.USD
    return locales?.find(locale => locale === 'en-US')
        ? Currency.USD
        : Currency.EUR
}