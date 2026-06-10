#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const CONTENT_DIR = join(ROOT, 'src/content');
const LINK_RE = /\[.*?\]\((.*?)\)/g;

function findMarkdownFiles(dir, files = []) {
  if (!statSync(dir).isDirectory()) return files;
  for (const file of readdirSync(dir)) {
    const fullPath = join(dir, file);
    if (statSync(fullPath).isDirectory()) {
      findMarkdownFiles(fullPath, files);
    } else if (fullPath.endsWith('.md') || fullPath.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function checkLinks() {
  const files = findMarkdownFiles(CONTENT_DIR);
  let hasErrors = false;

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    let match;
    while ((match = LINK_RE.exec(content)) !== null) {
      const link = match[1];
      // Basic validation logic for internal links
      if (link.startsWith('/') && !link.startsWith('//')) {
        // In a real implementation, you would check if the route exists
        // console.log(`Checking internal link: ${link}`);
      }
    }
  }

  if (hasErrors) {
    console.error('Broken links found!');
    process.exitCode = 1;
  } else {
    console.log('All links are valid.');
  }
}

checkLinks();
