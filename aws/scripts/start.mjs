// ENABLE the project: restore RDS from the newest pause snapshot, start EC2,
// restart the containers and print the (new) public URL. Takes ~10-20 min.
//
//   node aws/scripts/start.mjs
import {config} from '../config.mjs';
import {
    aws, getDb, getInstance, getPauseSnapshots, getSecurityGroupId, log, main, projectTag, publicUrl,
    waitForSsmOnline,
} from '../lib/aws.mjs';
import {deployApp} from '../lib/deploy.mjs';

main(async () => {
    const instance = getInstance();
    if (!instance) {
        throw new Error('No tic-tac-toe instance found. Run: node aws/scripts/setup.mjs');
    }

    // ------------------------------------------------------------ RDS
    const db = getDb();
    if (!db) {
        const snapshot = getPauseSnapshots().filter((s) => s.Status === 'available').at(-1);
        if (!snapshot) {
            throw new Error('No database and no pause snapshot found. Run: node aws/scripts/setup.mjs');
        }
        log(`Restoring RDS ${config.rds.identifier} from ${snapshot.DBSnapshotIdentifier} (~10-15 min)`);
        aws([
            'rds', 'restore-db-instance-from-db-snapshot',
            '--db-instance-identifier', config.rds.identifier,
            '--db-snapshot-identifier', snapshot.DBSnapshotIdentifier,
            '--db-instance-class', config.rds.instanceClass,
            '--storage-type', 'gp3',
            '--db-subnet-group-name', config.rds.subnetGroup,
            '--vpc-security-group-ids', getSecurityGroupId(config.sg.db),
            '--no-publicly-accessible',
            '--no-multi-az',
            '--copy-tags-to-snapshot',
            '--tags', projectTag,
        ]);
    } else if (db.DBInstanceStatus === 'stopped') {
        log(`Starting stopped RDS ${config.rds.identifier}`);
        aws(['rds', 'start-db-instance', '--db-instance-identifier', config.rds.identifier]);
    }
    console.log('Waiting for the database to be available...');
    aws(['rds', 'wait', 'db-instance-available', '--db-instance-identifier', config.rds.identifier]);
    // The endpoint is derived from the identifier, so it normally doesn't change; refresh anyway.
    aws(['ssm', 'put-parameter', '--name', config.params.dbHost, '--type', 'String', '--value', getDb().Endpoint.Address, '--overwrite']);

    // ------------------------------------------------------------ EC2
    if (instance.State.Name === 'stopping') {
        aws(['ec2', 'wait', 'instance-stopped', '--instance-ids', instance.InstanceId]);
    }
    if (instance.State.Name !== 'running') {
        log(`Starting EC2 ${instance.InstanceId}`);
        aws(['ec2', 'start-instances', '--instance-ids', instance.InstanceId]);
    }
    aws(['ec2', 'wait', 'instance-running', '--instance-ids', instance.InstanceId]);
    await waitForSsmOnline(instance.InstanceId);

    // Containers come back on their own (restart: unless-stopped), but the
    // backend may have given up while the DB was restoring — restart cleanly.
    await deployApp(instance.InstanceId, {pull: false});

    log('Project enabled');
    console.log(`App URL: ${publicUrl(getInstance())}   (the IP changes after every start)`);
});
