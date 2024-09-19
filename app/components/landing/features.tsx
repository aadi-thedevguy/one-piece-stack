import {
    CheckCircledIcon,
    DashboardIcon,
    FileTextIcon,
    HeartFilledIcon,
    LayersIcon,
    LockClosedIcon,
    MixIcon,
    RocketIcon,
} from '@radix-ui/react-icons'

const FEATURES = [
    {
        name: 'Easy to use',
        description:
            "Fill in some environment variables, and you're off to shipping in minutes",
        icon: RocketIcon,
    },
    {
        name: 'Built for Remix',
        description:
            "Leverage Remix's features to build modern web apps with great UX",
        icon: HeartFilledIcon,
    },
    {
        name: 'Authentication',
        description: 'Magic links and Google & Twitter oAuth out-of-the-box',
        icon: LockClosedIcon,
    },
    {
        name: 'Written In TypeScript',
        description: 'Build your app with typesafety from the very start',
        icon: CheckCircledIcon,
    },
    {
        name: 'Third-party Integrations',
        description: 'Pre-configured emails, analytics, error tracking',
        icon: MixIcon,
    },
    {
        name: 'Components',
        description: 'UI components built using Radix UI and TailwindCSS',
        icon: LayersIcon,
    },
    {
        name: 'Docs (Coming Soon)',
        description: 'Full-featured documentation site with MDX',
        icon: FileTextIcon,
    },
    {
        name: 'Payments (Coming Soon)',
        description: 'Billing and subscriptions using LemonSqueezy',
        icon: DashboardIcon,
    },
]

function Features() {
    return (
        <div className='py-24 sm:py-32'>
            <div className='mx-auto max-w-7xl px-6 lg:px-8'>
                <div className='mx-auto max-w-2xl lg:text-center'>
                    <h2 className='text-secondary-foreground text-base font-semibold leading-7'>
                        Build apps faster
                    </h2>
                    <p className='mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-tight'>
                        Everything you need to build Remix-powered web apps
                    </p>
                </div>
                <div className='mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-5xl'>
                    <dl className='grid max-w-xl grid-cols-2 gap-y-10 gap-x-8 lg:max-w-none lg:grid-cols-2 lg:gap-y-16'>
                        {FEATURES.map((feature) => (
                            <div key={feature.name} className='relative pl-16'>
                                <dt className='text-base font-semibold leading-7 text-gray-900 dark:text-gray-100'>
                                    <div className='bg-primary absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-lg'>
                                        <feature.icon
                                            className='h-5 w-5 text-primary-foreground'
                                            aria-hidden='true'
                                        />
                                    </div>
                                    {feature.name}
                                </dt>
                                <dd className='mt-2 text-base leading-7 text-gray-600 dark:text-gray-300'>
                                    {feature.description}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </div>
    )
}

export default Features
