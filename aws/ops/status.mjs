// Shows the state of the EC2 instance, the RDS database and pause snapshots.
//
//   node aws/ops/status.mjs
import {getDb, getInstance, getPauseSnapshots, main, publicUrl} from './lib/aws.mjs';

main(async () => {
    const instance = getInstance();
    const db = getDb();
    const snapshots = getPauseSnapshots();

    console.log('EC2');
    console.log(instance
        ? `  ${instance.InstanceId}  ${instance.InstanceType}  ${instance.State.Name}  ip=${instance.PublicIpAddress ?? '-'}`
        : '  (none)');

    console.log('RDS');
    console.log(db
        ? `  ${db.DBInstanceIdentifier}  ${db.DBInstanceClass}  ${db.DBInstanceStatus}  ${db.Endpoint?.Address ?? ''}`
        : '  (none)');

    console.log('Pause snapshots');
    console.log(snapshots.length
        ? snapshots.map((s) => `  ${s.DBSnapshotIdentifier}  ${s.Status}  ${s.SnapshotCreateTime ?? ''}`).join('\n')
        : '  (none)');

    const state = instance?.State.Name === 'running' && db?.DBInstanceStatus === 'available'
        ? `ENABLED  → ${publicUrl(instance)}`
        : !db && snapshots.length ? 'PAUSED   → terraform -chdir=aws/infra apply -var enabled=true'
        : !instance && !db ? 'NOT SET UP → terraform -chdir=aws/infra apply'
        : 'IN TRANSITION / PARTIAL';
    console.log(`\nProject: ${state}`);
});
