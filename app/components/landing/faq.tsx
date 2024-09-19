import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion"
import SectionTitle from "../layout/SectionTitle"

const FAQ_DATA = [
	{
		question: "Is it styled?",
		answer: <p>Yes. It comes with default styles that matches the other
			components aesthetic.</p>
	},
	{
		question: "Is it animated?",
		answer: <p>Yes. Its animated by default, but you can disable it if you
			prefer.</p>
	},

]

function FAQ() {
	return (
		<div className="flex flex-wrap justify-between mb-24 px-4 py-20">
			<div
				className="w-full md:w-2/5 lg:w-1/2 px-2"
			>
				<SectionTitle subtitle="OUR FAQS" title="Frequently Asked" highlighted="Questions" />
			</div>

			<Accordion type="single" collapsible className="w-full md:w-3/5 lg:w-1/2">
				{
					FAQ_DATA.map((item, i) => (
						<AccordionItem key={i} value={item.question}>
							<AccordionTrigger className="text-xl py-8 hover:no-underline">{item.question}</AccordionTrigger>
							<AccordionContent className="text-lg py-8 border-t px-2 text-muted-foreground">{item.answer}</AccordionContent>
						</AccordionItem>
					))
				}
			</Accordion>
		</div>
	)
}

export default FAQ
