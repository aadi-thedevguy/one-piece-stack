import { parse } from "marked";
import { data, Link, useLoaderData } from "react-router";
import { Button } from "~/components/ui/button";
import { PRIVACY_POLICY } from "~/constants/index";

export const loader = async () => {
  const content = parse(PRIVACY_POLICY);
  return data({
    content,
  });
};
export default function Privacy() {
  const { content } = useLoaderData<typeof loader>();

  return (
    <main className="flex-1 grow">
      <Button className="mt-6" variant="link">
        <Link to="/">Go Back</Link>
      </Button>
      <h1 className="my-6 text-center font-bold text-4xl text-primary tracking-tight sm:text-6xl">
        Privacy Policy
      </h1>
      <section
        className="prose prose-sky lg:prose-lg mx-auto my-4 max-w-[75ch]"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </main>
  );
}
