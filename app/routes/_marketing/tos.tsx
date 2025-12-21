import { parse } from "marked";
import { data, useLoaderData } from "react-router";
import { TERMS_OF_SERVICE } from "~/constants/index";

export const loader = async () => {
  const content = parse(TERMS_OF_SERVICE);
  return data({
    content,
  });
};
export default function TOS() {
  const { content } = useLoaderData<typeof loader>();

  return (
    <main className="flex-1 grow">
      <h1 className="my-6 text-center font-bold text-4xl text-primary tracking-tight sm:text-6xl">
        Terms of Service
      </h1>
      <section
        className="prose prose-sky lg:prose-lg mx-auto my-4 max-w-[75ch]"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </main>
  );
}
