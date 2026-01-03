# Gemini Conversation Context

This file contains rules and context for our conversations.

## Coding Style Rules

1.  **Direct Exports:** Export functions directly from files rather than exporting a single object containing them.
2.  **Optional Chaining:** Use optional chaining (`?.`) wherever it can simplify the code and prevent null/undefined errors.
3.  **Tailwind CSS Variables:** When using Tailwind CSS, prefer variables defined in the project's `.css` files over generic utility classes (e.g., use a semantic variable like `bg-primary` instead of `bg-green-500`).
