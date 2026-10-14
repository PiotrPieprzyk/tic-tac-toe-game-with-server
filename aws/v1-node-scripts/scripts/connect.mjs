// Opens an interactive shell on the instance through SSM Session Manager
// (no SSH key, no open port 22). Needs the Session Manager plugin locally.
//
//   node aws/scripts/connect.mjs
//
// You land as ssm-user; then: sudo -i && cd /opt/tic-tac-toe
import {awsInteractive, main, requireRunningInstance} from '../lib/aws.mjs';

main(async () => {
    const instance = requireRunningInstance();
    console.log('Tip: sudo -i; cd /opt/tic-tac-toe; docker ps; docker logs -f tic-tac-toe-backend-aws\n');
    process.exitCode = awsInteractive(['ssm', 'start-session', '--target', instance.InstanceId]);
});
