import { Button } from "~/components/ui/button";
import SectionTitle from "../layout/SectionTitle";
import { CheckIcon } from "lucide-react";
import { StarFilledIcon } from "@radix-ui/react-icons";

const VALUE_PROP = [
	"Easy to use and Setup",
	"Built for Production",
	"Fine-grained customization",
]

const AvatarStack = () => {
	return (
		<div className="flex -space-x-4 rtl:space-x-reverse">
			<img className="w-10 h-10 border-2 border-border rounded-full"
				src="https://api.dicebear.com/9.x/adventurer/svg"
				alt="avatar"
			/>
			<img className="w-10 h-10 border-2 border-border rounded-full"
				src="https://api.dicebear.com/9.x/adventurer/svg"
				alt="avatar"
			/>
			<img className="w-10 h-10 border-2 border-border rounded-full"
				src="https://api.dicebear.com/9.x/adventurer/svg"
				alt="avatar"
			/>
			<img className="w-10 h-10 border-2 border-border rounded-full"
				src="https://api.dicebear.com/9.x/adventurer/svg"
				alt="avatar"
			/>

		</div>
	)

}

const Hero = () => {

	return (
		<section className="mx-auto w-11/12 py-12 xl:py-25">
			<div className="flex lg:items-center lg:gap-8 xl:gap-32.5">
				<div className="lg:w-1/2">

					<SectionTitle title="Production Ready Remix Template for" highlighted="SaaS" paragraph="Solid Pro - Packed with all the key integrations you need for swift SaaS startup launch, including - Auth, Database,Components, Pages and More. 
							Built-winth - ExpressJS, React and TypeScript." />

					<ul className='my-8 space-y-4 text-left'>
						{VALUE_PROP.map((feature, i) => (
							<li key={i} className='flex items-center space-x-3'>
								<CheckIcon className='text-green-300' />
								<span>{feature}</span>
							</li>
						))}
					</ul>

					<Button
						variant="secondary"
						size="lg"
						className="mt-10"
					>
						Get Started
					</Button>

					{/* <p className="mt-5 text-black dark:text-white">
								Try for free no credit card required.
							</p> */}

					<div className="flex items-center mt-12 gap-8">
						<AvatarStack />
						<div className="flex-1 w-1/2">
							<div className="flex items-center gap-1">
								{
									Array(5).fill(0).map((_, i) => (
										<StarFilledIcon key={i} className="text-yellow-500 w-4 h-4" />
									))
								}
							</div>

							<p>
								<strong className="font-semibold">169</strong> Entreprenuers ship faster
							</p>
						</div>
					</div>
				</div>

				<div className="hidden lg:w-1/2 lg:block">
					<div className="relative 2xl:-mr-7.5">
						<img
							src="/images/shape/shape-01.png"
							alt="shape"
							width={46}
							height={246}
							className="absolute -left-11.5 top-0"
						/>
						<img
							src="/images/shape/shape-02.svg"
							alt="shape"
							width={36.9}
							height={36.7}
							className="absolute bottom-0 right-0 z-10"
						/>
						<img
							src="/images/shape/shape-03.svg"
							alt="shape"
							width={21.64}
							height={21.66}
							className="absolute -right-6.5 bottom-0 z-1"
						/>
						<div className=" relative aspect-[700/444] w-full">
							<img
								className="shadow-solid-l dark:hidden"
								src="/images/hero/hero-light.svg"
								alt="Hero"
							/>
							<img
								className="hidden shadow-solid-l dark:block"
								src="/images/hero/hero-dark.svg"
								alt="Hero"
							/>
						</div>
					</div>
				</div>
			</div>
		</section >
	);
};

export default Hero;
