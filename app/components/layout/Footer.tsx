import { GitHubLogoIcon, TwitterLogoIcon } from '@radix-ui/react-icons'

const FOOTER_SOCIALS = [
	{
		ariaLabel: 'Github Repository',
		icon: <GitHubLogoIcon className='h-6 w-6' />,
		href: 'https://github.com/i4o-oss/synthwave-stack',
	},
	{
		ariaLabel: 'Twitter Profile',
		icon: <TwitterLogoIcon className='h-6 w-6' />,
		href: 'https://twitter.com/i4o_dev',
	},
]
function Footer({ children }: { children: React.ReactNode }) {
	return (
		<div className='sticky top-0 z-50 flex h-20 w-screen flex-wrap items-center justify-center border-t border-gray-200 py-4 dark:border-gray-700'>
			<div className='flex w-[88rem] items-center justify-between sm:px-2 lg:px-8 xl:px-12'>
				{children}
				<div className='flex items-center justify-end gap-4'>
					{FOOTER_SOCIALS.map((social, index) => (
						<a
							aria-label={social.ariaLabel}
							className='text-black dark:text-gray-100'
							href={social.href}
							key={`social-${index}`}
							rel='noreferrer noopener'
							target='_blank'
						>
							{social.icon}
						</a>
					))}
				</div>
			</div>
		</div>
	)
}

export default Footer
