import * as fs from 'fs';

const publicDir = '../../public/site';

if (!fs.existsSync('dist')) {
  console.error('dist/ not found. Run "pnpm run build" first.');
  process.exit(1);
}

if (fs.existsSync(publicDir)) {
  fs.rmSync(publicDir, { recursive: true });
}

fs.cpSync('dist', publicDir, { recursive: true });

console.log(`Deployed dist/ → ${publicDir}`);
