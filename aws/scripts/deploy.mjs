// Pulls a branch from GitHub on the instance and rebuilds/restarts the containers.
//
//   node aws/scripts/deploy.mjs [--branch <name>]     (default: current local branch)
//   node aws/scripts/deploy.mjs --no-pull             (just rebuild/restart what is checked out)
import {parseArgs} from 'node:util';
import {getInstance, log, main, publicUrl, requireRunningInstance} from '../lib/aws.mjs';
import {defaultBranch, deployApp} from '../lib/deploy.mjs';

const {values: args} = parseArgs({options: {branch: {type: 'string'}, 'no-pull': {type: 'boolean'}}});

main(async () => {
    const instance = requireRunningInstance();
    const pull = !args['no-pull'];
    await deployApp(instance.InstanceId, {branch: pull ? args.branch ?? defaultBranch() : undefined, pull});
    log('Done');
    console.log(`App URL: ${publicUrl(getInstance())}`);
});
