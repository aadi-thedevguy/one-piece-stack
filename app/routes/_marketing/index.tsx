import CTA from "~/components/landing/call-to-action";
import DemoSteps from "~/components/landing/demo-steps";
import FAQ from "~/components/landing/faq";
import Features from "~/components/landing/features";
import Hero from "~/components/landing/hero";
import Testimonials from "~/components/landing/testimonial";
import { SpiralArrowIcon } from "~/constants/icons";

export default function Index() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] w-full flex-col">
      <Hero />
      {/* Mobile Cover Background */}
      {/* <div className='border-t-[12px] border-l-[12px] border-r-[12px] lg:border-[14px]  border-black/75 bg-base-100 rounded-t-[3.5rem] lg:rounded-[4rem] overflow-hidden max-h-[28rem] md:max-h-none md:max-w-[24rem] md:aspect-9/18 md:order-first' ></div> */}
      {/* Arrow image */}
      <div className="absolute top-1/4 -left-4 flex -translate-x-full flex-col items-center gap-1 text-sm max-lg:hidden">
        <p className="text-base-content/80">The code in 3 minutes</p>
        <SpiralArrowIcon />
      </div>
      <Features />
      <DemoSteps />
      <FAQ />
      <Testimonials />
      <CTA />
    </div>
  );
}
