import { StarFilledIcon } from "@radix-ui/react-icons";
import { CheckIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import SectionTitle from "../layout/section-title";

const VALUE_PROP = [
  "Easy to use and Setup",
  "Built for Production",
  "Fine-grained customization",
];

const AvatarStack = () => (
  <div className="flex -space-x-4 rtl:space-x-reverse">
    <img
      alt="avatar"
      className="h-10 w-10 rounded-full border-2 border-border"
      height={40}
      src="https://api.dicebear.com/9.x/adventurer/svg"
      width={40}
    />
    <img
      alt="avatar"
      className="h-10 w-10 rounded-full border-2 border-border"
      height={40}
      src="https://api.dicebear.com/9.x/adventurer/svg"
      width={40}
    />
    <img
      alt="avatar"
      className="h-10 w-10 rounded-full border-2 border-border"
      height={40}
      src="https://api.dicebear.com/9.x/adventurer/svg"
      width={40}
    />
    <img
      alt="avatar"
      className="h-10 w-10 rounded-full border-2 border-border"
      height={40}
      src="https://api.dicebear.com/9.x/adventurer/svg"
      width={40}
    />
  </div>
);

const Hero = () => {
  return (
    <section className="mx-auto w-11/12 py-12 xl:py-25">
      <div className="flex lg:items-center lg:gap-8 xl:gap-32.5">
        <div className="lg:w-1/2">
          <SectionTitle
            highlighted="SaaS"
            paragraph="Solid Pro - Packed with all the key integrations you need for swift SaaS startup launch, including - Auth, Database,Components, Pages and More. 
						Built with React Router and TypeScript."
            title="Production Ready Remix Template for"
          />

          <ul className="my-8 space-y-4 text-left">
            {VALUE_PROP.map((feature, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: React requires a key and the list is static
              <li className="flex items-center space-x-3" key={i}>
                <CheckIcon className="text-green-300" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <Button className="mt-10" size="lg" variant="secondary">
            Get Started
          </Button>

          {/* <p className="mt-5 text-black dark:text-white">
								Try for free no credit card required.
							</p> */}

          <div className="mt-12 flex items-center gap-8">
            <AvatarStack />
            <div className="w-1/2 flex-1">
              <div className="flex items-center gap-1">
                {new Array(5).fill(0).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: React requires a key and the list is static
                  <StarFilledIcon className="h-4 w-4 text-yellow-500" key={i} />
                ))}
              </div>

              <p>
                <strong className="font-semibold">169</strong> Entreprenuers
                ship faster
              </p>
            </div>
          </div>
        </div>

        <div className="hidden lg:block lg:w-1/2">
          <div className="relative 2xl:-mr-7.5">
            <img
              alt="shape"
              className="absolute top-0 -left-11.5"
              height={246}
              src="/images/shape/shape-01.png"
              width={46}
            />
            <img
              alt="shape"
              className="absolute right-0 bottom-0 z-10"
              height={36.7}
              src="/images/shape/shape-02.svg"
              width={36.9}
            />
            <img
              alt="shape"
              className="absolute -right-6.5 bottom-0 z-1"
              height={21.66}
              src="/images/shape/shape-03.svg"
              width={21.64}
            />
            <div className="relative aspect-700/444 w-full">
              <img
                alt="Hero"
                className="shadow-solid-l dark:hidden"
                height={320}
                src="/images/hero/hero-light.svg"
                width={500}
              />
              <img
                alt="Hero"
                className="hidden shadow-solid-l dark:block"
                height={320}
                src="/images/hero/hero-dark.svg"
                width={500}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
