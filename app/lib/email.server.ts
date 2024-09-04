import { render } from '@react-email/components'
import { type ReactElement } from 'react'
import nodemailer from 'nodemailer'
// import { PrimaryActionEmailHtml } from '~/components/mails/PrimaryActionEmail'

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_SERVER,
	secure: false,
	port: 587,
	auth: {
		user: process.env.EMAIL_FROM_ADDRESS,
		pass: process.env.EMAIL_PASSWORD,
	},
})

// const sendEmail: SendEmailFunction<any> = async (options) => {
// 	const message = {
// 		to: [options.emailAddress],
// 		from: `Demo <${process.env.EMAIL_FROM_ADDRESS}>`,
// 		subject: "Here's your Magic sign-in link",
// 		html: PrimaryActionEmailHtml({
// 			actionLabel: 'Sign in to Your Account',
// 			href: options.magicLink,
// 			buttonText: 'Sign in',
// 		}),
// 	}

// 	await transporter.sendMail(message)
// }

// export default sendEmail


export async function sendEmail({
	react,
	...options
}: {
	to: string[]
	subject: string
} & (
		| { html: string; text: string; react?: never }
		| { react: ReactElement; html?: never; text?: never }
	)) {

	const message = {
		from: `Demo <${process.env.EMAIL_FROM_ADDRESS}>`,
		...options,
		...(react ? await renderReactEmail(react) : null),

	}
	try {

		const data = await transporter.sendMail(message)

		if (data.messageId) {
			return {
				status: 'success',
				// data: parsedData,
			} as const
		}
	} catch (error) {

		if (error instanceof Error) {
			return {
				status: 'error',
				error: {
					name: error.name,
					message: error.message,
					statusCode: 500,
					cause: error,
				}
			}
		}
	}

}

async function renderReactEmail(react: ReactElement) {
	const [html, text] = await Promise.all([
		render(react),
		render(react, { plainText: true }),
	])
	return { html, text }
}

