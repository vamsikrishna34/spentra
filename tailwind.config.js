import frontendConfig from "./frontend/tailwind.config.js";

export default {
  ...frontendConfig,
  content: ["./frontend/index.html", "./frontend/src/**/*.{js,ts,jsx,tsx}"],
};
