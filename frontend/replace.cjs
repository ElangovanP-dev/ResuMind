const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/elang/OneDrive/Desktop/ResuMind/frontend/src';

const replacements = {
  'text-white': 'text-slate-900',
  'text-slate-400': 'text-slate-600',
  'text-slate-300': 'text-slate-700',
  'text-slate-200': 'text-slate-800',
  'text-slate-500': 'text-slate-500',
  'bg-slate-800': 'bg-slate-100',
  'bg-slate-900': 'bg-slate-50',
  'border-slate-800': 'border-slate-200',
  'border-slate-700': 'border-slate-300',
  'bg-slate-950': 'bg-slate-100',
  'text-indigo-400': 'text-blue-600',
  'text-indigo-300': 'text-blue-700',
  'text-indigo-500': 'text-blue-600',
  'bg-indigo-500': 'bg-blue-600',
  'border-indigo-500': 'border-blue-600',
  'text-violet-400': 'text-blue-600',
  'text-violet-300': 'text-blue-700',
  'bg-violet-600': 'bg-blue-600',
  'bg-violet-500': 'bg-blue-600',
  'border-violet-500': 'border-blue-600',
  'bg-slate-500': 'bg-slate-300',
  'text-green-400': 'text-emerald-600',
  'text-green-300': 'text-emerald-700',
  'bg-green-500': 'bg-emerald-500',
  'border-green-500': 'border-emerald-500',
  'text-amber-400': 'text-amber-600',
  'text-amber-300': 'text-amber-700',
  'bg-amber-500': 'bg-amber-500',
  'border-amber-500': 'border-amber-500',
  'text-red-400': 'text-red-600',
  'text-red-300': 'text-red-700',
  'bg-red-500': 'bg-red-500',
  'border-red-500': 'border-red-500'
};

function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = content;
      
      for (const [oldClass, newClass] of Object.entries(replacements)) {
        const regex = new RegExp('(?<![a-zA-Z0-9-])' + oldClass + '(?![a-zA-Z0-9-])', 'g');
        modified = modified.replace(regex, newClass);
      }
      
      modified = modified.replace(/fill="white"/g, 'fill="#1E293B"');
      modified = modified.replace(/fill="rgba\(148,163,184,0.8\)"/g, 'fill="#64748B"'); // ScoreGauge ATS Score text

      if (content !== modified) {
        fs.writeFileSync(fullPath, modified);
        console.log('Updated: ' + fullPath);
      }
    }
  }
}

processDir(dir);
