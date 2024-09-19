import { QuoteIcon } from "~/constants/icons";
import SectionTitle from "../layout/SectionTitle";
import { StarFilledIcon } from "@radix-ui/react-icons";

const testimonialData = [
	{
		id: 1,
		name: "Sabo Masties",
		designation: "Founder @ Rolex",
		content:
			"Our members are so impressed. It's intuitive. It's clean. It's distraction free. If you're building a community.",
		star: 5,
	},
	{
		id: 2,
		name: "Margin Gesmu",
		designation: "Founder @ UI Hunter",
		content:
			"Our members are so impressed. It's intuitive. It's clean. It's distraction free. If you're building a community.",
		star: 5,
	},
	{
		id: 3,
		name: "William Smith",
		designation: "Founder @ Trorex",
		content:
			"Our members are so impressed. It's intuitive. It's clean. It's distraction free. If you're building a community.",
		star: 5,
	},
];

type Testimonial = {
	id: number;
	name: string;
	designation: string;
	content: string;
	star: number;
};

const SingleTestimonial = ({ testimonial }: { testimonial: Testimonial }) => {
	const { star, name, content, designation } = testimonial;

	const ratingIcons = [];
	for (let index = 0; index < star; index++) {
		ratingIcons.push(
			<StarFilledIcon key={index} className="text-yellow-500 w-6 h-6" />,
		);
	}

	return (
		<div className="w-full px-4 md:w-1/2 lg:w-1/3">
			<div
				className="rounded-xl bg-card px-4 py-8 shadow-lg sm:px-8"
			>
				<div className="mb-4 flex items-center gap-1">
					{ratingIcons}
				</div>

				<p className="mb-6 text-base">
					<QuoteIcon />
					{content}
				</p>

				<div className="flex items-center gap-4">
					<div className="h-12 w-12 overflow-hidden rounded-full">
						<img src={
							`https://api.dicebear.com/9.x/avataaars/svg?seed=${name.split(" ")[0]}`
						} alt={name} width={48} height={48} loading="lazy" />
					</div>

					<div>
						<h3 className="text-sm font-semibold">
							{name}
						</h3>
						<p className="text-secondary-foreground text-xs">{designation}</p>
					</div>
				</div>
			</div>
		</div>
	);
};

const Testimonials = () => {
	return (
		<section className="bg-muted py-16">
			<div className="container px-4">
				<SectionTitle
					subtitle="Testimonials"
					title="What our"
					highlighted="Clients Say"
					paragraph="There are many variations of passages of Lorem Ipsum available but the majority have suffered alteration in some form."
					width="640px"
					center
				/>

				<div className="mt-14 flex flex-wrap lg:mt-20 gap-y-8">
					{testimonialData.map((testimonial, i) => (

						<SingleTestimonial key={i} testimonial={testimonial} />
					))}
				</div>
			</div>
		</section>
	);
};

export default Testimonials;
