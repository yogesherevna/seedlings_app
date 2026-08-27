const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'assets', 'products');
const files = fs.readdirSync(dir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

const lines = [
  "import { ImageSourcePropType } from 'react-native';",
  "",
  "export const productImages: Record<string, ImageSourcePropType> = {"
];

for (const file of files) {
  const safe = file.replace(/'/g, "\\'");
  lines.push(`  '${safe}': require('../assets/products/${safe}'),`);
}

lines.push("};", "");
fs.writeFileSync(path.join(process.cwd(), 'data', 'imageMap.ts'), lines.join('\n'));
console.log(`Generated image map for ${files.length} local images.`);
