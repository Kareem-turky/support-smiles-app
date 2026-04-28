import * as fs from 'fs';
import * as path from 'path';

const BACKEND_DIR = path.join(__dirname, '../backend/src');
const FRONTEND_DIR = path.join(__dirname, '../src');

function auditBackend() {
  console.log('--- Backend Audit ---');
  const controllers = findFiles(BACKEND_DIR, '.controller.ts');
  controllers.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const controllerMatch = content.match(/@Controller\(['"]([^'"]+)['"]\)/);
    const basePath = controllerMatch ? controllerMatch[1] : '';
    
    const routes = content.match(/@(?:Get|Post|Put|Delete|Patch)\(['"]?([^'"]*)['"]?\)/g);
    if (routes) {
      routes.forEach(route => {
        console.log(`Route: ${basePath}/${route.replace(/@\w+\(['"]?([^'"]*)['"]?\)/, '$1')}`);
      });
    }
  });
}

function findFiles(dir: string, ext: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(file, ext));
    } else if (file.endsWith(ext)) {
      results.push(file);
    }
  });
  return results;
}

console.log('Permission Audit Tool');
auditBackend();
// Frontend audit logic would go here, simplifying for this version
