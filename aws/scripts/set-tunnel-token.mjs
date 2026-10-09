// Store the Cloudflare tunnel token in Parameter Store (SecureString).
// The token is read from a file, so it never appears on a command line or in
// shell history, and the file is deleted after a successful upload.
//
//   node aws/scripts/set-tunnel-token.mjs <token-file>
//
// See aws/README.md, section 7, for where to get the token.
import {readFileSync, rmSync} from 'node:fs';
import {config} from '../config.mjs';
import {aws, fileArg, log, main, projectTag, tryAws} from '../lib/aws.mjs';

main(async () => {
    const file = process.argv[2];
    if (!file) {
        throw new Error('Usage: node aws/scripts/set-tunnel-token.mjs <token-file>');
    }
    const token = readFileSync(file, 'utf8').trim();
    if (!token) {
        throw new Error(`${file} is empty`);
    }

    const name = config.params.cloudflareTunnelToken;
    log(`Storing the tunnel token in ${name}`);
    const exists = tryAws(['ssm', 'get-parameter', '--name', name], /ParameterNotFound/, {quiet: true});
    aws([
        'ssm', 'put-parameter',
        '--name', name,
        '--type', 'SecureString',
        '--value', fileArg(token),
        // put-parameter rejects --tags together with --overwrite; tag only on creation.
        ...(exists ? ['--overwrite'] : ['--tags', projectTag]),
    ]);

    rmSync(file);
    console.log(`Deleted ${file}`);
    log('Tunnel token stored. Next: node aws/scripts/deploy.mjs');
});
