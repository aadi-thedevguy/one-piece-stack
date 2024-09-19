import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { buttonVariants } from '../ui/button'

const value = {
	subjectLine: 'Start a project with One Piece Stack today.',
	subtitle:
		'One Piece Stack is open source and powered by open source software.',
	btnText: 'Github',
	btnLink: 'https://github.com/aadi-thedevguy/one-piece-stack',
}

export default function CTA() {
	return (
		<article className='mx-auto max-w-7xl my-32 py-20 px-12 rounded-xl lg:px-24 bg-accent text-accent-foreground text-center'>

			<div className='flex flex-col items-center'>
				<h2 className='text-3xl font-bold sm:text-4xl text-secondary-foreground'>
					{value.subjectLine}
				</h2>
				<p className='max-w-2xl mt-6 text-lg leading-8 text-secondary-foreground'>
					{value.subtitle}
				</p>
				<div className='mt-10'>
					<a
						href={value.btnLink}
						rel="noreferrer"
						target='_blank'
						className={buttonVariants({ variant: "default", size: "lg" })}
					>
						{value.btnText}
						<GitHubLogoIcon className='w-5 h-5 ml-3' />
					</a>
				</div>
			</div>
		</article>
	)
}
