import { json, LoaderFunction } from "@remix-run/node";
import { TERMS_OF_SERVICE } from "~/constants/index";
import { parse } from "marked";
import { useLoaderData } from "@remix-run/react";

export const loader: LoaderFunction = async () => {
	const content = parse(TERMS_OF_SERVICE)
	return json({
		content
	})
}
export default function TOS() {
	const { content } = useLoaderData<typeof loader>()

	return (
		<main className="flex-grow flex-1">
			<h1
				className="text-4xl my-6 text-primary text-center font-bold tracking-tight sm:text-6xl"
			>Terms of Service</h1>
			<section
				className=" my-4 mx-auto prose max-w-[75ch] prose-sky lg:prose-lg"
				dangerouslySetInnerHTML={{ __html: content }}
			>
			</section></main>
	)
}