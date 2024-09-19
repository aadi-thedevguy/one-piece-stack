const SectionTitle = ({
    subtitle,
    title,
    highlighted,
    paragraph,
    width = "635px",
    center,
}: {
    subtitle?: string;
    title: string;
    highlighted: string;
    paragraph?: string;
    width?: string;
    center?: boolean;
}) => {
    return (
        <div className="-mx-4 flex flex-wrap">
            <div
                className={`w-full px-4 ${center ? "mx-auto text-center" : ""
                    }`}
                style={{ maxWidth: width }}
            >
                {subtitle &&
                    <span className="font-lg uppercase">
                        {subtitle}
                    </span>
                }
                <h2 className="relative isolate mb-6 text-4xl font-bold italic">
                    {title}
                    <span className="relative ml-1 inline-block before:absolute before:-bottom-0.5 before:left-0 before:-z-10 before:h-3 before:w-full before:bg-yellow-100 dark:before:bg-yellow-700">
                        {highlighted}
                    </span>
                </h2>
                {
                    paragraph && (
                        <p className="text-base leading-relaxed text-accent-foreground sm:leading-relaxed">
                            {paragraph}
                        </p>)
                }
            </div>
        </div>
    );
};

export default SectionTitle;
