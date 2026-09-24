import {execFileSync, spawnSync} from 'node:child_process';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';
import {config} from '../config.mjs';

export {sleep};

export class AwsError extends Error {
    constructor(args, stderr) {
        super(`aws ${args.join(' ')}\n${stderr}`);
        this.stderr = stderr;
    }
}

const quoteForLog = (arg) => (/[\s"'{}[\]$]/.test(arg) ? `'${arg}'` : arg);

/**
 * Runs `aws <args> --region <region> --output json` and returns parsed JSON
 * (or null when the command prints nothing, e.g. waiters).
 * Every command is echoed so the script output doubles as documentation.
 */
export function aws(args, {quiet = false} = {}) {
    if (!quiet) {
        console.log(`$ aws ${args.map(quoteForLog).join(' ')}`);
    }
    const fullArgs = [...args, '--region', config.region, '--output', 'json', '--no-cli-pager'];
    try {
        const out = execFileSync('aws', fullArgs, {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {...process.env, AWS_PAGER: ''},
            maxBuffer: 64 * 1024 * 1024,
        });
        return out.trim() ? JSON.parse(out) : null;
    } catch (e) {
        throw new AwsError(args, String(e.stderr || e.message).trim());
    }
}

/** Like aws(), but returns null when the error output matches `notFound`. */
export function tryAws(args, notFound, options) {
    try {
        return aws(args, options);
    } catch (e) {
        if (e instanceof AwsError && notFound.test(e.stderr)) {
            return null;
        }
        throw e;
    }
}

/** Runs an interactive aws command (e.g. ssm start-session) attached to this terminal. */
export function awsInteractive(args) {
    console.log(`$ aws ${args.map(quoteForLog).join(' ')}`);
    const result = spawnSync('aws', [...args, '--region', config.region], {stdio: 'inherit'});
    return result.status ?? 1;
}

// Temp files for `file://` arguments: keeps JSON quoting sane on Windows and
// keeps secrets off the process command line. Removed on exit.
let tempDir;
let tempCounter = 0;
process.on('exit', () => tempDir && rmSync(tempDir, {recursive: true, force: true}));

export function fileArg(content) {
    tempDir ??= mkdtempSync(join(tmpdir(), 'tic-tac-toe-aws-'));
    const path = join(tempDir, `arg-${tempCounter++}`);
    writeFileSync(path, typeof content === 'string' ? content : JSON.stringify(content));
    return `file://${path}`;
}

export const log = (message) => console.log(`\n==> ${message}`);

export const projectTag = `Key=Project,Value=${config.project}`;
export const tagSpecification = (resourceType, name) =>
    `ResourceType=${resourceType},Tags=[{Key=Project,Value=${config.project}},{Key=Name,Value=${name}}]`;

// ---------------------------------------------------------------- lookups

export function getInstance() {
    const result = aws([
        'ec2', 'describe-instances',
        '--filters',
        `Name=tag:Project,Values=${config.project}`,
        `Name=tag:Name,Values=${config.ec2.name}`,
        'Name=instance-state-name,Values=pending,running,stopping,stopped,shutting-down',
    ], {quiet: true});
    return result.Reservations.flatMap((r) => r.Instances)[0] ?? null;
}

export function getDb() {
    const result = tryAws(
        ['rds', 'describe-db-instances', '--db-instance-identifier', config.rds.identifier],
        /DBInstanceNotFound/,
        {quiet: true},
    );
    return result?.DBInstances[0] ?? null;
}

/** Manual "paused" snapshots, oldest first (identifiers end with a sortable timestamp). */
export function getPauseSnapshots() {
    const result = aws([
        'rds', 'describe-db-snapshots',
        '--db-instance-identifier', config.rds.identifier,
        '--snapshot-type', 'manual',
    ], {quiet: true});
    return result.DBSnapshots
        .filter((s) => s.DBSnapshotIdentifier.startsWith(config.rds.snapshotPrefix))
        .sort((a, b) => a.DBSnapshotIdentifier.localeCompare(b.DBSnapshotIdentifier));
}

export function getSecurityGroupId(name) {
    const result = aws([
        'ec2', 'describe-security-groups',
        '--filters', `Name=group-name,Values=${name}`, `Name=tag:Project,Values=${config.project}`,
    ], {quiet: true});
    return result.SecurityGroups[0]?.GroupId ?? null;
}

export const publicUrl = (instance) =>
    instance?.PublicIpAddress ? `http://${instance.PublicIpAddress}` : '(no public IP — instance not running)';

// ---------------------------------------------------------------- SSM

export async function waitForSsmOnline(instanceId, timeoutMs = 10 * 60_000) {
    log(`Waiting for the SSM agent on ${instanceId} to come online`);
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const info = aws([
            'ssm', 'describe-instance-information',
            '--filters', `Key=InstanceIds,Values=${instanceId}`,
        ], {quiet: true});
        if (info.InstanceInformationList[0]?.PingStatus === 'Online') {
            console.log('SSM agent is online.');
            return;
        }
        await sleep(10_000);
    }
    throw new Error('SSM agent did not come online. Check the instance profile and /var/log/amazon/ssm on the instance.');
}

/**
 * Runs shell commands on the instance as root via SSM Run Command
 * (document AWS-RunShellScript) and waits for the result.
 */
export async function ssmRun(instanceId, commands, {comment = 'tic-tac-toe', timeoutSeconds = 3600, print = true} = {}) {
    if (print) {
        console.log(commands.map((c) => `  [remote] ${c}`).join('\n'));
    }
    const sent = aws([
        'ssm', 'send-command',
        '--instance-ids', instanceId,
        '--document-name', 'AWS-RunShellScript',
        '--comment', comment.slice(0, 100),
        '--parameters', fileArg({commands, executionTimeout: [String(timeoutSeconds)]}),
    ]);
    const commandId = sent.Command.CommandId;
    console.log(`Command id: ${commandId} (aws ssm get-command-invocation --command-id ${commandId} --instance-id ${instanceId})`);

    const started = Date.now();
    let lastProgress = started;
    while (true) {
        await sleep(3000);
        const invocation = tryAws(
            ['ssm', 'get-command-invocation', '--command-id', commandId, '--instance-id', instanceId],
            /InvocationDoesNotExist/,
            {quiet: true},
        );
        if (!invocation || ['Pending', 'InProgress', 'Delayed'].includes(invocation.Status)) {
            if (Date.now() - lastProgress > 30_000) {
                console.log(`  ...still running (${Math.round((Date.now() - started) / 1000)}s)`);
                lastProgress = Date.now();
            }
            continue;
        }
        if (invocation.StandardOutputContent) {
            console.log(invocation.StandardOutputContent.trimEnd());
        }
        if (invocation.StandardErrorContent) {
            console.error(invocation.StandardErrorContent.trimEnd());
        }
        return {status: invocation.Status, exitCode: invocation.ResponseCode};
    }
}

/** Returns the single running instance or exits with a helpful message. */
export function requireRunningInstance() {
    const instance = getInstance();
    if (!instance) {
        console.error('No tic-tac-toe instance found. Run: node aws/scripts/setup.mjs');
        process.exit(1);
    }
    if (instance.State.Name !== 'running') {
        console.error(`Instance ${instance.InstanceId} is ${instance.State.Name}. Run: node aws/scripts/start.mjs`);
        process.exit(1);
    }
    return instance;
}

/** Wraps a script's main so AWS errors print cleanly instead of as a stack trace. */
export function main(fn) {
    fn().catch((e) => {
        console.error(`\nERROR: ${e.message}`);
        process.exit(1);
    });
}
