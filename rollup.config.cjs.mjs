import resolve from "@rollup/plugin-node-resolve";

const config =  {
  input: "build/es6/errandler-express.js",
  output: {
    name: "winstan",
    file: "build/errandler-express.cjs.js",
    format: "cjs"
  },
  external: [
  ],
  plugins: [
    resolve({
      mainFields: ['module', 'main']
    }),
  ]
};

export default config;