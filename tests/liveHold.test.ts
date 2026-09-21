import assert from "node:assert/strict";
import test from "node:test";

import { verifiedDeployOptions } from "../src/lib/deploy.ts";
import { applyLiveHold } from "../scripts/lib/liveHold.mjs";

const HOLD = { reason: { en: "Paused pending production check.", zh: "暂停待生产核对。" } };

interface VersionRecord {
  app_version: string;
  website: {
    app: string;
    app_version: string;
    ami_id: string;
    region: string;
    deploy: Record<string, unknown> & { hold?: unknown };
  };
}

// A complete version-record website section, as published by Repo C.
function record(version: string, hold?: unknown): VersionRecord {
  return {
    app_version: version,
    website: {
      app: "code-server",
      app_version: version,
      ami_id: "ami-0123456789abcdef0",
      region: "us-east-1",
      deploy: {
        docker_image: "codercom/code-server:latest",
        container_port: 8080,
        regions: ["us-east-1"],
        instance_type: "t3.small",
        data_volume_gb: 30,
        data_path: "/home/coder",
        health_check_path: "/",
        documentation_url: "https://code-server.dev",
        ...(hold ? { hold } : {}),
      },
    },
  };
}

const asCurrent = (r: VersionRecord) => r.website as never;

test("live pause blocks every version, even records verified before the hold existed", () => {
  const vOld = record("v4.137.0"); // snapshot carries no hold (verified before §2.5)
  assert.ok(verifiedDeployOptions(asCurrent(vOld), "sha256:aaa")); // evidence-complete…
  applyLiveHold({ deploy: { hold: HOLD } } as never, [vOld]);
  assert.deepEqual(vOld.website.deploy.hold, HOLD);
  assert.equal(verifiedDeployOptions(asCurrent(vOld), "sha256:aaa"), null); // …but the pause blocks it
});

test("lifted pause unblocks a version whose frozen snapshot still carries the hold", () => {
  const vHeld = record("v4.138.0", HOLD); // verified during the pause — hold baked in
  assert.equal(verifiedDeployOptions(asCurrent(vHeld), "sha256:bbb"), null); // the old bug
  applyLiveHold({ deploy: {} } as never, [vHeld]);
  assert.equal("hold" in vHeld.website.deploy, false);
  const options = verifiedDeployOptions(asCurrent(vHeld), "sha256:bbb");
  assert.ok(options);
  assert.equal(options.appVersion, "v4.138.0");
});

test("normalisation touches only the hold key and is repeatable", () => {
  const list = [record("v2"), record("v1", HOLD)];
  applyLiveHold({ deploy: { hold: HOLD } } as never, list);
  applyLiveHold({ deploy: {} } as never, list);
  assert.equal(list[0].website.deploy.data_path, "/home/coder");
  assert.equal(list[0].website.deploy.hold, undefined);
  assert.equal(list[1].website.deploy.hold, undefined);
});
