# Upgrading and backing up your deployment

A CoreNova Launch deployment is a standard CloudFormation stack in your AWS
account: one EC2 instance, one encrypted gp3 data volume, and the app running
in Docker. This page explains where your data lives, how to protect it, and
what upgrading to a newly verified version looks like.

## Where your data lives

The app's persistent data (posts, databases, uploads) is written to the
**data volume** — an encrypted gp3 EBS disk attached to the instance, mounted
into the container at a fixed path. The stack's Outputs tab shows the
`InstanceId` if you need to locate it in the EC2 console.

Two consequences worth internalizing:

- **Stopping the instance keeps the data.** Start it again and the app resumes.
- **Deleting the stack deletes the data.** CloudFormation delete removes the
  instance *and* its data volume. There is no soft-delete.

## Backing up

Two complementary options:

1. **EBS snapshot (whole volume).** EC2 console → Instances → select the
   stack's instance → Actions → Volume → Create snapshot. Snapshots are
   incremental and stored in S3 behind the scenes; restore by creating a new
   volume from the snapshot. This captures everything, including data not
   covered by app-level exports.
2. **App-native export (recommended in addition).** Most apps have a built-in
   export — for example Ghost's admin console has **Labs → Export your
   content**. App-level exports are portable and survive infrastructure
   changes entirely.

For anything you care about, do both: snapshots are cheap insurance, app
exports are the ones you can actually move elsewhere.

## Upgrading to a new verified version

New versions are verified and published on the app's page continuously. We
don't hot-swap a running stack — an upgrade is a **new stack, new version**:

1. Open the app's **Versions** page and find the newly verified version.
2. Click **Deploy** on that row. The deploy URL is pinned to *that version's*
   verified image digest, so the new stack runs exactly what was tested.
3. CloudFormation opens with a fresh stack (give it a new stack name, e.g.
   `corenova-ghost-v2`). Wait for `CREATE_COMPLETE`.
4. Migrate your data: restore your app-native export through the new
   deployment's import/restore path (Ghost: Labs → Import), or restore the
   EBS snapshot onto the new instance's volume if you need a byte-identical copy.
5. Verify the new deployment, then delete the old stack so it stops billing.

This one-stack-per-version model keeps upgrades boring: the old deployment
keeps running untouched until you delete it, and a failed upgrade costs you
nothing but a delete.

## Protecting a running deployment

The deploy wizard supports **termination protection** — when enabled, the
instance refuses accidental termination until you explicitly disable
protection. It protects against fat-fingers, not against stack deletion: the
only real protection for your data is a backup you have tested restoring.
