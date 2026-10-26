const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    // Tailwind v4 wraps all styles in @layer, which older Android browsers
    // (Chrome < 99, older in-app browsers) ignore, leaving the site unstyled.
    // This rewrites the layers into plain CSS with the same priority order.
    "@csstools/postcss-cascade-layers": {},
  },
};

export default config;
