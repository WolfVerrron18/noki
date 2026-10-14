// Сборка сервера в один файл: свой код, общий код фронта (@/) и зависимости.
// PGlite — только для разработки и тестов, в сборку не попадает.
import { build } from 'esbuild'

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/server.mjs',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  sourcemap: true,
  external: ['@electric-sql/pglite', '@electric-sql/pglite/*'],
  // CJS-зависимости (dayjs) внутри ESM-сборки зовут require
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
})
