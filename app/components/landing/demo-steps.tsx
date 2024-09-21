import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"

const featuresTabData = [
	{
		id: "tabOne",
		title: "Solid Has Neat & Clean User Interface.",
		desc1: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut ultricies lacus non fermentum ultrices. Fusce consectetur le.`,
		desc2: `Nam id eleifend dui, id iaculis purus. Etiam lobortis neque nec finibus sagittis. Nulla ligula nunc egestas ut.`,
	},
	{
		id: "tabTwo",
		title: "Ready to Use Pages You Need for a SaaS Business.",
		desc1: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut ultricies lacus non fermentum ultrices. Fusce consectetur le.`,
		desc2: `Nam id eleifend dui, id iaculis purus. Etiam lobortis neque nec finibus sagittis. Nulla ligula nunc egestas ut.`
	},
	{
		id: "tabThree",
		title: "Functional Blog, DB, Auth and Many More",
		desc1: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut ultricies lacus non fermentum ultrices. Fusce consectetur le.`,
		desc2: `Nam id eleifend dui, id iaculis purus. Etiam lobortis neque nec finibus sagittis. Nulla ligula nunc egestas ut.`
	},
];

function DemoSteps() {

	return (
		<Tabs defaultValue={featuresTabData[0].id} className="mx-auto max-w-screen-xl pb-20 pt-16 px-4 md:px-8 2xl:px-0">

			{/* <!-- Tab Menues --> */}
			<TabsList
				className="mb-15 flex flex-wrap justify-center rounded-lg py-6 border shadow-lg md:flex-nowrap md:items-center lg:gap-7.5 xl:mb-21.5 xl:gap-12.5"
			>
				{
					featuresTabData.map((item, i) => (
						<TabsTrigger key={i} value={item.id}
							className="relative flex cursor-pointer items-center gap-4 before:absolute before:bottom-0 before:left-0 before:h-1 before:w-full before:rounded-tl-[4px] before:rounded-tr-[4px] before:bg-blue-500 before:opacity-0 before:scale-0 transition-all duration-300 focus:before:opacity-100 focus:before:scale-100"
						>
							<div className="flex items-center justify-center h-8 w-8 rounded-[50%] border">
								<span className="text-muted-foreground font-medium">
									0{i + 1}
								</span>
							</div>
							<p className="md:w-3/5 lg:w-auto text-sm font-medium xl:text-base">
								{item.title}
							</p>
						</TabsTrigger>
					))
				}
			</TabsList>

			{/* <!-- Tab Content  --> */}
			{
				featuresTabData.map((feature, key) => (
					<TabsContent value={feature.id} key={key}>

						<div className="flex items-center gap-8 lg:gap-19">
							<div className="md:w-1/2">
								<h2 className="mb-7 text-3xl font-bold">
									{feature.title}
								</h2>
								<p className="mb-5">{feature.desc1}</p>
								<p className="w-11/12">{feature.desc2}</p>
							</div>
							<div className="mx-auto hidden aspect-square rounded-lg max-w-[550px] md:block md:w-1/2">
								<img
									src={`https://api.dicebear.com/9.x/notionists/svg?seed=${feature.id}`}
									alt={feature.title}
									loading="lazy"
								/>
							</div>
						</div>
					</TabsContent>
				))
			}
		</Tabs>
	);
}

export default DemoSteps
