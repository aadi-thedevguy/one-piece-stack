import Hero from '~/components/landing/hero'
import CTA from '~/components/landing/call-to-action'
import { SpiralArrowIcon } from '~/constants/icons'
import FAQ from '~/components/landing/faq'
import Features from '~/components/landing/features'
import Testimonials from '~/components/landing/testimonial'
import DemoSteps from '~/components/landing/demo-steps'

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
				<Features />
				<DemoSteps />
				<FAQ />
				<Testimonials />
				<CTA />
			</div>
		</>
	)
}
