# Verification scope and safe access

“Verified” means the checks in a traceable record passed. It does not mean vulnerability-free, maintenance-free or highly available, and this site cannot inspect deployments in your account. Understand the evidence, then initialize through private access.

## Reading the evidence

| Layer | What it establishes | What it does not replace |
|-------|----------------------|---------------------------|
| Container verification | Compose startup, health checks, version assertions, behaviors actually exercised by that test suite, and screenshots. | Network, permissions, storage and access in your AWS account. |
| Platform reference | The record references valid AMI, CloudFormation and runtime evidence. | Deploying this particular application version on EC2. |
| Production check | Declared candidates must be checked against the same image, template and private-access parameters before promotion. | Domain certificate issuance, complete business acceptance, recovery, load or migration tests unless explicitly evidenced. |

Container publishing gates cover startup, health, application tests, version assertions, screenshot generation, and readability of uploaded screenshots, reports and manifests. Platform validity is checked separately. Read the actual test names and results; a working home page does not establish that every business feature works.

Featured-app acceptance targets are: Ghost administrator creation and publishing; Uptime Kuma monitoring with delivery to an isolated notification receiver; n8n workflow creation and execution. After container restart, business records must still be readable and usable. **These targets do not retroactively certify historical records.** Only tests actually executed in that version's report count; screenshots alone cannot establish test coverage.

Versions declaring production checks are staged as candidates. Only passing candidates may update public current and version indexes. Failure preserves the previous stable version; old evidence cannot unlock a new version. Do not infer a production check for historical records lacking its report.

Images are pinned by full `tag@digest`. Template revision identifies the template content at verification time. The current template URL can change; showing a historical revision does not make that URL immutable. Production checks must compare content, not infer a match from timestamps.

## Default: private access through SSM

### Prerequisites

- An AWS account with permission to create CloudFormation, IAM, VPC, EC2, EBS and log resources in a supported region. Read [Costs and cleanup](/en/docs/aws-costs/) first.
- Install [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) and the [Session Manager plugin](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html) locally. Authenticate through your own organization's login or AWS configuration. Do not give this site AWS keys.
- Your IAM identity must be allowed to start SSM sessions on the intended instance and use `AWS-StartPortForwardingSession`. The instance must appear as a Systems Manager managed node. Organization policies, permission boundaries and networking may also restrict access.
- Local port 8080 must be available. A domain and SSH port 22 are not required.

### Create and initialize

1. Review the app's version, region, resources, cost and prerequisites. The CloudFormation link defaults to `LaunchUrl=http://localhost:8080`, `AllowedWebCidr=127.0.0.1/32` and `SelfSignedTls=false`. Do not open public HTTP as a shortcut.
2. Create the stack and wait for `CREATE_COMPLETE`. This indicates infrastructure initialization, not administrator creation. Inspect Events first if creation fails.
3. Copy `SSMPortForwardCommand` from Outputs and run it in your **local terminal**. It uses the stack's instance ID and region to forward local port 8080 to instance port 80. Keep the session open.
4. Open `http://localhost:8080` in your browser. HTTP stays on the local endpoint and instance loopback; the intervening SSM transport is encrypted. This is not a public plaintext login. Do not expose the forwarded local port to your LAN or the internet.
5. Follow the app's instructions to create an administrator, sign out and sign in again, then complete a real task. Admin paths and first-run setup differ by app; there is no universal application administrator password.

Closing the session ends access. Run the Outputs command again to reconnect. If port 8080 is occupied, stop your own conflicting program; changing only the forwarded port can break application links, callbacks or cookies tied to `LaunchUrl`.

## Optional: protected HTTPS after initialization

You need a domain you control, DNS access and permission to operate in your AWS account. This procedure does not register a domain or treat self-signed certificates as production certificates.

1. Complete administrator setup privately first. `--confirm-initialized` is an operator acknowledgement, not an automated check that an application account exists.
2. Point the domain's A record directly at the current instance public IPv4 address. Remove incorrect AAAA records and wait for public DNS propagation. HTTP-01 certificate validation must reach this instance; do not introduce an unverified CDN/proxy first.
3. Review the instance's security group. TCP 80 must be reachable by the ACME service for issuance and renewal; allow TCP 443 from intended clients. Opening ports alone does not open the app: private Nginx policy should still block uninitialized public application access. Do not expose raw container ports or SSH.
4. Open an instance shell using EC2 Connect → Session Manager. Replace the example domain and email before running:

```bash
sudo /opt/corenova/bin/enable-https.sh app.example.com you@example.com --confirm-initialized
```

5. The script checks arguments and DNS, obtains a trusted certificate with Certbot, and configures renewal, Nginx and the app URL. Failure must preserve private access instead of silently serving public HTTP. Troubleshoot through SSM before retrying.
6. HTTPS keeps an additional proxy login. Retrieve `/opt/corenova/credentials/admin.txt` only through SSM. Do not screenshot it, put it in a support request, or include it in deployment links. Proxy credentials and application administrator credentials are separate.
7. From an external browser, check your own `https://domain`: no certificate warning, unauthorized requests denied, authenticated application login working. Check generated URLs, callbacks and cookies, then inspect Certbot renewal scheduling. HTTP may redirect to HTTPS but must not accept credentials.

SSM remains the management path, although the application may redirect to its configured HTTPS origin. **Authenticated HTTPS is not an anonymous public site.** Anonymous Ghost readers, public status pages and external webhooks may be blocked by proxy authentication. They require separately designed and tested route-level access; do not simply remove all protection.

Stopping and restarting EC2 may change its public IP, requiring DNS updates. Certificates and host settings are not part of a data-volume snapshot; reconfigure them on a replacement instance. Older instances without this script are not changed by updated website instructions.

## Troubleshooting and safe exit

| Problem | Next step |
|---------|-----------|
| Missing creation permissions | Check account/region, the denied operation in CloudFormation Events, IAM boundaries and organization policies. Never paste keys into this site. |
| Rollback or initialization timeout | Find the earliest `CREATE_FAILED` reason. If SSM is available, inspect cfn-init logs, container state and the data mount. Never bypass mount protection to force startup. |
| SSM session cannot start | Check CLI identity, region, plugin, managed-node status, session permissions and local port 8080. |
| Public access denied | Expected in default private mode. Use the SSM tunnel rather than opening `AllowedWebCidr` for public HTTP. |
| HTTPS/domain error | Keep private access. Check public DNS, incorrect AAAA records, port 80 reachability, Certbot errors and renewal tasks. Never ignore certificate warnings. |
| Administrator setup fails | Inspect application logs and its actual admin path privately. Distinguish proxy credentials from application accounts. Do not reset a database containing existing data to retry setup. |

For support, share only app/version, region, failed resource name, reproduction steps and redacted errors. Logs may contain passwords, tokens and connection strings; review them before publication. To abandon a deployment, follow [Cleanup](/en/docs/aws-costs/) and review retained volumes, snapshots and logs. Failures and rollbacks can still leave billable resources.

## Outside the guarantee

Without report evidence, do not assume EC2 reboot, trusted certificate issuance/renewal, EBS backup recovery, migration, production load or vulnerability auditing has been tested. Your account's permissions, quotas, network and external dependencies require validation. Featured-app acceptance targets do not imply equivalent coverage for every catalog entry.
