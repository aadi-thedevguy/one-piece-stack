import { json } from '@remix-run/node'
import Hero from '~/components/landing/hero'
import CTA from '~/components/landing/call-to-action'
import { CTA_DATA, FEATURES, PLANS_DATA } from '~/constants'
import { SpiralArrowIcon } from '~/constants/icons'
import Plans from '~/components/landing/plans'

export async function loader() {
	const res = await fetch(
		'https://api.github.com/repos/i4o-oss/synthwave-stack'
	)
	const data = await res.json()
	return json({ stars: data.stargazers_count })
}

function Features() {
	return (
		<div className='py-24 sm:py-32'>
			<div className='mx-auto max-w-7xl px-6 lg:px-8'>
				<div className='mx-auto max-w-2xl lg:text-center'>
					<h2 className='text-secondary-foreground text-base font-semibold leading-7'>
						Build apps faster
					</h2>
					<p className='mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-tight'>
						Everything you need to build Remix-powered web apps
					</p>
				</div>
				<div className='mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-5xl'>
					<dl className='grid max-w-xl grid-cols-2 gap-y-10 gap-x-8 lg:max-w-none lg:grid-cols-2 lg:gap-y-16'>
						{FEATURES.map((feature) => (
							<div key={feature.name} className='relative pl-16'>
								<dt className='text-base font-semibold leading-7 text-gray-900 dark:text-gray-100'>
									<div className='bg-primary absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-lg'>
										<feature.icon
											className='h-5 w-5 text-primary-foreground'
											aria-hidden='true'
										/>
									</div>
									{feature.name}
								</dt>
								<dd className='mt-2 text-base leading-7 text-gray-600 dark:text-gray-300'>
									{feature.description}
								</dd>
							</div>
						))}
					</dl>
				</div>
			</div>
		</div>
	)
}

export default function Index() {
	return (
		<>
			<div className='flex min-h-[calc(100vh-10rem)] w-full flex-col'>
				<Hero />
				{/* Mobile Cover Background */}
				{/* <div className='border-t-[12px] border-l-[12px] border-r-[12px] lg:border-[14px]  border-black/75 bg-base-100 rounded-t-[3.5rem] lg:rounded-[4rem] overflow-hidden max-h-[28rem] md:max-h-none md:max-w-[24rem] md:aspect-[9/18] md:order-first' ></div> */}
				{/* Arrow image */}
				<div className='max-lg:hidden absolute top-1/4 -left-4 -translate-x-full text-sm flex flex-col gap-1 items-center'>
					<p className='text-base-content/80'>
						The code in 3 minutes
					</p>
					<SpiralArrowIcon />
				</div>
				<CTA value={CTA_DATA} />
				<Plans value={PLANS_DATA} />
				<Features />
			</div>
		</>
	)
}
