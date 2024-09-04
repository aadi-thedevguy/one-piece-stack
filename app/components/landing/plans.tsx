import { Link } from '@remix-run/react'
import { CheckIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '~/lib/utils'

type PriceColumnProps = {
	planName: string
	info: string
	price: number
	features: string[]
	buttonLink: string
	isPopular?: boolean
}

type PlanProps = {
	heading: string
	description: string
	plans: PriceColumnProps[]
}

const PriceColumn = ({ value }: { value: PriceColumnProps }) => {
	const { planName, info, price, features, buttonLink, isPopular } = value
	return (
		<div
			className={cn(
				'flex flex-col p-6 mx-auto max-w-lg text-center  rounded-xl border border-border shadow xl:p-8',
				{
					'border-yellow-200': isPopular,
				}
			)}
		>
			{/* {isPopular && (
				<div className='rounded-lg absolute left-0 -top-4 text-sm font-semibold py-2 px-4 text-primary bg-yellow-200 uppercase'>
					POPULAR
				</div>
			)} */}
			<h3 className='mb-4 text-2xl font-semibold'>{planName}</h3>
			<p className='font-light text-gray-500 sm:text-lg'>{info}</p>
			<div className='flex justify-center items-baseline my-8'>
				<span className='mr-2 text-5xl font-extrabold'>${price}</span>
				{/* <span className="text-gray-500 dark:text-gray-400">/month</span> */}
			</div>
			<ul className='mb-8 space-y-4 text-left'>
				{features.map((feature, i) => (
					<li key={i} className='flex items-center space-x-3'>
						<CheckIcon className='text-green-300' />
						<span>{feature}</span>
					</li>
				))}
			</ul>
			<Link to={buttonLink}>
				<Button>Get started</Button>
			</Link>
		</div>
	)
}

export default function Plans({ value }: { value: PlanProps }) {
	return (
		<section>
			<div className='py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6'>
				<div className='mx-auto max-w-screen-md text-center mb-8 lg:mb-12'>
					<h2 className='mb-4 text-4xl tracking-tight font-extrabold'>
						{value.heading}
					</h2>
					<p className='mb-5 font-light text-gray-500 sm:text-xl'>
						{value.description}
					</p>
				</div>
				<div className='space-y-8 flex justify-center flex-wrap gap-6 lg:space-y-0'>
					<PriceColumn value={value.plans[0]} />
					<PriceColumn value={value.plans[1]} />
				</div>
			</div>
		</section>
	)
}
