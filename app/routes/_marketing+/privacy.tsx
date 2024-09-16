import { json, LoaderFunction } from "@remix-run/node";
import { PRIVACY_POLICY } from "~/constants/index";
import { parse } from "marked";
import { Link, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/ui/button";

export const loader: LoaderFunction = async () => {
	const content = parse(PRIVACY_POLICY)
	return json({
		content
	})
}
export default function Privacy() {
	const { content } = useLoaderData<typeof loader>()

	return (
		<main className="flex-grow flex-1">
			<Button variant="link" className="mt-6">
				<Link to="/">Go Back</Link>
			</Button>
			<h1
				className="text-4xl my-6 text-primary text-center font-bold tracking-tight sm:text-6xl"
			>Privacy Policy</h1>
			<section
				className=" my-4 mx-auto prose max-w-[75ch] prose-sky lg:prose-lg"
				dangerouslySetInnerHTML={{ __html: content }}
			>
			</section></main>
	)
}