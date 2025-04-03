/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'primary': "#5f6FFF",
                'primary-dark': "#4c5ad9",
                'primary-light': "#e2e5ff",
                'primary-50': '#f0f2ff',
                'primary-100': '#e2e5ff',
                'primary-200': '#c9d8ff',
                'primary-500': '#5f6FFF',
                'primary-600': '#4c5ad9',
                'primary-700': '#3a47b3'
            },
            gridTemplateColumns: {
                'auto': 'repeat(auto-fill, minmax(200px, 1fr))'
            },
            boxShadow: {
                'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
                'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
            }
        },
    },
    plugins: [],
}