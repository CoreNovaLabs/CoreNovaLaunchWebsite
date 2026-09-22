# Upgrading and backing up your deployment

Retention is not a backup, and a backup file is not proof of recoverability. Restore into an isolated environment and check real business data before deleting the old deployment. Container restart tests do not establish EBS recovery or EC2 reboot behavior.

## Data and configuration locations

| Content | Location and backup boundary |
|---------|------------------------------|
| Persistent application data | Host `/var/lib/corenova/app/data` is mounted from the encrypted EBS data volume into the application's declared container path. |
| Ghost | `/var/lib/ghost/content`, including the default SQLite database and uploaded images. A content export is not a full directory backup. |
| Uptime Kuma | `/app/data`, including default SQLite and application configuration. Check monitors, accounts and notifications after restoration. |
| n8n | `/home/node/.n8n`, including the default database and local configuration. Credentials require the original encryption key; workflow exports alone are insufficient. Back up externally injected keys separately and securely. |
| Host configuration and proxy credentials | `/opt/corenova/env`, `/opt/corenova/credentials/admin.txt`, Nginx configuration and TLS certificates live on the root disk, not in a data-volume snapshot. Reconfigure them for a new stack; proxy credentials are not the application's administrator password. |
| External databases, files and services | Outside this data volume; back them up using the respective service's procedures. |

Application startup must require a mounted data volume. A missing disk, unknown filesystem or mount failure must block startup instead of falling back to a root-disk directory. Existing deployments do not automatically receive updated protection when this site's code changes.

Stopping an instance normally retains both disks. Deleting the stack deletes its default root disk but retains the billable data volume. Deleting that retained volume permanently destroys its data. Review [Costs and resource cleanup](/en/docs/aws-costs/) and identify disks using volume IDs recorded from the instance's Storage panel, not names alone.

## Minimum backup: stop writes, then back up the whole dataset

These steps run in your AWS account and incur snapshot and possibly additional resource charges. They are an operator procedure, not a claim that this version has passed an EBS recovery drill in your account.

1. Record the region, stack name, `InstanceId`, data volume ID, application version, full image `tag@digest`, data path and required environment configuration. Store secrets in controlled secret storage, not tickets or public logs.
2. Schedule maintenance and stop external writes. Through SSM, stop the application service: Ghost uses `sudo systemctl stop corenova-ghost`; Uptime Kuma and n8n use `corenova-uptime-kuma` and `corenova-n8n`. Confirm the container stopped; closing the browser is not enough.
3. In EC2 → Volumes, select the recorded data volume ID and create a snapshot. Record its ID and wait for `completed` before resuming writes. Never delete the original volume if the snapshot fails.
4. Start the same service through SSM and verify login and a known business record. Record backup date, image digest, snapshot ID and restoration test results.
5. Add application-native exports when useful. Ghost content exports omit some images, host settings and credentials. n8n workflow exports do not constitute a decryptable credential backup.

AWS Backup can schedule snapshots, but the plan must actually target the intended volume. Monitor job success, retention, alerts and restoration drills. Snapshots do not automatically coordinate application writes; setup is not the end of maintenance.

## Minimum restoration and acceptance checks

**Do not overwrite the original volume or simply attach a snapshot volume as `/dev/sdf` and start the app.** Device identity, filesystem UUID, mount point, permissions and CloudFormation resource relationships all need attention.

1. Keep the original stack and volume. Create an isolated new stack with the same app version and image digest. Keep access private and prevent restored monitors, mail or workflows from affecting external systems.
2. Stop the new application's service. Create a recovery volume from the snapshot in the new instance's availability zone and record its ID. An operator familiar with EBS/Linux mounts must attach and identify it, checking filesystem and ownership rather than guessing NVMe device numbers.
3. Mount the recovery volume read-only at a separate temporary directory. Confirm the expected database, uploads and configuration exist. Copy the complete dataset to the new stack's mounted data volume, preserving ownership, permissions and hidden files. Do not format the recovery volume or copy into an unmounted directory. The new dataset must be empty and disposable; otherwise back it up first.
4. Securely restore necessary application keys and settings. Check the image user, data path and actual mount. Do not overwrite the new stack's host configuration, proxy password or certificates blindly.
5. Start the application and perform the business checks below through private access. Restart the application and repeat the checks. Restore access and scheduling only after confirming that tests cannot send real external notifications.
6. If validation fails, stop the new environment and investigate using the untouched original and backup. Do not let two instances write the same database or overwrite original data with an unverified copy.

| Application | Required checks after restoration |
|-------------|------------------------------------|
| Ghost | Original account can sign in; a known post has the correct title/body; uploaded images load; another post can be published. |
| Uptime Kuma | Original account, monitors and notification settings exist; an isolated target's failure and recovery are detected; a local test receiver actually gets a notification. |
| n8n | Original account and workflows exist; credentials can be decrypted; an isolated workflow executes again with the expected output. |

This manual EBS procedure still requires a real cloud recovery drill. Cross-version migration, disaster recovery failover, automatic rollback and high availability are not guaranteed here. If device identification or mounting is unfamiliar, get qualified operator help before deleting original data.

## Upgrading to a new version

1. Back up the old version, test same-version restoration and read upstream migration instructions.
2. Choose a target in version history, review prerequisites and costs, then create a separate stack.
3. Keep the new environment private and migrate using the upstream procedure. Do not assume database compatibility.
4. Check login, business records, writes, external URLs and callbacks. Schedule a write pause and cutover without creating divergent datasets.
5. Retain the old environment until acceptance. Then delete the old stack and separately review retained volumes, snapshots and logs. **Deleting the old stack does not stop every charge.**

Failed upgrades also incur charges. Budget for both environments while they coexist. Instance termination protection reduces accidental operations but does not replace backups and tested restoration.
