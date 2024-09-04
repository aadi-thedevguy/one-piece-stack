import * as E from '@react-email/components'

export function EmailChangeEmail({
    verifyUrl,
    otp,
}: {
    verifyUrl: string
    otp: string
}) {
    return (
        <E.Html lang="en" dir="ltr">
            <E.Container>
                <h1>
                    <E.Text>Epic Notes Email Change</E.Text>
                </h1>
                <p>
                    <E.Text>
                        Here&apos;s your verification code: <strong>{otp}</strong>
                    </E.Text>
                </p>
                <p>
                    <E.Text>Or click the link:</E.Text>
                </p>
                <E.Link href={verifyUrl}>{verifyUrl}</E.Link>
            </E.Container>
        </E.Html>
    )
}