import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/cli'],
  clean: false,
  declaration: 'node16',
  rollup: {
    emitCJS: false,
    inlineDependencies: true,
    esbuild: {
      minify: true,
    },
  },
})
