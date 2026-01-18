import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import SectionTitle from "../layout/SectionTitle";

const FAQ_DATA = [
  {
    question: "Is it styled?",
    answer: (
      <p>
        Yes. It comes with default styles that matches the other components
        aesthetic.
      </p>
    ),
  },
  {
    question: "Is it animated?",
    answer: (
      <p>Yes. Its animated by default, but you can disable it if you prefer.</p>
    ),
  },
];

function FAQ() {
  return (
    <div className="mx-auto mb-24 flex w-10/12 flex-wrap justify-between bg-background px-4 py-20">
      <div className="w-full px-2 lg:w-1/2">
        <SectionTitle
          highlighted="Questions"
          subtitle="OUR FAQS"
          title="Frequently Asked"
        />
      </div>

      <Accordion className="w-full lg:w-1/2" collapsible type="single">
        {FAQ_DATA.map((item, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          <AccordionItem key={i} value={item.question}>
            <AccordionTrigger className="py-8 text-xl hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="border-t px-2 py-8 text-lg text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

export default FAQ;
