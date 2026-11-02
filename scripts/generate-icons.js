import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pyScript = path.join(__dirname, 'generate-icons.py');

try {
  execSync(`python3 "${pyScript}"`, { stdio: 'inherit' });
} catch (err) {
  console.error('Failed to run python icon generator:', err);
  process.exit(1);
}
