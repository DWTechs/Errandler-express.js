const config =  {
  input: "build/es6/errandler-express.js",
  output: {
    name: "winstan",
    file: "build/errandler-express.mjs",
    format: "es"
  },
  external: [
    "@dwtechs/checkard", 
    "@dwtechs/winstan",
  ],
  plugins: []
};

export default config;
