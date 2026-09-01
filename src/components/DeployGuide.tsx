// Standardized post-deployment guidance (app-schema rule 17 / deployment-contract §3.2).
//
// Steps 1–4 are platform-generic and identical for every app; the CloudFormation output
// keys named here match the one-click template's Outputs (KEEP_OUTPUTS whitelist).
// Step 5 + notes are per-app data from deploy.post_deploy — records without it render
// only the generic steps and must never invent admin paths or credential hints.
import type { MouseEvent } from "react";
import { useI18n, pick } from "../i18n";
import { stackNameFor } from "../lib/deploy";
import type { AppCurrent } from "../data/types";

// OutputKey names are contract constants, not translatable data.
const OUTPUT_ROWS: { key: string; labelKey: string }[] = [
  { key: "ResolvedLaunchUrl", labelKey: "dg_out_launch_url" },
  { key: "PublicIp", labelKey: "dg_out_public_ip" },
  { key: "PublicDnsName", labelKey: "dg_out_public_dns" },
];

function scrollToDeployment(e: MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  document.getElementById("deployment")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Compact card for the Overview section: where the access URL / public IP come from,
// and the admin entry when the app registered one.
export function DeployQuickRef({ app }: { app: AppCurrent }) {
  const { locale, t } = useI18n();
  const pd = app.deploy.post_deploy;
  return (
    <div className="deploy-quickref">
      <h3 className="deploy-quickref__title">{t("deploy_overview_title")}</h3>
      <div className="deploy-quickref__rows">
        <div className="deploy-quickref__row">
          <span className="deploy-quickref__label">{t("launch_url")}</span>
          <span className="deploy-quickref__value mono">{t("deploy_overview_access_from")}</span>
        </div>
        <div className="deploy-quickref__row">
          <span className="deploy-quickref__label">{t("dg_out_public_ip")}</span>
          <span className="deploy-quickref__value mono">{t("deploy_overview_ip_from")}</span>
        </div>
        {pd?.admin_path && (
          <div className="deploy-quickref__row">
            <span className="deploy-quickref__label">{t("deploy_overview_admin_label")}</span>
            <span className="deploy-quickref__value">
              <code>{pd.admin_path}</code>
              {pd.admin_setup && <span> · {pick(locale, pd.admin_setup)}</span>}
            </span>
          </div>
        )}
      </div>
      <a className="deploy-quickref__link" href="#deployment" onClick={scrollToDeployment}>
        {t("deploy_overview_view_guide")}
      </a>
    </div>
  );
}

// The full numbered guide, rendered under the Quick Deploy card.
export function DeployGuide({ app }: { app: AppCurrent }) {
  const { locale, t } = useI18n();
  const pd = app.deploy.post_deploy;
  return (
    <div className="deploy-guide">
      <h3 className="deploy-guide__title">{t("deploy_guide_title")}</h3>
      <ol className="deploy-guide__steps">
        <li>{t("deploy_guide_step1", { stack: stackNameFor(app.app) })}</li>
        <li>{t("deploy_guide_step2")}</li>
        <li>
          {t("deploy_guide_step3")}
          <ul className="deploy-guide__outputs">
            {OUTPUT_ROWS.map((row) => (
              <li key={row.key}>
                <code>{row.key}</code>
                <span>{t(row.labelKey)}</span>
              </li>
            ))}
          </ul>
        </li>
        <li>{t("deploy_guide_step4")}</li>
        {pd?.admin_path && (
          <li>
            <strong>{t("deploy_guide_admin_title")}</strong>
            {" — "}
            {t("deploy_guide_admin_entry")} <code>{pd.admin_path}</code>
            {pd.admin_setup && <p className="deploy-guide__detail">{pick(locale, pd.admin_setup)}</p>}
          </li>
        )}
      </ol>
      {pd?.notes && pd.notes.length > 0 && (
        <div className="deploy-guide__notes">
          <h4>{t("deploy_guide_notes")}</h4>
          <ul>
            {pd.notes.map((note, i) => (
              <li key={i}>{pick(locale, note)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
