import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index', 'src/export', 'src/compile'],
  clean: true,
  declaration: 'node16',
  rollup: {
    emitCJS: false,
    inlineDependencies: true,
    esbuild: {
      minify: true,
    },
  },
})
