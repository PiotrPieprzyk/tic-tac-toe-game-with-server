// DISABLE the project: stop EC2, snapshot + delete RDS.
// Paused cost ≈ EBS volume + snapshot storage (~$1-1.5/month).
//
//   node aws/scripts/stop.mjs
import {config} from '../config.mjs';
import {aws, getDb, getInstance, getPauseSnapshots, log, main} from '../lib/aws.mjs';

main(async () => {
    const instance = getInstance();
    if (instance && ['pending', 'running'].includes(instance.State.Name)) {
        log(`Stopping EC2 ${instance.InstanceId}`);
        aws(['ec2', 'stop-instances', '--instance-ids', instance.InstanceId]);
        aws(['ec2', 'wait', 'instance-stopped', '--instance-ids', instance.InstanceId]);
    } else {
        console.log(`EC2: ${instance ? instance.State.Name : 'none'}, nothing to stop.`);
    }

    const db = getDb();
    if (!db) {
        console.log('RDS: no instance, nothing to delete (already paused?).');
        return;
    }
    if (!['available', 'stopped'].includes(db.DBInstanceStatus)) {
        console.log(`RDS is '${db.DBInstanceStatus}', waiting until it is available...`);
        aws(['rds', 'wait', 'db-instance-available', '--db-instance-identifier', config.rds.identifier]);
    }

    // Snapshot name with a sortable timestamp; older pause snapshots are removed
    // only after the new one exists, so data is never without a copy.
    const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
    const snapshotId = `${config.rds.snapshotPrefix}-${timestamp}`;
    const olderSnapshots = getPauseSnapshots();

    log(`Deleting RDS ${config.rds.identifier} with final snapshot ${snapshotId} (~5-10 min)`);
    aws([
        'rds', 'delete-db-instance',
        '--db-instance-identifier', config.rds.identifier,
        '--final-db-snapshot-identifier', snapshotId,
        '--delete-automated-backups',
    ]);
    aws(['rds', 'wait', 'db-instance-deleted', '--db-instance-identifier', config.rds.identifier]);
    aws(['rds', 'wait', 'db-snapshot-available', '--db-snapshot-identifier', snapshotId]);

    for (const old of olderSnapshots) {
        log(`Removing older snapshot ${old.DBSnapshotIdentifier}`);
        aws(['rds', 'delete-db-snapshot', '--db-snapshot-identifier', old.DBSnapshotIdentifier]);
    }

    log('Project paused');
    console.log(`Data kept in snapshot ${snapshotId}. Enable again with: node aws/scripts/start.mjs`);
});
