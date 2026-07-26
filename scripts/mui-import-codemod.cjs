#!/usr/bin/env node
'use strict';

/**
 * Codemod: rewrite barrel imports from "@mui/material" and
 * "@mui/icons-material" into individual default-export subpath imports.
 *
 * Both Next.js's `modularizeImports` config and its built-in
 * `optimizePackageImports` list claim to do this automatically, but in
 * practice they miss a meaningful fraction of imports (silently — no error,
 * the barrel just still gets pulled in). Rewriting the import statements
 * themselves works regardless of bundler/toolchain.
 *
 * Usage:
 *   node scripts/mui-import-codemod.cjs <path-to-scan> [--dry-run]
 *
 * Only touches import declarations whose module specifier is EXACTLY
 * "@mui/material" or "@mui/icons-material" — existing subpath imports (e.g.
 * "@mui/material/styles") are left untouched.
 *
 * For each named import, it:
 *   1. Redirects known non-component exports (styled, createTheme, useTheme,
 *      alpha, Theme, ThemeOptions, ...) to "@mui/material/styles", since they
 *      don't have their own subpath.
 *   2. Otherwise checks on disk whether "<pkg>/<Name>" actually resolves; if
 *      so, emits `import Name from '<pkg>/<Name>'`.
 *   3. Anything that resolves to neither is left in a (shrunk) barrel import
 *      and reported at the end for manual review — the script never silently
 *      drops something it isn't sure about.
 *
 * Known limitation: comments written *inside* a rewritten import's braces are
 * not preserved (the replacement is regenerated from the AST, not the
 * original trivia). Rare in practice for import lists; review the diff.
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const PACKAGES = ['@mui/material', '@mui/icons-material'];

// Exports that live under @mui/material/styles rather than their own
// "@mui/material/<Name>" subpath. Extend this list if the "unresolved"
// report below turns up more of them.
const STYLES_REDIRECT = new Set([
  'styled',
  'createTheme',
  'useTheme',
  'useThemeProps',
  'alpha',
  'darken',
  'lighten',
  'emphasize',
  'adaptV4Theme',
  'StyledEngineProvider',
  'unstable_createMuiStrictModeTheme',
  'ThemeProvider',
  'Theme',
  'ThemeOptions',
  'CssVarsTheme',
  'CssVarsThemeOptions',
  'SxProps',
]);

function resolvesToSubpath(pkg, name, projectRoot) {
  if (pkg === '@mui/material') {
    return fs.existsSync(path.join(projectRoot, 'node_modules', '@mui', 'material', name, 'index.js'));
  }
  if (pkg === '@mui/icons-material') {
    return fs.existsSync(path.join(projectRoot, 'node_modules', '@mui', 'icons-material', `${name}.js`));
  }
  return false;
}

function processFile(filePath, projectRoot, dryRun, report) {
  const original = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    original,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const edits = [];

  for (const stmt of sourceFile.statements) {
    if (!ts.isImportDeclaration(stmt)) continue;
    if (!stmt.moduleSpecifier || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    const pkg = stmt.moduleSpecifier.text;
    if (!PACKAGES.includes(pkg)) continue;

    const clause = stmt.importClause;
    if (!clause) continue; // side-effect import; nothing to rewrite

    if (clause.name) {
      report.skipped.push({ file: filePath, reason: `default import of ${pkg}`, text: stmt.getText(sourceFile) });
      continue;
    }
    if (!clause.namedBindings || !ts.isNamedImports(clause.namedBindings)) {
      report.skipped.push({ file: filePath, reason: `namespace import of ${pkg}`, text: stmt.getText(sourceFile) });
      continue;
    }

    const clauseIsTypeOnly = clause.isTypeOnly === true;
    const resolvedLines = [];
    const leftoverByTarget = new Map();

    for (const spec of clause.namedBindings.elements) {
      const importedName = (spec.propertyName ?? spec.name).text;
      const localName = spec.name.text;
      const isTypeOnly = clauseIsTypeOnly || spec.isTypeOnly === true;
      const typePrefix = isTypeOnly ? 'type ' : '';
      const aliasPart = localName !== importedName ? ` as ${localName}` : '';

      if (pkg === '@mui/material' && STYLES_REDIRECT.has(importedName)) {
        const target = `${pkg}/styles`;
        if (!leftoverByTarget.has(target)) leftoverByTarget.set(target, []);
        leftoverByTarget.get(target).push(`${typePrefix}${importedName}${aliasPart}`);
        continue;
      }

      if (resolvesToSubpath(pkg, importedName, projectRoot)) {
        const subpath = `${pkg}/${importedName}`;
        resolvedLines.push(
          isTypeOnly ? `import type ${localName} from '${subpath}';` : `import ${localName} from '${subpath}';`
        );
      } else {
        if (!leftoverByTarget.has(pkg)) leftoverByTarget.set(pkg, []);
        leftoverByTarget.get(pkg).push(`${typePrefix}${importedName}${aliasPart}`);
        report.unresolved.push({ file: filePath, pkg, name: importedName });
      }
    }

    // Nothing to improve only if every specifier stayed in a leftover import
    // targeting the original bare package (i.e. genuinely unresolved).
    const improved = resolvedLines.length > 0 || [...leftoverByTarget.keys()].some((target) => target !== pkg);
    if (!improved) continue;

    const leftoverLines = [...leftoverByTarget.entries()].map(
      ([target, names]) => `import { ${names.join(', ')} } from '${target}';`
    );

    edits.push({
      start: stmt.getStart(sourceFile),
      end: stmt.getEnd(),
      replacement: [...resolvedLines, ...leftoverLines].join('\n'),
    });
  }

  if (edits.length === 0) return;

  edits.sort((a, b) => b.start - a.start);
  let updated = original;
  for (const e of edits) {
    updated = updated.slice(0, e.start) + e.replacement + updated.slice(e.end);
  }

  if (!dryRun) fs.writeFileSync(filePath, updated, 'utf8');
  report.filesChanged.push(filePath);
}

function walk(dir, exts, exclude) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (exclude.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full, exts, exclude));
    else if (exts.some((e) => entry.name.endsWith(e))) results.push(full);
  }
  return results;
}

function findProjectRoot(start) {
  let dir = start;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'node_modules'))) return dir;
    dir = path.dirname(dir);
  }
  return start;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const targetArg = args.find((a) => !a.startsWith('--'));
  if (!targetArg) {
    console.error('Usage: node mui-import-codemod.cjs <path-to-scan> [--dry-run]');
    process.exit(1);
  }

  const scanRoot = path.resolve(targetArg);
  const projectRoot = findProjectRoot(scanRoot);
  const files = walk(scanRoot, ['.ts', '.tsx'], new Set(['node_modules', '.git', 'build', 'dist', '.cache']));

  const report = { filesChanged: [], unresolved: [], skipped: [] };
  for (const file of files) processFile(file, projectRoot, dryRun, report);

  console.log(`\n${dryRun ? '[dry run] ' : ''}Rewrote imports in ${report.filesChanged.length} file(s).`);

  if (report.unresolved.length) {
    console.log(`\n${report.unresolved.length} name(s) didn't resolve to a subpath — left in a barrel import, review by hand:`);
    for (const u of report.unresolved) {
      console.log(`  ${u.pkg} -> ${u.name}  (${path.relative(scanRoot, u.file)})`);
    }
  }

  if (report.skipped.length) {
    console.log(`\n${report.skipped.length} import declaration(s) skipped (default/namespace import):`);
    for (const s of report.skipped) {
      console.log(`  ${path.relative(scanRoot, s.file)}: ${s.reason}\n    ${s.text}`);
    }
  }
}

main();
