import { redirect, type ActionFunctionArgs } from '@remix-run/node'
import { auth as authenticator } from '~/lib/auth/connections.server'
import { ProviderNameSchema } from '~/lib/validations'
import { getReferrerRoute } from '~/lib/utils'
import { getRedirectCookieHeader } from '~/lib/redirect-cookie.server'

export async function loader() {
    return redirect('/login')
}

export async function action({ request, params }: ActionFunctionArgs) {
    const providerName = ProviderNameSchema.parse(params.provider)

    try {
        // await handleMockAction(providerName, request)
        return await authenticator.authenticate(providerName, request)
    } catch (error: unknown) {
        if (error instanceof Response) {
            const formData = await request.formData()
            const rawRedirectTo = formData.get('redirectTo')
            const redirectTo =
                typeof rawRedirectTo === 'string'
                    ? rawRedirectTo
                    : getReferrerRoute(request)
            const redirectToCookie = getRedirectCookieHeader(redirectTo)
            if (redirectToCookie) {
                error.headers.append('set-cookie', redirectToCookie)
            }
        }
        throw error
    }
}
