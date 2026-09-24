// Single place for every name / size used by the aws/scripts/*.mjs scripts.
// All resources are tagged Project=<project>, and the scripts find them by
// tag or name, so there is no local state file.
export const config = {
    region: 'eu-central-1',
    project: 'tic-tac-toe',

    repoUrl: 'https://github.com/PiotrPieprzyk/tic-tac-toe-game-with-server.git',
    // Where user-data clones the repo on the instance.
    appDir: '/opt/tic-tac-toe',
    composeFile: 'docker-compose.aws.yml',

    ec2: {
        name: 'tic-tac-toe-app',
        // Smallest size that can build + run both containers (1 GB RAM + 2 GB swap).
        instanceType: 't4g.micro',
        volumeSizeGb: 10,
        // Latest Amazon Linux 2023, arm64 (Graviton).
        amiParameter: '/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64',
    },

    rds: {
        identifier: 'tic-tac-toe-db',
        instanceClass: 'db.t4g.micro',
        engineVersion: '16',
        storageGb: 20,
        dbName: 'tic_tac_toe',
        username: 'postgres',
        subnetGroup: 'tic-tac-toe-db-subnets',
        // stop.mjs creates <prefix>-<timestamp>, start.mjs restores the newest one.
        snapshotPrefix: 'tic-tac-toe-db-paused',
    },

    sg: {
        app: 'tic-tac-toe-app-sg',
        db: 'tic-tac-toe-db-sg',
    },

    iam: {
        role: 'tic-tac-toe-ec2-role',
        instanceProfile: 'tic-tac-toe-ec2-profile',
        inlinePolicy: 'tic-tac-toe-read-params',
        ssmManagedPolicyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    },

    params: {
        dbHost: '/tic-tac-toe/db-host',
        dbPassword: '/tic-tac-toe/db-password',
    },
};
