'use strict';

import path = require('path');
import tl = require('azure-pipelines-task-lib/task');
import trm = require('azure-pipelines-task-lib/toolrunner');

function mkTempFile(): string {
  return '.tmp-command-rl-scanner.sh';
}

async function run() {
  try {
    tl.setResourcePath(path.join(__dirname, 'task.json'));
    //This only works on linux or MacOs Agents
    if (tl.getPlatform() === tl.Platform.Windows) {
      throw new Error('This task does not work on windows as it needs docker.');
    }

    // get input parameters MY_ARTIFACT_TO_SCAN, REPORT_PATH, BUILD_PATH
    const MY_ARTIFACT_TO_SCAN: string | undefined = tl.getInput(
      'MY_ARTIFACT_TO_SCAN',
      true
    );

    if (MY_ARTIFACT_TO_SCAN === undefined) {
      tl.setResult(
        tl.TaskResult.Failed,
        'You must specify a value for: MY_ARTIFACT_TO_SCAN'
      );
      return;
    }

    const REPORT_PATH: string | undefined = tl.getInput('REPORT_PATH', true);
    if (REPORT_PATH === undefined || REPORT_PATH === '') {
      tl.setResult(
        tl.TaskResult.Failed,
        'You must specify a value for: REPORT_PATH'
      );
      return;
    }

    const BUILD_PATH: string | undefined = tl.getInput('BUILD_PATH', true);
    if (BUILD_PATH === undefined || BUILD_PATH === '') {
      tl.setResult(
        tl.TaskResult.Failed,
        'You must specify a value for: BUILD_PATH'
      );
      return;
    }

    // Get RLSECURE_SITE_KEY environmental variable
    const RLSECURE_SITE_KEY: string | undefined =
      tl.getVariable('RLSECURE_SITE_KEY');
    if (RLSECURE_SITE_KEY === '' || RLSECURE_SITE_KEY === undefined) {
      throw new Error(
        'You must define the RLSECURE_SITE_KEY environmental variable.'
      );
    }

    // Get RLSECURE_ENCODED_LICENSE environmental variable
    const RLSECURE_ENCODED_LICENSE: string | undefined = tl.getVariable(
      'RLSECURE_ENCODED_LICENSE'
    );
    if (
      RLSECURE_ENCODED_LICENSE === '' ||
      RLSECURE_ENCODED_LICENSE === undefined
    ) {
      throw new Error(
        'You must define the RLSECURE_ENCODED_LICENSE environmental variable.'
      );
    }
    const fileName = mkTempFile();
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
  docker run --rm -u $(id -u):$(id -g) \
    -v "./${BUILD_PATH}:/packages:ro" -v "./${REPORT_PATH}:/report" \
    -e RLSECURE_ENCODED_LICENSE -e RLSECURE_SITE_KEY \
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
