# What a deployment costs

Every CoreNova Launch deployment runs **in your own AWS account**. There is no
CoreNova fee — the only bill you get is from AWS, for the resources the
CloudFormation stack creates. This page explains what those resources are and
how to keep the bill predictable.

## What the default stack costs

The verified default for small stateful apps is one EC2 `t3.small` instance
plus a 30 GB gp3 data volume. On-demand, in `us-east-1`, that is roughly:

| Resource | Rough monthly price |
|----------|--------------------|
| t3.small instance (730 h, on-demand) | ~$15.2 |
| 30 GB gp3 EBS volume | ~$2.4 |
| **Total, default configuration** | **~$18 / month** |

Each app's detail page shows this estimate as the **Est. AWS cost** card. The
number and its basis are registered per app at verification time — we do not
compute prices in your browser, so what you read is what was checked.

## What can push the bill up

- **Instance size.** The deploy wizard lets you change the instance type. The
  verified default is preselected; larger types cost more.
- **Disk size.** The data volume can be resized at deploy time (30–500 GB in
  the wizard). gp3 storage is billed per GB-month.
- **Data transfer out.** Traffic from your instance to the internet is billed
  by AWS; heavy public use can exceed the compute cost.
- **Region.** Prices differ slightly per region; estimates on this site are
  us-east-1 based.

## Ways to spend less

- **Stop the instance** when you don't need it (EC2 console → Instance state →
  Stop). The EBS volume and its data survive a stop; only compute billing
  pauses. Start it again and the app comes back.
- **Right-size the instance.** If the app is idle, a smaller type in the wizard
  may be enough — you own the trade-off between cost and headroom.
- **Delete the stack when you're done.** CloudFormation delete removes
  everything, including the data volume. Back up first (see
  [Upgrading and backups](/docs/upgrading-and-backups/)).

## Free tier and caution

The AWS free tier (12-month) covers `t2.micro`/`t3.micro` instances — the
verified default `t3.small` is **not** free-tier eligible and bills normally
from hour one. If you experiment, check the estimated charges in your AWS
Billing dashboard rather than waiting for month end.

For exact, current numbers use the official
[AWS Pricing Calculator](https://calculator.aws/). The figures on this site are
estimates for the verified default configuration, refreshed at verification
time.
