/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..'),
);
const packagePath = path.join(projectRoot, 'packages', 'vscode-ide-companion');
const noticeFilePath = path.join(packagePath, 'NOTICES.txt');

async function getDependencyLicense(depName, depVersion) {
  let depPackageJsonPath;
  let licenseContent = 'License text not found.';
  let repositoryUrl = 'No repository found';

  try {
    depPackageJsonPath = path.join(
      projectRoot,
      'node_modules',
      depName,
      'package.json',
    );
    if (!(await fs.stat(depPackageJsonPath).catch(() => false))) {
      depPackageJsonPath = path.join(
        packagePath,
        'node_modules',
        depName,
        'package.json',
      );
    }

    const depPackageJsonContent = await fs.readFile(
      depPackageJsonPath,
      'utf-8',
    );
    const depPackageJson = JSON.parse(depPackageJsonContent);

    repositoryUrl = depPackageJson.repository?.url || repositoryUrl;

    const packageDir = path.dirname(depPackageJsonPath);
    const licenseFileCandidates = [
      depPackageJson.licenseFile,
      'LICENSE',
      'LICENSE.md',
      'LICENSE.txt',
      'LICENSE-MIT.txt',
      'license.md',
      'license',
    ].filter(Boolean);

    let licenseFile;
    for (const candidate of licenseFileCandidates) {
      const potentialFile = path.join(packageDir, candidate);
      if (await fs.stat(potentialFile).catch(() => false)) {
        licenseFile = potentialFile;
        break;
      }
    }

    if (licenseFile) {
      try {
        licenseContent = await fs.readFile(licenseFile, 'utf-8');
      } catch (e) {
        console.warn(
          `Warning: Failed to read license file for ${depName}: ${e.message}`,
        );
      }
    } else {
      console.warn(`Warning: Could not find license file for ${depName}`);
    }
  } catch (e) {
    console.warn(
      `Warning: Could not find package.json for ${depName}: ${e.message}`,
    );
  }

  return {
    name: depName,
    version: depVersion,
    repository: repositoryUrl,
    license: licenseContent,
  };
}

function collectDependencies(packageName, packageLock, dependenciesMap) {
  if (dependenciesMap.has(packageName)) {
    return;
  }

  const packageInfo = packageLock.packages[`node_modules/${packageName}`];
  if (!packageInfo) {
    console.warn(
      `Warning: Could not find package info for ${packageName} in package-lock.json.`,
    );
    return;
  }

  dependenciesMap.set(packageName, packageInfo.version);

  if (packageInfo.dependencies) {
    for (const depName of Object.keys(packageInfo.dependencies)) {
      collectDependencies(depName, packageLock, dependenciesMap);
    }
  }
}

async function resolveInstalledPackageJsonPath(depName) {
  const candidates = [
    path.join(projectRoot, 'node_modules', depName, 'package.json'),
    path.join(packagePath, 'node_modules', depName, 'package.json'),
  ];
  for (const candidate of candidates) {
    if (await fs.stat(candidate).catch(() => false)) {
      return candidate;
    }
  }
  return null;
}

/**
 * When package-lock.json is absent (e.g. archive without lockfile), collect
 * dependency names and versions from the installed tree under node_modules.
 */
async function collectDependenciesFromInstall(depName, dependenciesMap) {
  if (dependenciesMap.has(depName)) {
    return;
  }

  const pkgJsonPath = await resolveInstalledPackageJsonPath(depName);
  if (!pkgJsonPath) {
    console.warn(
      `Warning: Could not resolve ${depName} under node_modules (no package-lock.json fallback).`,
    );
    return;
  }

  let pkg;
  try {
    pkg = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'));
  } catch (e) {
    console.warn(
      `Warning: Could not read package.json for ${depName}: ${e.message}`,
    );
    return;
  }

  const version = typeof pkg.version === 'string' ? pkg.version : '0.0.0';
  dependenciesMap.set(depName, version);

  const childDeps = pkg.dependencies ?? {};
  for (const childName of Object.keys(childDeps)) {
    await collectDependenciesFromInstall(childName, dependenciesMap);
  }
}

async function main() {
  try {
    const packageJsonPath = path.join(packagePath, 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    const packageLockJsonPath = path.join(projectRoot, 'package-lock.json');
    const allDependencies = new Map();
    const directDependencies = Object.keys(packageJson.dependencies);

    let usedLockfile = false;
    try {
      const packageLockJsonContent = await fs.readFile(
        packageLockJsonPath,
        'utf-8',
      );
      const packageLockJson = JSON.parse(packageLockJsonContent);
      if (
        packageLockJson.packages &&
        typeof packageLockJson.packages === 'object'
      ) {
        usedLockfile = true;
        for (const depName of directDependencies) {
          collectDependencies(depName, packageLockJson, allDependencies);
        }
      } else {
        console.warn(
          'Warning: package-lock.json has no `packages` field; generating NOTICES from node_modules.',
        );
        for (const depName of directDependencies) {
          await collectDependenciesFromInstall(depName, allDependencies);
        }
      }
    } catch (e) {
      if (e && e.code !== 'ENOENT') {
        throw e;
      }
      console.warn(
        'Warning: No root package-lock.json; generating NOTICES from installed node_modules.',
      );
      for (const depName of directDependencies) {
        await collectDependenciesFromInstall(depName, allDependencies);
      }
    }

    if (
      usedLockfile &&
      allDependencies.size === 0 &&
      directDependencies.length > 0
    ) {
      console.warn(
        'Warning: package-lock.json produced no dependencies; falling back to node_modules.',
      );
      for (const depName of directDependencies) {
        await collectDependenciesFromInstall(depName, allDependencies);
      }
    }

    const dependencyEntries = Array.from(allDependencies.entries());

    const licensePromises = dependencyEntries.map(([depName, depVersion]) =>
      getDependencyLicense(depName, depVersion),
    );

    const dependencyLicenses = await Promise.all(licensePromises);

    let noticeText =
      'This file contains third-party software notices and license terms.\n\n';

    for (const dep of dependencyLicenses) {
      noticeText +=
        '============================================================\n';
      noticeText += `${dep.name}@${dep.version}\n`;
      noticeText += `(${dep.repository})\n\n`;
      noticeText += `${dep.license}\n\n`;
    }

    await fs.writeFile(noticeFilePath, noticeText);
    console.log(`NOTICES.txt generated at ${noticeFilePath}`);
  } catch (error) {
    console.error('Error generating NOTICES.txt:', error);
    process.exit(1);
  }
}

main().catch(console.error);
