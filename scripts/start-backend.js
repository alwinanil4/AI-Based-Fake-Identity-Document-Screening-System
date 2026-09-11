import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawn, execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'docshield-backend');
const PORT = parseInt(process.env.PORT || '5000', 10);

/**
 * Locate the real Python executable with Flask and requirements installed.
 */
function findWorkingPython() {
  const isWin = process.platform === 'win32';
  const candidates = [
    path.join(backendDir, '.venv', isWin ? 'Scripts/python.exe' : 'bin/python'),
    path.join(backendDir, 'venv', isWin ? 'Scripts/python.exe' : 'bin/python'),
    isWin ? 'python' : 'python3',
    'python',
    'py'
  ];

  for (const candidate of candidates) {
    try {
      if (path.isAbsolute(candidate) && !fs.existsSync(candidate)) {
        continue;
      }
      execSync(`"${candidate}" -c "import flask"`, {
        cwd: backendDir,
        stdio: 'ignore',
        timeout: 4000
      });
      return candidate;
    } catch {
      // Continue searching
    }
  }
  return null;
}

/**
 * Start the Python Flask backend
 */
function runPythonBackend(pythonPath) {
  console.log(`\x1b[35m[DocShield Backend]\x1b[0m Starting Python Flask backend using: ${pythonPath}`);
  console.log(`\x1b[35m[DocShield Backend]\x1b[0m Serving at http://localhost:${PORT}`);

  const child = spawn(pythonPath, ['wsgi.py'], {
    cwd: backendDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: String(PORT),
      FLASK_ENV: 'development',
      PYTHONUNBUFFERED: '1'
    }
  });

  child.on('error', (err) => {
    console.error(`\x1b[31m[DocShield Backend Error]\x1b[0m Failed to spawn Python process: ${err.message}`);
    process.exit(1);
  });

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.warn(`\x1b[33m[DocShield Backend]\x1b[0m Python backend exited with code ${code}.`);
      process.exit(code);
    }
  });

  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
}

const pythonBin = findWorkingPython();
if (pythonBin) {
  runPythonBackend(pythonBin);
} else {
  console.error(`\x1b[31m[DocShield Backend Error]\x1b[0m Could not locate a working Python environment in docshield-backend/.venv.`);
  console.error(`Please install dependencies: cd docshield-backend && .venv\\Scripts\\pip install -r requirements.txt`);
  process.exit(1);
}
