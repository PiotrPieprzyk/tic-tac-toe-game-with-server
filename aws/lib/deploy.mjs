import {execFileSync} from 'node:child_process';
import {config} from '../config.mjs';
import {log, ssmRun} from './aws.mjs';

const git = (...args) => execFileSync('git', args, {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim();

/** Current local git branch, with a warning when it isn't pushed (the instance clones from GitHub). */
export function defaultBranch() {
    const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
    try {
        if (git('rev-parse', 'HEAD') !== git('rev-parse', `origin/${branch}`)) {
            console.warn(`WARNING: local '${branch}' differs from origin/${branch}. The instance deploys what is on GitHub — push first.`);
        }
    } catch {
        console.warn(`WARNING: origin/${branch} not found. Push the branch before deploying.`);
    }
    return branch;
}

/**
 * Deploys the app on the instance:
 *   1. (pull) checks out origin/<branch> in /opt/tic-tac-toe,
 *   2. writes .env.aws from Parameter Store (read by the instance role, so the
 *      password never appears in the SSM command history),
 *   3. docker compose up -d --build.
 * With pull=false, it just rebuilds/restarts whatever is checked out.
 */
export async function deployApp(instanceId, {branch, pull = true}) {
    if (pull && !/^[\w./-]+$/.test(branch)) {
        throw new Error(`Invalid branch name: ${branch}`);
    }
    log(pull ? `Deploying branch '${branch}' to ${instanceId}` : `Restarting containers on ${instanceId}`);

    const compose = `docker compose -f ${config.composeFile} --env-file .env.aws`;
    const getParam = (name, decrypt = '') =>
        `aws ssm get-parameter --region ${config.region} --name ${name} ${decrypt} --query Parameter.Value --output text`;

    const commands = [
        'set -euo pipefail',
        // First boot: wait until user-data (docker install, git clone) has finished.
        'cloud-init status --wait > /dev/null 2>&1 || true',
        `cd ${config.appDir}`,
        ...(pull ? [
            'git fetch --prune origin',
            `git checkout -f -B ${branch} origin/${branch}`,
        ] : []),
        'echo "Deployed commit: $(git log -1 --oneline)"',
        `test -f ${config.composeFile} || { echo "${config.composeFile} missing on this branch - commit and push the aws files first"; exit 1; }`,
        `DB_HOST=$(${getParam(config.params.dbHost)})`,
        `DB_PASSWORD=$(${getParam(config.params.dbPassword, '--with-decryption')})`,
        `(umask 077 && printf 'DB_HOST=%s\\nDB_PASSWORD=%s\\n' "$DB_HOST" "$DB_PASSWORD" > .env.aws)`,
        `${compose} up -d --build --remove-orphans 2>&1 | tail -n 30`,
        'docker image prune -f > /dev/null',
        `${compose} ps`,
    ];

    const result = await ssmRun(instanceId, commands, {comment: `deploy ${pull ? branch : '(restart)'}`});
    if (result.status !== 'Success') {
        throw new Error(`Deploy failed (${result.status}). See output above.`);
    }
}
