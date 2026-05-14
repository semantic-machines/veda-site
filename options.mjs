export default {
  entryPoints: ['src/js/index.js'],
  bundle: true,
  format: 'esm',
  outdir: 'dist',
  loader: {
    '.md': 'text',
    '.ttl': 'text',
  },
  external: [],
};
