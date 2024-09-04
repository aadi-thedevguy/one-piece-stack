import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { Link } from 'lucide-react'

type Props = {
	btnText: string
	btnLink: string
	subjectLine: string
	subtitle: string
	lovedBy?: string
}
export default function CTA({ value }: { value: Props }) {
	return (
		<div className='py-24 sm:py-32'>
			<div className='mx-auto max-w-7xl px-6 lg:px-8'>
				<div className='relative isolate overflow-hidden bg-accent bg-blend-darken px-6 pt-16 sm:rounded-3xl sm:px-16 md:pt-24 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0'>
					<div className='mx-auto flex flex-col items-center text-center lg:mx-0 lg:flex-auto lg:py-32'>
						<h2 className='text-3xl font-bold sm:text-4xl text-primary-foreground'>
							{value.subjectLine}
						</h2>
						<p className='max-w-2xl mt-6 text-lg leading-8 text-primary-foreground'>
							{value.subtitle}
							<br />
							<Link
								href={value.btnLink}
								className='text-base font-semibold leading-6 text-primary-foreground underline'
							>
								{value.btnText}
							</Link>
						</p>
						<div className='mt-10 flex flex-col items-center justify-center gap-8'>
							<a
								href='https://github.com/i4o-oss/synthwave-stack'
								className='text-lg font-semibold leading-6 text-primary-foreground flex items-center gap-x-1'
								target='_blank'
								rel='noopener noreferrer'
							>
								<div className='w-10 h-10 flex items-center justify-center bg-ui text-primary-foreground rounded'>
									<GitHubLogoIcon className='w-5 h-5' />
								</div>
								{value.lovedBy && (
									<div className='flex items-center'>
										<div className='h-4 w-4 border-y-8 border-l-0 border-r-8 border-solid border-ui border-y-transparent'></div>
										<div className='flex h-10 items-center rounded-md border border-ui bg-ui px-4 font-medium'>
											{value.lovedBy}
										</div>
									</div>
								)}
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
