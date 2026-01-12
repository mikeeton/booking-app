# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

## Styling & Accessibility improvements

I made a number of styling and accessibility improvements to the admin UI:

- Centralized theme variables in `src/index.css` and polished `src/components/ui/ui.css`.
- Improved layout, spacing, and cards (`src/layouts/adminLayout.css`, `src/components/ui/ui.css`).
- Table responsiveness and stacked view for small screens (`.uiTable` mobile rules).
- Modal animation, overlay blur, reduced-motion support, focus-visible outlines, and screen-reader helpers (`.sr-only`).
- Added ARIA labels and roles to key interactive controls and added a skip link.
- Added `react-axe` as a dev dependency to run in development for automated accessibility checks.

How to test locally:

1. Install new dev deps: `npm install` (this will install `react-axe`).
2. Start the dev server: `npm run dev` (if PowerShell blocks npm run use `Set-ExecutionPolicy RemoteSigned` as admin).
3. Open the Admin pages and test responsiveness. With `react-axe` installed and the dev server running, violations will be shown in the browser console.

If you want, I can keep iterating on specific pages (Dashboard, Book page mobile layout, etc.) — tell me which page you'd like next.
