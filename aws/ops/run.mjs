// Runs a one-off shell command on the instance (as root, in /opt/tic-tac-toe)
// through SSM Run Command and prints its output.
//
//   node aws/ops/run.mjs "docker ps"
//   node aws/ops/run.mjs "free -m && df -h /"
import {tf} from './lib/outputs.mjs';
import {main, requireRunningInstance, ssmRun} from './lib/aws.mjs';

main(async () => {
    const command = process.argv.slice(2).join(' ');
    if (!command) {
        console.error('Usage: node aws/ops/run.mjs "<shell command>"');
        process.exit(1);
    }
    const instance = requireRunningInstance();
    const result = await ssmRun(instance.InstanceId, [`cd ${tf().app_dir}`, command], {comment: command, timeoutSeconds: 600});
    process.exitCode = result.status === 'Success' ? 0 : 1;
});
