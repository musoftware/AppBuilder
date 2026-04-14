#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Skill validation script — verifies that all referenced skills in queue
 * builders actually have SKILL.md files and required sections.
 *
 * Usage:
 *   node scripts/validate-skills.js
 *
 * Exit code 0 = all valid, 1 = errors found.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(join(__dirname, '..'));

// ─── Configuration ───────────────────────────────────────────────────────────

const SKILL_LOCATIONS = [
  join(projectRoot, 'packages', 'autopilot', 'project-brain-skills'),
  join(projectRoot, '.qwen', 'skills'),
  join(projectRoot, 'packages', 'autopilot', 'src', 'bundled-skills'),
];

/**
 * Skills that generate reports must have these sections.
 * Playbook-style skills (instructions only) don't need them.
 */
const REPORT_GENERATING_SKILLS = [
  'understand',
  'audit-backend',
  'audit-frontend',
  'audit-roles',
  'audit-database',
  'review-implementation',
  'refine',
  'harden',
  'test-unit',
  'test-integration',
  'test-e2e',
  'test-fix',
  'review-as-user',
  'review-as-security',
  'review-as-a11y',
  'review-as-mobile',
  'review-as-slow-network',
  'review-as-developer',
  'review-as-performance',
  'review-as-qa',
  'review-as-pm',
  'review-as-data',
  'prod-gate',
  'report',
];

const REQUIRED_SECTIONS = ['SUMMARY', 'FINDINGS', 'STATE', 'NEXT_SKILLS'];

const OPTIONAL_FRONTMATTER = ['name', 'description'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Collect all skill names from all known locations. */
function collectAllSkills() {
  const result = new Map();

  for (const location of SKILL_LOCATIONS) {
    if (!existsSync(location)) continue;

    try {
      const names = readdirSync(location, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

      for (const name of names) {
        const skillPath = join(location, name, 'SKILL.md');
        if (existsSync(skillPath)) {
          if (!result.has(name)) {
            result.set(name, []);
          }
          const arr = result.get(name);
          if (arr) arr.push(skillPath);
        }
      }
    } catch {
      // ignore
    }
  }

  return result;
}

/** Check that a SKILL.md file has the required sections. */
function validateSkillSections(filePath, skillName) {
  const errors = [];
  const needsSections = REPORT_GENERATING_SKILLS.includes(skillName);

  try {
    const content = readFileSync(filePath, 'utf8');

    if (!content.startsWith('---')) {
      errors.push('Missing YAML frontmatter (--- at start)');
    } else {
      for (const field of OPTIONAL_FRONTMATTER) {
        if (!content.includes(`${field}:`)) {
          errors.push(`Missing frontmatter field: ${field}`);
        }
      }
    }

    if (needsSections) {
      for (const section of REQUIRED_SECTIONS) {
        const re = new RegExp(`^${section}:`, 'im');
        if (!re.test(content)) {
          errors.push(`Missing required section: ${section}`);
        }
      }
    }
  } catch (e) {
    errors.push(`Cannot read file: ${e.message}`);
  }

  return errors;
}

/**
 * Extract skill names referenced from prodQueue.ts PROJECT_BRAIN_SKILL_ORDER.
 */
function getReferencedSkills() {
  return [
    'understand',
    'scaffold',
    'database-design',
    'api-design',
    'auth-setup',
    'audit-backend',
    'audit-frontend',
    'audit-roles',
    'audit-database',
    'plan',
    'build',
    'review-implementation',
    'refine',
    'harden',
    'test-unit',
    'test-integration',
    'test-e2e',
    'test-fix',
    'review-as-user',
    'review-as-security',
    'review-as-a11y',
    'review-as-mobile',
    'review-as-slow-network',
    'review-as-developer',
    'review-as-performance',
    'review-as-qa',
    'review-as-pm',
    'review-as-data',
    'deployment-config',
    'prod-gate',
  ];
}

// ─── Skill Dependencies ──────────────────────────────────────────────────────

const SKILL_DEPENDENCIES = {
  'test-fix': ['test-unit', 'test-integration', 'test-e2e'],
  'review-implementation': ['build'],
  refine: ['build'],
  harden: ['build', 'review-implementation'],
  'prod-gate': ['harden', 'test-fix'],
  'deployment-config': ['harden', 'test-fix'],
};

function validateSkillDependencies(referencedSkills) {
  const warnings = [];
  const skillSet = new Set(referencedSkills);

  for (const [skill, deps] of Object.entries(SKILL_DEPENDENCIES)) {
    if (!skillSet.has(skill)) continue;

    for (const dep of deps) {
      if (!skillSet.has(dep)) {
        warnings.push(
          `⚠️  ${skill} depends on ${dep}, but ${dep} is not in the skill list`,
        );
      }
    }
  }

  return warnings;
}

// ─── Main validation ─────────────────────────────────────────────────────────

function main() {
  console.log('🔍 Validating skills...\n');

  const allSkills = collectAllSkills();
  const referencedSkills = getReferencedSkills();
  let hasErrors = false;

  // 1. Check that all referenced skills exist
  console.log('1️⃣  Checking referenced skills exist...');
  const missingSkills = [];
  for (const name of referencedSkills) {
    if (!allSkills.has(name)) {
      missingSkills.push(name);
    }
  }

  if (missingSkills.length > 0) {
    console.error(`   ❌ Missing skills: ${missingSkills.join(', ')}`);
    hasErrors = true;
  } else {
    console.log(`   ✅ All ${referencedSkills.length} referenced skills found`);
  }

  // 2. Validate skill file structure
  console.log('\n2️⃣  Validating skill file structure...');
  let validCount = 0;
  let invalidCount = 0;

  for (const [name, paths] of allSkills) {
    for (const filePath of paths) {
      const errors = validateSkillSections(filePath, name);
      if (errors.length > 0) {
        console.error(`   ❌ ${name} (${filePath}):`);
        for (const err of errors) {
          console.error(`      - ${err}`);
        }
        invalidCount++;
        hasErrors = true;
      } else {
        validCount++;
      }
    }
  }

  if (invalidCount === 0) {
    console.log(`   ✅ All ${validCount} skill files valid`);
  } else {
    console.error(`   ⚠️  ${validCount} valid, ${invalidCount} invalid`);
  }

  // 3. Check for skills without references (potential orphans)
  console.log('\n3️⃣  Checking for unreferenced skills (info only)...');
  const unreferenced = [];
  for (const name of allSkills.keys()) {
    if (!referencedSkills.includes(name)) {
      unreferenced.push(name);
    }
  }

  if (unreferenced.length > 0) {
    console.log(
      `   ℹ️  Unreferenced skills (may be custom): ${unreferenced.join(', ')}`,
    );
  } else {
    console.log('   ✅ All skills are referenced');
  }

  // 4. Validate skill dependencies
  console.log('\n4️⃣  Validating skill dependencies...');
  const depWarnings = validateSkillDependencies(referencedSkills);
  if (depWarnings.length > 0) {
    for (const w of depWarnings) {
      console.log(`   ${w}`);
    }
  } else {
    console.log('   ✅ All dependencies satisfied');
  }

  // 5. Summary
  console.log('\n' + '='.repeat(60));
  if (hasErrors) {
    console.error('❌ Validation failed — fix errors above');
    return 1;
  } else {
    console.log(`✅ All skills valid (${allSkills.size} unique skills found)`);
    return 0;
  }
}

main();
