'use strict';

import path = require('path');
import tl = require('azure-pipelines-task-lib/task');
import trm = require('azure-pipelines-task-lib/toolrunner');

function mkTempFile(): string {
  return '.tmp-command-rl-scanner.sh';
}

function getInput(what: string): string | undefined {
  const value: string | undefined = tl.getInput(what, true);
  if (value === undefined || value.length === 0) {
    tl.setResult(tl.TaskResult.Failed, `You must specify a value for: ${what}`);
    return undefined;
  }
  // force error on suspicious characters
  for (const ch of '<>|`$;&') {
    if (value.indexOf(ch) !== -1) {
      tl.setResult(
        tl.TaskResult.Failed,
        `the value of ${what} contains a forbidden character: ${ch}`
      );
      return undefined;
    }
  }
  return value;
}

function getVariable(what: string): string {
  const value: string | undefined = tl.getVariable(what);
  if (value === undefined || value.length === 0) {
    throw new Error(`You must define the ${what} environmental variable.`);
  }
  return value;
}

async function run() {
  try {
    tl.setResourcePath(path.join(__dirname, 'task.json'));
    //This only works on linux or MacOs Agents
    if (tl.getPlatform() === tl.Platform.Windows) {
      throw new Error('This task does not work on windows as it needs docker.');
    }

    // get input parameters MY_ARTIFACT_TO_SCAN, REPORT_PATH, BUILD_PATH
    // and clean possible insecure chars ;<>|&`$ or fail if present
    const MY_ARTIFACT_TO_SCAN: string | undefined = getInput(
      'MY_ARTIFACT_TO_SCAN'
    );
    if (MY_ARTIFACT_TO_SCAN === undefined) {
      return;
    }

    const REPORT_PATH: string | undefined = getInput('REPORT_PATH');
    if (REPORT_PATH === undefined) {
      return;
    }

    const BUILD_PATH: string | undefined = getInput('BUILD_PATH');
    if (BUILD_PATH === undefined) {
      return;
    }

    // verify env vars: RLSECURE_SITE_KEY, RLSECURE_ENCODED_LICENSE
    // we actually never use the value returned
    getVariable('RLSECURE_SITE_KEY');
    getVariable('RLSECURE_ENCODED_LICENSE');

    const fileName = mkTempFile();

    // You can directly embed JavaScript expressions within them using the ${expression} syntax.
    const command = `#! /usr/bin/env bash
prep_report_dir()
{
  if [ -d "./${REPORT_PATH}" ]
  then
    rmdir "./${REPORT_PATH}"
  fi
  mkdir -p "./${REPORT_PATH}"  # make sure it is not created by docker
}
main()
{
  prep_report_dir
  # no purl and no rl-store needed here
  docker run --rm -u $(id -u):$(id -g) \
    -v "./${BUILD_PATH}:/packages:ro" \
    -v "./${REPORT_PATH}:/report" \
    -e RLSECURE_ENCODED_LICENSE \
    -e RLSECURE_SITE_KEY \
    reversinglabs/rl-scanner:latest \
      rl-scan \
        --package-path=/packages/${MY_ARTIFACT_TO_SCAN} \
        --report-path=/report \
        --report-format=all --pack-safe
}
main`;
    console.log('# todo: bash: ', command);
    tl.writeFile(`${fileName}`, command);
    await testBash(`${fileName}`);
  } catch (err) {
    if (err instanceof Error) {
      tl.setResult(tl.TaskResult.Failed, err.message);
    } else {
      console.log('Unexpected error', err);
    }
    return;
  }
}

async function testBash(command: string): Promise<void> {
  try {
    const bash: trm.ToolRunner = tl.tool(tl.which('bash', true));
    bash.arg(command);
    await bash.exec();
    return tl.setResult(tl.TaskResult.Succeeded, 'Bash');
  } catch (err) {
    if (err instanceof Error) {
      tl.setResult(tl.TaskResult.Failed, err.message);
    } else {
      console.log('Unexpected error', err);
    }
  }
}

run();
