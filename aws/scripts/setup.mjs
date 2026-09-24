// Creates all AWS resources and deploys the app. Safe to re-run: existing
// resources are reused.
//
//   node aws/scripts/setup.mjs [--branch <name>]
import {randomInt} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {parseArgs} from 'node:util';
import {config} from '../config.mjs';
import {
    aws, fileArg, getDb, getInstance, getPauseSnapshots, getSecurityGroupId, log, main,
    projectTag, publicUrl, sleep, tagSpecification, tryAws, waitForSsmOnline,
} from '../lib/aws.mjs';
import {defaultBranch, deployApp} from '../lib/deploy.mjs';

const {values: args} = parseArgs({options: {branch: {type: 'string'}}});

main(async () => {
    const branch = args.branch ?? defaultBranch();
    const identity = aws(['sts', 'get-caller-identity']);
    console.log(`Account ${identity.Account}, region ${config.region}, branch '${branch}'`);

    const existingInstance = getInstance();
    if (existingInstance && existingInstance.State.Name !== 'running') {
        throw new Error(`Instance ${existingInstance.InstanceId} is ${existingInstance.State.Name}. Use start.mjs to enable the project.`);
    }
    if (!getDb() && getPauseSnapshots().length > 0) {
        throw new Error('The project is paused (a DB snapshot exists). Use start.mjs to enable it.');
    }

    // ------------------------------------------------------------ network
    log('Default VPC');
    const vpcId = aws(['ec2', 'describe-vpcs', '--filters', 'Name=is-default,Values=true']).Vpcs[0]?.VpcId;
    if (!vpcId) {
        throw new Error('No default VPC in this region. Create one with: aws ec2 create-default-vpc');
    }
    const subnetIds = aws(['ec2', 'describe-subnets', '--filters', `Name=vpc-id,Values=${vpcId}`, 'Name=default-for-az,Values=true'])
        .Subnets.map((s) => s.SubnetId);
    console.log(`VPC ${vpcId}, subnets ${subnetIds.join(', ')}`);

    log('Security groups');
    const createSg = (name, description) => aws([
        'ec2', 'create-security-group',
        '--group-name', name,
        '--description', description,
        '--vpc-id', vpcId,
        '--tag-specifications', tagSpecification('security-group', name),
    ]).GroupId;

    let appSgId = getSecurityGroupId(config.sg.app);
    if (!appSgId) {
        appSgId = createSg(config.sg.app, 'tic-tac-toe app: public HTTP');
        aws(['ec2', 'authorize-security-group-ingress', '--group-id', appSgId, '--protocol', 'tcp', '--port', '80', '--cidr', '0.0.0.0/0']);
    }
    let dbSgId = getSecurityGroupId(config.sg.db);
    if (!dbSgId) {
        dbSgId = createSg(config.sg.db, 'tic-tac-toe db: postgres from app only');
        aws(['ec2', 'authorize-security-group-ingress', '--group-id', dbSgId, '--protocol', 'tcp', '--port', '5432', '--source-group', appSgId]);
    }
    console.log(`app SG ${appSgId}, db SG ${dbSgId}`);

    // ------------------------------------------------------------ IAM
    log('IAM role + instance profile (SSM access for the instance)');
    if (!tryAws(['iam', 'get-role', '--role-name', config.iam.role], /NoSuchEntity/)) {
        aws([
            'iam', 'create-role',
            '--role-name', config.iam.role,
            '--assume-role-policy-document', fileArg({
                Version: '2012-10-17',
                Statement: [{Effect: 'Allow', Principal: {Service: 'ec2.amazonaws.com'}, Action: 'sts:AssumeRole'}],
            }),
            '--tags', projectTag,
        ]);
    }
    aws(['iam', 'attach-role-policy', '--role-name', config.iam.role, '--policy-arn', config.iam.ssmManagedPolicyArn]);
    aws([
        'iam', 'put-role-policy',
        '--role-name', config.iam.role,
        '--policy-name', config.iam.inlinePolicy,
        '--policy-document', fileArg({
            Version: '2012-10-17',
            Statement: [{
                Effect: 'Allow',
                Action: ['ssm:GetParameter', 'ssm:GetParameters'],
                Resource: `arn:aws:ssm:${config.region}:${identity.Account}:parameter/${config.project}/*`,
            }],
        }),
    ]);
    const profile = tryAws(['iam', 'get-instance-profile', '--instance-profile-name', config.iam.instanceProfile], /NoSuchEntity/);
    if (!profile) {
        aws(['iam', 'create-instance-profile', '--instance-profile-name', config.iam.instanceProfile, '--tags', projectTag]);
    }
    if (!profile?.InstanceProfile.Roles.some((r) => r.RoleName === config.iam.role)) {
        aws(['iam', 'add-role-to-instance-profile', '--instance-profile-name', config.iam.instanceProfile, '--role-name', config.iam.role]);
    }

    // ------------------------------------------------------------ RDS
    log('Database password (SSM Parameter Store, SecureString)');
    if (!tryAws(['ssm', 'get-parameter', '--name', config.params.dbPassword], /ParameterNotFound/)) {
        // Alphanumeric only: RDS rejects / @ " and space, and URL-special chars would break DATABASE_URL.
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
        const password = Array.from({length: 32}, () => alphabet[randomInt(alphabet.length)]).join('');
        aws([
            'ssm', 'put-parameter',
            '--name', config.params.dbPassword,
            '--type', 'SecureString',
            '--value', fileArg(password),
            '--tags', projectTag,
        ]);
    }

    log('DB subnet group');
    if (!tryAws(['rds', 'describe-db-subnet-groups', '--db-subnet-group-name', config.rds.subnetGroup], /DBSubnetGroupNotFound/)) {
        aws([
            'rds', 'create-db-subnet-group',
            '--db-subnet-group-name', config.rds.subnetGroup,
            '--db-subnet-group-description', 'tic-tac-toe default VPC subnets',
            '--subnet-ids', ...subnetIds,
            '--tags', projectTag,
        ]);
    }

    log('RDS Postgres instance');
    if (!getDb()) {
        const password = aws(['ssm', 'get-parameter', '--name', config.params.dbPassword, '--with-decryption'], {quiet: true}).Parameter.Value;
        aws([
            'rds', 'create-db-instance',
            '--db-instance-identifier', config.rds.identifier,
            '--engine', 'postgres',
            '--engine-version', config.rds.engineVersion,
            '--db-instance-class', config.rds.instanceClass,
            '--allocated-storage', String(config.rds.storageGb),
            '--storage-type', 'gp3',
            '--storage-encrypted',
            '--db-name', config.rds.dbName,
            '--master-username', config.rds.username,
            '--master-user-password', fileArg(password),
            '--db-subnet-group-name', config.rds.subnetGroup,
            '--vpc-security-group-ids', dbSgId,
            '--no-publicly-accessible',
            '--no-multi-az',
            '--backup-retention-period', '0',
            '--no-enable-performance-insights',
            '--copy-tags-to-snapshot',
            '--tags', projectTag,
        ]);
    }
    console.log('Waiting for the database to be available (first creation takes ~5-10 min)...');
    aws(['rds', 'wait', 'db-instance-available', '--db-instance-identifier', config.rds.identifier]);
    const endpoint = getDb().Endpoint.Address;
    aws(['ssm', 'put-parameter', '--name', config.params.dbHost, '--type', 'String', '--value', endpoint, '--overwrite']);

    // ------------------------------------------------------------ EC2
    log('EC2 instance');
    let instance = existingInstance;
    if (!instance) {
        const amiId = aws(['ssm', 'get-parameter', '--name', config.ec2.amiParameter]).Parameter.Value;
        const userData = readFileSync(new URL('../ec2/user-data.sh', import.meta.url), 'utf8')
            .replace(/\r\n/g, '\n')
            .replaceAll('__REPO_URL__', config.repoUrl)
            .replaceAll('__APP_DIR__', config.appDir);
        const runArgs = [
            'ec2', 'run-instances',
            '--image-id', amiId,
            '--instance-type', config.ec2.instanceType,
            '--subnet-id', subnetIds[0],
            '--security-group-ids', appSgId,
            '--associate-public-ip-address',
            '--iam-instance-profile', `Name=${config.iam.instanceProfile}`,
            '--block-device-mappings', `DeviceName=/dev/xvda,Ebs={VolumeSize=${config.ec2.volumeSizeGb},VolumeType=gp3,Encrypted=true,DeleteOnTermination=true}`,
            '--metadata-options', 'HttpTokens=required,HttpEndpoint=enabled',
            '--user-data', fileArg(userData),
            '--tag-specifications', tagSpecification('instance', config.ec2.name), tagSpecification('volume', config.ec2.name),
            '--count', '1',
        ];
        // A freshly created instance profile takes a few seconds to become usable.
        for (let attempt = 1; ; attempt++) {
            try {
                instance = aws(runArgs).Instances[0];
                break;
            } catch (e) {
                if (attempt >= 10 || !/Invalid IAM Instance Profile/i.test(e.stderr ?? '')) {
                    throw e;
                }
                console.log('Instance profile not ready yet, retrying in 10s...');
                await sleep(10_000);
            }
        }
    }
    aws(['ec2', 'wait', 'instance-running', '--instance-ids', instance.InstanceId]);
    await waitForSsmOnline(instance.InstanceId);

    // ------------------------------------------------------------ app
    await deployApp(instance.InstanceId, {branch});

    log('Done');
    console.log(`App URL: ${publicUrl(getInstance())}`);
});
