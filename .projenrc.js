const child = require('child_process');
const path = require('path');
const { JsiiProject } = require('projen');

const DEFAULT_K8S_VERSION = '22';
const SPEC_VERSION = k8sVersion();
const K8S_VERSION = `1.${SPEC_VERSION}.0`;

function k8sVersion() {
  const branch = child.execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  if (branch.startsWith('k8s-') && branch.length >= 6) {
    return branch.substring(4, 6);
  } else {
    // if the branch name doesn't start with k8s-XX, we're probably running on a fork
    // so assume that we are building for the latest version, i.e. 1.22.0
    return DEFAULT_K8S_VERSION;
  }
}

const project = new JsiiProject({
  name: `cdk8s-plus-${SPEC_VERSION}`,
  description: 'High level abstractions on top of cdk8s',

  repositoryUrl: 'https://github.com/cdk8s-team/cdk8s-plus.git',
  authorName: 'Amazon Web Services',
  authorUrl: 'https://aws.amazon.com',

  projenUpgradeSecret: 'PROJEN_GITHUB_TOKEN',
  prerelease: 'beta',

  // without this, the version of 'constructs' would need to be controlled
  // from this file, since otherwise it would create a 0.0.0 dev dependency.
  peerDependencyOptions: {
    pinnedDevDependency: false,
  },

  peerDeps: [
    'cdk8s',
    'constructs',
  ],
  deps: [
    'minimatch',
  ],
  bundledDeps: [
    'minimatch',
  ],
  devDeps: [
    'constructs',
    '@types/minimatch',
    'cdk8s',
    'cdk8s-cli',
    'constructs',
  ],

  majorVersion: 1,
  releaseTagPrefix: `cdk8s-plus-${SPEC_VERSION}/`,
  releaseWorkflowName: `release-k8s.${SPEC_VERSION}`,
  defaultReleaseBranch: `k8s-${SPEC_VERSION}/main`,
  minNodeVersion: '12.13.0',

  // jsii configuration
  publishToMaven: {
    javaPackage: `org.cdk8s.plus${SPEC_VERSION}`,
    mavenGroupId: 'org.cdk8s',
    mavenArtifactId: `cdk8s-plus-${SPEC_VERSION}`,
  },
  publishToPypi: {
    distName: `cdk8s-plus-${SPEC_VERSION}`,
    module: `cdk8s_plus_${SPEC_VERSION}`,
  },
  publishToNuget: {
    dotNetNamespace: `Org.Cdk8s.Plus${SPEC_VERSION}`,
    packageId: `Org.Cdk8s.Plus${SPEC_VERSION}`,
  },
  publishToGo: {
    gitUserName: 'cdk8s-automation',
    gitUserEmail: 'cdk8s-team@amazon.com',
    gitBranch: `k8s.${SPEC_VERSION}`,
    moduleName: 'github.com/cdk8s-team/cdk8s-plus-go',
  },
  autoApproveOptions: {
    allowedUsernames: ['cdk8s-automation'],
    secret: 'GITHUB_TOKEN',
  },
  autoApproveUpgrades: true,
});

const importdir = path.join('src', 'imports');

const importTask = project.addTask('import', {
  exec: `cdk8s -l typescript -o ${importdir} import k8s@${K8S_VERSION}`,
  description: 'Updates imports based on latest version of cdk8s-cli.',
});
project.compileTask.prependSpawn(importTask);

const docgenTask = project.tasks.tryFind('docgen');
docgenTask.reset();
docgenTask.exec('jsii-docgen -l typescript -o docs/typescript.md');
docgenTask.exec('jsii-docgen -l python -o docs/python.md');
docgenTask.exec('jsii-docgen -l java -o docs/java.md');

project.synth();