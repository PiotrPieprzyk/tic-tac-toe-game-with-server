// Lab 06: SSM Run Command from Node.js, using the project's own helpers in
// aws/lib/aws.mjs (the same ssmRun() that deploy.mjs and logs.mjs use).
// Needs the lab 05 instance running.
//
//   node aws/learning/examples/06-run-command.mjs
//   node aws/learning/examples/06-run-command.mjs "df -h / && free -m"
//
// After it runs, open Systems Manager → Run Command → Command history in the
// console. Your command is there with its output.
import {aws, main, ssmRun} from '../../lib/aws.mjs';

main(async () => {
    const found = aws([
        'ec2', 'describe-instances',
        '--filters', 'Name=tag:Name,Values=aws-learning-lab', 'Name=instance-state-name,Values=running',
    ]);
    const instance = found.Reservations.flatMap((r) => r.Instances)[0];
    if (!instance) {
        console.error('No running aws-learning-lab instance. Run: bash aws/learning/examples/05-ec2-lab/launch.sh');
        process.exit(1);
    }

    const custom = process.argv.slice(2).join(' ');
    const commands = custom ? [custom] : [
        'whoami',                        // Run Command runs as root
        'hostname',
        'cloud-init status',             // did user-data finish?
        'systemctl is-active nginx docker',
        'curl -s localhost | head -3',
        'aws sts get-caller-identity',   // the instance role, via IMDS
    ];

    const result = await ssmRun(instance.InstanceId, commands, {comment: 'aws-learning lab 06', timeoutSeconds: 120});
    console.log(`\nStatus: ${result.status}, exit code: ${result.exitCode}`);
});
