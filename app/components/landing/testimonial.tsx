import { StarFilledIcon } from "@radix-ui/react-icons";
import { QuoteIcon } from "~/constants/icons";
import SectionTitle from "../layout/section-title";

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

interface Testimonial {
  content: string;
  designation: string;
  id: number;
  name: string;
  star: number;
}

const SingleTestimonial = ({ testimonial }: { testimonial: Testimonial }) => {
  const { star, name, content, designation } = testimonial;

  const ratingIcons: React.ReactElement[] = [];

  for (let index = 0; index < star; index++) {
    ratingIcons.push(
      <StarFilledIcon className="h-6 w-6 text-yellow-500" key={index} />
    );
  }

  return (
    <div className="w-full px-4 md:w-1/2 lg:w-1/3">
      <div className="rounded-xl bg-card px-4 py-8 shadow-lg sm:px-8">
        <div className="mb-4 flex items-center gap-1">{ratingIcons}</div>

        <p className="mb-6 text-base">
          <QuoteIcon />
          {content}
        </p>

        <div className="flex items-center gap-4">
          <div className="h-12 w-12 overflow-hidden rounded-full">
            <img
              alt={name}
              height={48}
              loading="lazy"
              src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${name.split(" ")[0]}`}
              width={48}
            />
          </div>

          <div>
            <h3 className="font-semibold text-sm">{name}</h3>
            <p className="text-secondary-foreground text-xs">{designation}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Testimonials = () => (
  <section className="bg-muted py-16">
    <div className="container px-4">
      <SectionTitle
        center
        highlighted="Clients Say"
        paragraph="There are many variations of passages of Lorem Ipsum available but the majority have suffered alteration in some form."
        subtitle="Testimonials"
        title="What our"
        width="640px"
      />

      <div className="mt-14 flex flex-wrap gap-y-8 lg:mt-20">
        {testimonialData.map((testimonial) => (
          <SingleTestimonial key={testimonial.name} testimonial={testimonial} />
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
