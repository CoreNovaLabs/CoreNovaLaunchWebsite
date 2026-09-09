import assert from "node:assert/strict";
import test from "node:test";

import { buildDeployUrl, stackNameFor, verifiedDeployOptions } from "../src/lib/deploy.ts";

const current = {
  app: "ghost",
  app_version: "v6.62.0",
  ami_id: "ami-0123456789abcdef0",
  region: "us-east-1",
  deploy: {
    docker_image: "ghost:6.62.0-alpine",
    container_port: 2368,
    regions: ["us-east-1"],
    instance_type: "t3.small",
    data_volume_gb: 30,
    data_path: "/var/lib/ghost/content",
    health_check_path: "/",
    app_url_env_name: "url",
    extra_environment: ["database__client=sqlite3"],
  },
} as never;

test("deep link maps every verified runtime field to its CloudFormation parameter", () => {
  const options = verifiedDeployOptions(current, "sha256:abc123");
  assert.ok(options);
  const url = new URL(buildDeployUrl(options));
  const params = new URLSearchParams(url.hash.split("?")[1]);

  assert.equal(params.get("stackName"), "corenova-ghost-v6-62-0");
  assert.equal(params.get("param_ImageReference"), "ghost:6.62.0-alpine@sha256:abc123");
  assert.equal(params.get("param_AmiId"), "ami-0123456789abcdef0");
  assert.equal(params.get("param_InstanceType"), "t3.small");
  assert.equal(params.get("param_DataVolumeSize"), "30");
  assert.equal(params.get("param_DataContainerPath"), "/var/lib/ghost/content");
  assert.equal(params.get("param_HealthCheckPath"), "/");
  assert.equal(params.get("param_AppUrlEnvironmentName"), "url");
  assert.equal(params.get("param_ExtraEnvironment"), "database__client=sqlite3");
  assert.equal(params.has("param_DiskGb"), false);
});

test("old records cannot silently deploy with template defaults", () => {
  const incomplete = structuredClone(current) as typeof current;
  delete (incomplete as { deploy: { health_check_path?: string } }).deploy.health_check_path;
  assert.equal(verifiedDeployOptions(incomplete, "sha256:abc123"), null);
  assert.equal(verifiedDeployOptions(current, undefined), null);
});

test("version identity prevents two verified versions from sharing one stack name", () => {
  assert.notEqual(stackNameFor("ghost", "v6.61.0"), stackNameFor("ghost", "v6.62.0"));
});
