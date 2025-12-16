import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

const featuresTabData = [
  {
    id: "tabOne",
    title: "Solid Has Neat & Clean User Interface.",
    desc1:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut ultricies lacus non fermentum ultrices. Fusce consectetur le.",
    desc2:
      "Nam id eleifend dui, id iaculis purus. Etiam lobortis neque nec finibus sagittis. Nulla ligula nunc egestas ut.",
  },
  {
    id: "tabTwo",
    title: "Ready to Use Pages You Need for a SaaS Business.",
    desc1:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut ultricies lacus non fermentum ultrices. Fusce consectetur le.",
    desc2:
      "Nam id eleifend dui, id iaculis purus. Etiam lobortis neque nec finibus sagittis. Nulla ligula nunc egestas ut.",
  },
  {
    id: "tabThree",
    title: "Functional Blog, DB, Auth and Many More",
    desc1:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut ultricies lacus non fermentum ultrices. Fusce consectetur le.",
    desc2:
      "Nam id eleifend dui, id iaculis purus. Etiam lobortis neque nec finibus sagittis. Nulla ligula nunc egestas ut.",
  },
];

function DemoSteps() {
  return (
    <Tabs
      className="mx-auto max-w-(--breakpoint-xl) px-4 pt-16 pb-20 md:px-8 2xl:px-0"
      defaultValue={featuresTabData[0].id}
    >
      {/* <!-- Tab Menus --> */}
      <TabsList className="mb-15 flex min-h-fit w-full flex-col gap-2 overflow-x-hidden rounded-lg lg:h-9 lg:flex-row lg:gap-0 lg:border lg:shadow-lg">
        {featuresTabData.map((item, i) => (
          <TabsTrigger
            className="flex h-full w-full cursor-pointer justify-start"
            key={i}
            value={item.id}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-[50%] border">
              <span className="font-medium text-muted-foreground">
                0{i + 1}
              </span>
            </div>
            <p className="font-medium text-sm xl:text-base">{item.title}</p>
          </TabsTrigger>
        ))}
      </TabsList>
      {/* <!-- Tab Content  --> */}
      {featuresTabData.map((feature, key) => (
        <TabsContent key={feature.id} value={feature.id}>
          <div className="flex items-center gap-8 bg-background lg:gap-19">
            <div className="md:w-1/2">
              <h2 className="mb-7 font-bold text-3xl">{feature.title}</h2>
              <p className="mb-5">{feature.desc1}</p>
              <p className="w-11/12">{feature.desc2}</p>
            </div>
            <div className="mx-auto hidden aspect-square max-w-[550px] rounded-lg md:block md:w-1/2">
              <img
                alt={feature.title}
                height={25}
                loading="lazy"
                src={`https://api.dicebear.com/9.x/notionists/svg?seed=${feature.id}`}
                width={25}
              />
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

export default DemoSteps;
