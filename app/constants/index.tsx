import {
	CheckCircledIcon,
	DashboardIcon,
	FileTextIcon,
	HeartFilledIcon,
	LayersIcon,
	LockClosedIcon,
	MixIcon,
	RocketIcon,
} from '@radix-ui/react-icons'
import { PricingPlan } from '~/types'

export const FEATURES = [
	{
		name: 'Easy to use',
		description:
			"Fill in some environment variables, and you're off to shipping in minutes",
		icon: RocketIcon,
	},
	{
		name: 'Built for Remix',
		description:
			"Leverage Remix's features to build modern web apps with great UX",
		icon: HeartFilledIcon,
	},
	{
		name: 'Authentication',
		description: 'Magic links and Google & Twitter oAuth out-of-the-box',
		icon: LockClosedIcon,
	},
	{
		name: 'Written In TypeScript',
		description: 'Build your app with typesafety from the very start',
		icon: CheckCircledIcon,
	},
	{
		name: 'Third-party Integrations',
		description: 'Pre-configured emails, analytics, error tracking',
		icon: MixIcon,
	},
	{
		name: 'Components',
		description: 'UI components built using Radix UI and TailwindCSS',
		icon: LayersIcon,
	},
	{
		name: 'Docs (Coming Soon)',
		description: 'Full-featured documentation site with MDX',
		icon: FileTextIcon,
	},
	{
		name: 'Payments (Coming Soon)',
		description: 'Billing and subscriptions using LemonSqueezy',
		icon: DashboardIcon,
	},
]

export const CTA_DATA = {
	subjectLine: 'Start a project with Synthwave Stack today.',
	subtitle:
		'Synthwave Stack is open source and powered by open source software.',
	btnText: 'Github',
	btnLink: 'https://github.com/i4o-oss/synthwave-stack',
	lovedBy: '72 stars on GitHub',
}

export const PRIVACY_POLICY =
	`
**Last updated: January 16, 2024**

In this Policy, **“Shopagator”, “we”, “our,” or “us”** refers to *this Website* responsible for the collection, use, and handling of Personal Data as described in this document. 

“Personal Data” refers to any information associated with an identified or identifiable individual, which can include data that you provide to us, and we collect about you during your interaction with our Services (such as device information, IP address, etc.).
“Services” refer to the products and services provided by our Services Agreement and our Consumer Terms of Service.

When you use an End User Service for personal use, such as shopping from our website, we refer to you as an “End User.”

1. Personal Data we collect and how we use and share it
Our collection and use of Personal Data differs based on whether you are an End User or a Visitor, and the specific Service being utilized.

- Personal Data we collect about End Users
**Payment Provider:** When you purchase goods or services directly from us, we share your Transaction Data with our payment providers. For instance, when you make a payment to our Store, we collect information about the transaction, as well as your contact and payment method details.
Identity/Verification Services: We also collect your basic user information like name, email address etc. to identify and track your orders etc.

2. More ways we collect, use, and share Personal Data

In addition to the ways described above, we also process your Personal Data as follows:

**Online Activity:** Usage data associated with those devices and browsers and your engagement with our Services, including data elements like IP address, plug-ins, language preference, time spent on Sites and Third Party Sites, pages visited, links clicked, payment methods used, and the pages that led you to our Sites and Third Party Sites. We also collect activity indicators, such as mouse activity indicators, to help us detect fraud.

**Communication and Engagement Information:** We also collect information you choose to share with us through various channels, such as support tickets, emails, or social media. If you respond to emails or surveys from us, we collect your email address, name, and any other data you opt to include in your email or responses.


**Communications:** We use the contact information we have about you to deliver our Services, which may involve sending codes via Email for your authentication or Notifying you about new features.

3. Your rights and choices
Depending on your location and subject to applicable law, you may have choices regarding our collection, use, and disclosure of your Personal Data:

If you wish to stop receiving marketing-related emails from us, or you want to know more about what data we have on you and want to remove it entirely, you can message us at <a href="mailto:support@thedevguy.in">support@thedevguy.in</a>

4. Security and Retention
We make reasonable efforts to provide a level of security appropriate to the risk associated with the processing of your Personal Data. We maintain organizational, technical, and administrative measures designed to protect the Personal Data covered by this Policy from unauthorized access, destruction, loss, alteration, or misuse. Unfortunately, no data transmission or storage system can be guaranteed to be 100% secure.
We encourage you to assist us in protecting your Personal Data. If you hold an account, you can do so by using a strong password, safeguarding your password against unauthorized use, and avoiding using identical login credentials you use for other services or accounts for your personal account. If you suspect that your interaction with us is no longer secure (for instance, you believe that your account's security has been compromised), please contact us immediately.


5. Updates and notifications
We may change this Policy from time to time to reflect new services, changes in our privacy practices or relevant laws. The “Last updated” legend at the top of this Policy indicates when this Policy was last revised. Any changes are effective the latter of when we post the revised Policy on the Services or otherwise provide notice of the update as required by law.
We may provide you with disclosures and alerts regarding the Policy or Personal Data collected by posting them on our website and, if you are an End User or Representative, by contacting you through your email address.

6. Contact us
If you have any questions or complaints about this Policy, please contact us at <a href="mailto:support@thedevguy.in">support@thedevguy.in</a>
		`

export const TERMS_OF_SERVICE = `

`

/**
 * Defines our plans IDs.
 */
export const enum PlanId {
	STARTER = 'starter',
	PRO = 'pro',
}

/**
 * Defines our plan pricing intervals.
 */
export const enum Interval {
	MONTH = 'month',
	YEAR = 'year',
}

/**
 * Defines our plan pricing currencies.
 */
export const enum Currency {
	// DEFAULT_CURRENCY = 'inr',
	USD = 'usd',
	EUR = 'eur',
}


/**
 * Defines our plans structure.
 */
export const PRICING_PLANS = {
	[PlanId.STARTER]: {
		planID: PlanId.STARTER,
		isPopular: false,
		name: 'Starter',
		description: 'Best option for personal use & for your next project.',
		features: [
			'10 users included',
			'2 GB of storage',
			'Help center access',
			'Email support',
		],
		limits: { maxItems: 99 },
		prices: {
			[Interval.MONTH]: {
				[Currency.USD]: 990,
				[Currency.EUR]: 990,
			},
			[Interval.YEAR]: {
				[Currency.USD]: 9990,
				[Currency.EUR]: 9990,
			},
		},
	},
	[PlanId.PRO]: {
		planID: PlanId.PRO,
		name: 'Premium',
		description: 'Best for large scale uses and extended redistribution rights.',
		features: [
			'20 users included',
			'10 GB of storage',
			'24x7 hour support',
			'Unlimited email support',
		],
		isPopular: true,
		limits: { maxItems: 999 },
		prices: {
			[Interval.MONTH]: {
				[Currency.USD]: 1990,
				[Currency.EUR]: 1990,
			},
			[Interval.YEAR]: {
				[Currency.USD]: 19990,
				[Currency.EUR]: 19990,
			},
		},
	},
} satisfies PricingPlan