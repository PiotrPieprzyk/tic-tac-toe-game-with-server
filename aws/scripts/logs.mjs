// Prints recent container logs from the instance (via SSM Run Command).
// For live streaming (docker logs -f) use connect.mjs instead.
//
//   node aws/scripts/logs.mjs                    (backend + frontend, last 100 lines)
//   node aws/scripts/logs.mjs backend --tail 300
//   node aws/scripts/logs.mjs frontend --since 10m
import {parseArgs} from 'node:util';
import {main, requireRunningInstance, ssmRun} from '../lib/aws.mjs';

const {values: args, positionals} = parseArgs({
    allowPositionals: true,
    options: {tail: {type: 'string', default: '100'}, since: {type: 'string'}},
});

main(async () => {
    const services = positionals.length ? positionals : ['backend', 'frontend'];
    const invalid = services.filter((s) => !['backend', 'frontend'].includes(s));
    if (invalid.length || !/^\d+$/.test(args.tail) || (args.since && !/^[\w.:-]+$/.test(args.since))) {
        console.error('Usage: node aws/scripts/logs.mjs [backend|frontend] [--tail N] [--since 10m]');
        process.exit(1);
    }
    const since = args.since ? ` --since ${args.since}` : '';
    const commands = services.flatMap((service) => [
        `echo "===== tic-tac-toe-${service}-aws ====="`,
        `docker logs --timestamps --tail ${args.tail}${since} tic-tac-toe-${service}-aws 2>&1`,
    ]);
    const instance = requireRunningInstance();
    await ssmRun(instance.InstanceId, commands, {comment: 'logs', timeoutSeconds: 120, print: false});
});
