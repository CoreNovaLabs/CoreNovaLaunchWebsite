// deployment-contract.md §2.5：deploy.hold 是应用级的实时运维态，唯一实时事实源是
// current.json（由 sync_holds.py / L1.5 维护）。版本记录 website.deploy 里的 hold 是
// 验证时刻的不可变快照，直接消费会双向失真：暂停解除后被旧快照永久拦（该版本证据
// 明明完整），暂停期间又因快照缺失而放行旧版本。故构建期一律以 current.json 覆写，
// 前端 deploymentHold()/verifiedDeployOptions() 逻辑不变。

export function applyLiveHold(current, manifests) {
  const live = current?.deploy?.hold ?? null;
  for (const m of manifests) {
    const dep = m?.website?.deploy;
    if (!dep || typeof dep !== "object") continue;
    if (live) dep.hold = live;
    else delete dep.hold;
  }
  return manifests;
}
