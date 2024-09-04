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

export const PLANS_DATA = {
	heading: 'Designed for business teams like yours',
	description:
		'Here at Flowbite we focus on markets where technology, innovation, and capital can unlock long-term value and drive economic growth.',
	plans: [
		{
			planName: 'Starter',
			info: 'Best option for personal use & for your next project.',
			price: 10,
			features: [
				'10 users included',
				'2 GB of storage',
				'Help center access',
				'Email support',
			],
			buttonLink: '/',
		},
		{
			planName: 'Premium',
			info: 'Best for large scale uses and extended redistribution rights.',
			price: 20,
			features: [
				'20 users included',
				'10 GB of storage',
				'24x7 hour support',
				'Unlimited email support',
			],
			buttonLink: '/',
			isPopular: true,
		},
	],
}
