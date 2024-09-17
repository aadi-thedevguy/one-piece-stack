# One Piece Stack
Production Ready SAAS Starter Kit with emphasis on Security and Scale so YOU can focus on your product and customers
(inspired by Epic Stack)

## What's in the box (well, stack)

-   Built with/for [Remix](https://remix.run)
-    Written in [TypeScript](https://typescriptlang.org)
-   Primary Database of Choice - [MongoDB](https://mongodb.com)
-   Secondary Database(optional) - [Redis](https://redis.io)
-   ORM - [Prisma](https://prisma.io)
-   Send Transactional emails with [Nodemailer](https://nodemailer.com/) 
-   Styling with [TailwindCSS](https://tailwindcss.com)
-   Component Library - [ShadCN UI](https://ui.shadcn.com/)
-  Deploys anywhere with [Docker](https://docker.com)
-  Code formatting and linting with Eslint and Prettier


## Features
-  Custom-built email/Password Authentication with Email OTP and OAuth with Google/Twitter Providers
-    Health check API route
-   Dark Mode Support
-   CSRF Protection and Honeypot
-   Caching and Rate-Limiting


## Upcoming Tech in the Stack
-   Upload Files to [S3](https://aws.amazon.com/s3/)
-   Error Tracking with [Sentry](https://sentry.io)
-   Analytics - [Posthog](https://posthog.com)
-   Billing and Subscriptions using an international Payment provider(optional) (e.g. Stripe)
-   Customizable Copy Writing Components for Landing Page along with navbar and footer with contact links.
-   Easily Customizable Privacy Policy, Terms of Service, Cookie Policy
-   Domain, DDOS Protection and CDN with [Cloudflare](https://www.cloudflare.com/) 

## Development

Clone this Repo

```sh
git clone https://github.com/aadi-thedevguy/one-piece-stack
```

Install dependencies:

```sh
pnpm i
```

Replace .env.example with .env and fill in the values and fill in the keys.

Start Local Database:

```sh
docker-compose up -d
```

Seed Database and Generate Prisma Client Types:

```sh
pnpm run gen-types
pnpm prisma db seed
```

Start dev server:

```sh
pnpm dev
```

## Deployment

This Remix Stack handles automatically deploying your app to production and staging environments on Railway.

All you have to do is to create a project on Railway and choose your repo. Railway handles setting up CI/CD.

### Type Checking

This project uses TypeScript. It's recommended to get TypeScript set up for your editor to get a really great in-editor experience with type checking and auto-complete. To run type checking across the whole project, run `pnpm typecheck`.

### Linting

This project uses ESLint for linting. That is configured in `.eslintrc.js`.

### Formatting

We use [Prettier](https://prettier.io/) for auto-formatting in this project. It's recommended to install an editor plugin (like the [VSCode Prettier plugin](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) to get auto-formatting on save. There's also a `pnpm format` script you can run to format all files in the project.

<hr />

## Copy Writing Components

[x] Call to Action
[] Why this
[] Demo steps
[] Value Prop
[] FAQ
[] Testimonials
[] Review Circles
[] Pricing

## Guidelines for Copy Writing

-   **CTA**: Every Call to action should be a card-like component consisting of:

    1. A strong Subject line to grab the user's attention
    1. Subtitle to explain the benefits of using the product
    1. Button text which sparks powerful emotion, like "join 1000s of people", "save money" etc.
    1. A socially relevant "lovedBy" number which shows how many people love the product, it can be GitHub stars, testimonials, Twitter replies etc.
    1. A link to the product's dashboard page

-   **Why this:** Why would the customer want to use this product? -

    1. It should explain that the problem is real and people can pay for the solution
    2. It should compare what the currently available solutions aren't solving for and what your product does better than the competition
    3. The component can be two lists of problems and solutions Or a single-line bulleted list featuring the best of the product

-   **Demo steps:** Give interactive Definition list type components so that when a user clicks on a step, it expands and shows the next step while side by side it shows the UI of the app navigation structure so he knows if he clicks on "generate invoice", he will see the UI of the invoice generation page

-   **Value Prop:** What is the value proposition of the product?

    1. A Visual Interactive image-type component which shows the problem and solution in linked cards
    1. Give screenshots of people's tweets, Reddit posts, other forums, or blog articles on how a certain problem is expensive and a solution is needed.

-   **FAQ:** must be a details component consisting of a question and an answer.

-   **Testimonials:** What are the customers saying about the product?

    1. There must be a card component consisting of a user's name, image, a quote, and a link to the user's profile. It should ideally be a very creative-looking format like a blockquote style.

-   **Pricing:**
    1. There Should be two to three cards, one should be popular and highlighted, and all should list the features provided and features missing out, so the user would want to update the plan
    1. all prices should be written beside a struck-out price so it feels like the user is getting a discount.
    1. Price accordingly if the product is a _Vitamin_ or _Painkiller_

## Some other copyrighting advice

1. **NO Free Plans:** Only give free credits or 7-day trials
1. **NO Fancy animations maybe Dark mode:** If not necessary, don't ship, minimal is best
1. **MUST HAVE:** International payment reception, Privacy Policy, Terms of Service, and Contact Us Pages.
