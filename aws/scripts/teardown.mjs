// REVERT everything this project created in AWS (the default VPC is untouched).
// Deletes the database WITHOUT a final snapshot and removes all pause snapshots.
//
//   node aws/scripts/teardown.mjs          (dry run: lists what would be deleted)
//   node aws/scripts/teardown.mjs --yes    (actually delete)
import {parseArgs} from 'node:util';
import {config} from '../config.mjs';
import {
    AwsError, aws, getDb, getInstance, getPauseSnapshots, getSecurityGroupId, log, main, sleep, tryAws,
} from '../lib/aws.mjs';

const {values: args} = parseArgs({options: {yes: {type: 'boolean'}}});

main(async () => {
    const instance = getInstance();
    const db = getDb();
    const snapshots = getPauseSnapshots();
    const sgIds = [getSecurityGroupId(config.sg.db), getSecurityGroupId(config.sg.app)].filter(Boolean);

    console.log('Will delete:');
    console.log(`  EC2 instance:      ${instance?.InstanceId ?? '-'}`);
    console.log(`  RDS instance:      ${db ? config.rds.identifier : '-'}`);
    console.log(`  RDS snapshots:     ${snapshots.map((s) => s.DBSnapshotIdentifier).join(', ') || '-'}`);
    console.log(`  DB subnet group:   ${config.rds.subnetGroup}`);
    console.log(`  Security groups:   ${sgIds.join(', ') || '-'}`);
    console.log(`  IAM:               ${config.iam.instanceProfile}, ${config.iam.role}`);
    console.log(`  SSM parameters:    ${config.params.dbHost}, ${config.params.dbPassword}`);
    if (!args.yes) {
        console.log('\nDry run. Re-run with --yes to delete. THIS DELETES ALL GAME DATA.');
        return;
    }

    if (instance) {
        log('Terminating EC2 instance (its EBS volume is deleted with it)');
        aws(['ec2', 'terminate-instances', '--instance-ids', instance.InstanceId]);
    }
    if (db) {
        log('Deleting RDS instance (no final snapshot)');
        if (db.DBInstanceStatus !== 'deleting') {
            aws([
                'rds', 'delete-db-instance',
                '--db-instance-identifier', config.rds.identifier,
                '--skip-final-snapshot',
                '--delete-automated-backups',
            ]);
        }
    }
    if (instance) {
        aws(['ec2', 'wait', 'instance-terminated', '--instance-ids', instance.InstanceId]);
    }
    if (db) {
        aws(['rds', 'wait', 'db-instance-deleted', '--db-instance-identifier', config.rds.identifier]);
    }

    for (const snapshot of snapshots) {
        log(`Deleting snapshot ${snapshot.DBSnapshotIdentifier}`);
        aws(['rds', 'delete-db-snapshot', '--db-snapshot-identifier', snapshot.DBSnapshotIdentifier]);
    }

    log('Deleting DB subnet group');
    tryAws(['rds', 'delete-db-subnet-group', '--db-subnet-group-name', config.rds.subnetGroup], /DBSubnetGroupNotFound/);

    // Network interfaces of terminated/deleted resources detach asynchronously,
    // so security group deletion may need a few retries.
    for (const sgId of sgIds) {
        log(`Deleting security group ${sgId}`);
        for (let attempt = 1; ; attempt++) {
            try {
                aws(['ec2', 'delete-security-group', '--group-id', sgId]);
                break;
            } catch (e) {
                if (attempt >= 30 || !(e instanceof AwsError) || !/DependencyViolation/.test(e.stderr)) {
                    throw e;
                }
                console.log('  still in use, retrying in 10s...');
                await sleep(10_000);
            }
        }
    }

    log('Deleting IAM instance profile and role');
    const notFound = /NoSuchEntity/;
    tryAws(['iam', 'remove-role-from-instance-profile', '--instance-profile-name', config.iam.instanceProfile, '--role-name', config.iam.role], notFound);
    tryAws(['iam', 'delete-instance-profile', '--instance-profile-name', config.iam.instanceProfile], notFound);
    tryAws(['iam', 'detach-role-policy', '--role-name', config.iam.role, '--policy-arn', config.iam.ssmManagedPolicyArn], notFound);
    tryAws(['iam', 'delete-role-policy', '--role-name', config.iam.role, '--policy-name', config.iam.inlinePolicy], notFound);
    tryAws(['iam', 'delete-role', '--role-name', config.iam.role], notFound);

    log('Deleting SSM parameters');
    aws(['ssm', 'delete-parameters', '--names', config.params.dbHost, config.params.dbPassword]);

    log('Verifying nothing tagged Project=tic-tac-toe is left');
    // Terminated instances can stay listed by the tagging API for up to an hour.
    const leftovers = aws([
        'resourcegroupstaggingapi', 'get-resources',
        '--tag-filters', `Key=Project,Values=${config.project}`,
    ]).ResourceTagMappingList.map((r) => r.ResourceARN);
    console.log(leftovers.length ? `  Still listed (may be eventual consistency):\n  ${leftovers.join('\n  ')}` : '  Nothing left.');
    console.log('\nAll tic-tac-toe AWS resources removed.');
});
