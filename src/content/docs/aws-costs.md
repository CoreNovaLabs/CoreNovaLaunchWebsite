# What a deployment costs

CoreNova Launch charges no deployment service fee. Resources run in your own AWS account and AWS bills actual usage. Leaving this website, closing your browser or pausing an app listing does not stop cloud billing. Domains, email and other external services may cost extra.

## Default cost basis

Configuration and accounting review: **2026-09-22**. These are the estimates registered with the applications, not live AWS quotes or a spending limit. Assumptions: `us-east-1`, Linux on-demand, 730 running hours per month, baseline gp3 performance, no free credits or discounts.

Ghost, Uptime Kuma and n8n currently register the same default: `t3.small`, a 20 GB root disk and a 30 GB data disk.

| Resource | Basis | Approximate monthly cost |
|----------|-------|--------------------------|
| t3.small instance | $0.0208/hour × 730 hours | $15.18 |
| 20 GB gp3 root disk | $0.08/GB-month | $1.60 |
| 30 GB gp3 data disk | $0.08/GB-month | $2.40 |
| One public IPv4 address | $0.005/hour × 730 hours | $3.65 |
| **Base resource total** | Rounded sum of all four items | **About $23/month** |

Private SSM access still uses an instance with a public IPv4 address; that cost does not disappear. Each detail page shows the estimate and explanation from its version's verification record. Other apps and older versions may differ. Changing region, instance size or storage invalidates the default estimate. Check actual rates in the [AWS Pricing Calculator](https://calculator.aws/) before creating resources.

## Excluded charges

- Internet data transfer, EBS snapshots, CloudWatch log ingestion and storage.
- Provisioned gp3 IOPS or throughput above the baseline, and applicable T3 Unlimited surplus CPU credits.
- Additional Elastic IP addresses, backups, DNS, domains, external email or notification services, and taxes.
- Both stacks' compute and storage costs when old and new deployments run together.

AWS free plans, credits and eligible services depend on account creation date and current policy, not just instance type. Check your own Billing dashboard; **do not assume this deployment is free**. Configure AWS Budget alerts before deploying. Alerts are not an automatic shutdown or a hard spending cap.

## Stop, delete stack, and delete volume are different

The data-disk operations below apply only to volume-backed deployments. A record explicitly declaring `deploy.persistence: none` has no application data disk: save work through browser download/export and keep local backups; the server does not persist application data. The instance and root disk still incur charges. Stopping the instance retains the billable root disk; stack deletion terminates the host and deletes its default root disk, with no application data disk to retain. For these deployments, skip data-volume IDs, snapshots and retained-volume deletion in the checklist; still review other billable resources. Do not derive a new price from the volume-backed example above.

| Action | Data and billing consequences |
|--------|-------------------------------|
| Stop EC2 | On-demand compute billing stops. Root/data disks and existing snapshots keep billing. An automatically assigned public IPv4 is normally released; separately allocated Elastic IP addresses need attention. |
| Start EC2 again | Compute billing resumes. The public IP may change; recheck DNS, certificate renewal and access. |
| Delete CloudFormation stack | The instance terminates and its default root disk is deleted. The data disk uses `DeleteOnTermination: false`, survives, and keeps billing. |
| Delete retained data volume | Data on that volume is permanently lost and volume storage billing ends. Existing snapshots are not automatically deleted. |
| Keep snapshots or logs | Charges may continue. Review them separately in the respective services. |

“Deployment paused” in the app catalog only blocks new deployments. It does not stop EC2 instances in your account.

## Safe cleanup checklist

1. **Verify your data first.** Follow [Upgrading and backups](/en/docs/upgrading-and-backups/), back up, and prove restoration with real business data in an isolated environment. Retention is not a backup.
2. **Record ownership.** Open the stack Outputs in the correct region and record `InstanceId`. In the instance's Storage panel, record the data volume ID, size and attachment. Also record snapshots, log groups and any extra resources you created. Similar names are not enough to identify a disk safely.
3. **Delete the intended stack.** Confirm `DELETE_COMPLETE`. If termination protection or `DELETE_FAILED` blocks cleanup, inspect Events and resolve the stated cause instead of deleting unfamiliar resources.
4. **Review retained volumes.** In EC2 → Volumes, find the recorded volume ID. Delete it manually only after confirming that no other instance uses it and that you have tested restoration or no longer need the data.
5. **Review remaining resources.** Inspect EBS Snapshots, AWS Backup recovery points, CloudWatch log groups and separately allocated Elastic IP addresses. Confirm ownership and retention requirements before removing anything.
6. **Check billing again.** Billing/Cost Explorer may lag. Confirm that instances and unwanted retained resources are gone, then observe subsequent charges. A deleted stack does not mean a zero bill.

Apply the same resource checks after failed creation or rollback. Inspect the old stack and leftovers before retrying so repeated attempts do not leave multiple billable environments.
