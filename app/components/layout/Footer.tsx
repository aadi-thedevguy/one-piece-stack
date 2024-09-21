import { GitHubLogoIcon, TwitterLogoIcon } from '@radix-ui/react-icons'
import { Link } from '@remix-run/react'
import { buttonVariants } from '../ui/button'
import { cn } from '~/lib/utils'

const FOOTER_SOCIALS = [
	{
		ariaLabel: 'Github Repository',
		icon: <GitHubLogoIcon className='h-6 w-6' />,
		href: 'https://github.com/aadi-thedevguy/one-piece-stack',
	},
	{
		ariaLabel: 'Twitter Profile',
		icon: <TwitterLogoIcon className='h-6 w-6' />,
		href: 'https://twitter.com/Aadi__khare',
	},
]

const LINKS = [
	{
		label: "Home",
		href: "/",
	},
	{
		label: "Pricing",
		href: "/plans",
	},
	{
		label: "Profile",
		href: "/profile",
	},
]
const LEGAL = [
	{
		label: "Terms of Service",
		href: "/tos",
	},
	{
		label: "Privacy Policy",
		href: "/privacy",
	},
]

function Footer({ children }: { children: React.ReactNode }) {
	return (
		<footer className="border-t border-border bg-secondary mt-24">
			<div className="flex flex-wrap mx-auto max-w-screen-xl px-4 md:px-8 py-20 lg:py-25 gap-8 lg:justify-between lg:gap-0">
				<div
					className="w-1/2 lg:w-1/4"
				>
					{/* <Link to="/" className="relative">
						<Skull className='w-10 h-10 text-secondary-foreground' />
					</Link> */}
					{children}

					<p className="mb-10 mt-5">
						&copy; {new Date().getFullYear()} <a href="https://thedevguy.in" rel='noreferrer noopener' className={cn(buttonVariants({ variant: 'link' }), "mx-0 px-0")}>One Piece Stack.</a> All rights reserved
					</p>

					<p className="mb-1.5 text-card-foreground uppercase tracking-[5px]">
						contact
					</p>
					<a
						href="mailto:support@thedevguy.in"
						className={buttonVariants({ variant: 'link' })}
					>
						<span className="text-xl">
							support@thedevguy.in
						</span>
					</a>
				</div>

				<div className="flex w-full flex-col gap-8 md:flex-row md:justify-between md:gap-0 lg:w-2/3 xl:w-7/12">
					<div>
						<h4 className="mb-9 text-xl text-accent-foreground font-medium">
							Quick Links
						</h4>
						<ul>
							{
								LINKS.map((item, index) => (
									<li key={index}>
										<Link
											to={item.href}
											className={buttonVariants({ variant: 'link' })}
										>
											{item.label}
										</Link>
									</li>
								))
							}
						</ul>
					</div>

					<div>
						<h4 className="mb-9 text-xl text-accent-foreground font-medium">
							Legal
						</h4>
						<ul>
							{
								LEGAL.map((item, index) => (
									<li key={index}>
										<Link
											to={item.href}
											className={buttonVariants({ variant: 'link' })}
										>
											{item.label}
										</Link>
									</li>
								))
							}
						</ul>
					</div>

					<div>
						<h4 className="mb-9 text-xl text-accent-foreground font-medium">
							Socials
						</h4>
						<ul>
							{
								FOOTER_SOCIALS.map((item, index) => (
									<li key={index}>
										<Link
											to={item.href}
											title={item.ariaLabel}
											className={buttonVariants({ variant: 'ghost', size: "icon" })}
										>
											{item.icon}
											{/* {item.ariaLabel} */}
										</Link>
									</li>
								))
							}
						</ul>
					</div>

				</div>
			</div>
		</footer >
	)
}

export default Footer
