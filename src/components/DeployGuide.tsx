import type { MouseEvent } from "react";
import { useI18n, pick } from "../i18n";
import { useLocalePath } from "./ui";
import { stackNameFor } from "../lib/deploy";
import type { AppCurrent } from "../data/types";
import { deploymentHold } from "../lib/deploymentSafety";

// OutputKey names are contract constants, not translatable data.
const OUTPUT_ROWS: { key: string; labelKey: string }[] = [
  { key: "InstanceId", labelKey: "dg_out_instance_id" },
  { key: "SSMPortForwardCommand", labelKey: "dg_out_ssm_command" },
  { key: "ResolvedLaunchUrl", labelKey: "dg_out_launch_url" },
];

export function DeployPreparation({ app, region, showCost = true }: { app: AppCurrent; region: string; showCost?: boolean }) {
  const { locale, t } = useI18n();
  const l = useLocalePath();
  const cost = showCost ? app.deploy.cost_estimate : undefined;
  return (
    <div className="deployment-preparation">
      <h4>{t("deploy_prepare_title")}</h4>
      <p>{t("deploy_prepare_self_check")}</p>
      <ul>
        <li>{t("deploy_prepare_account", { region })}</li>
        <li>{t("deploy_prepare_access")}</li>
        <li>{t("deploy_prepare_public")}</li>
      </ul>
      <p className="deployment-preparation__cost">
        <strong>{t("est_cost")} · {cost ? t("est_cost_value", { usd: cost.monthly_usd }) : t("cost_shown_in_aws")}</strong>
        {cost?.note && <span>{pick(locale, cost.note)}</span>}
        <span>{t(app.deploy.persistence === "none" ? "deploy_cost_basis_none" : "deploy_cost_basis")}</span>
      </p>
      {app.deploy.persistence === "none" && <p>{t("deploy_stateless_data")}</p>}
      <p className="deploy-guide__warning">{t(app.deploy.persistence === "none" ? "deploy_delete_warning_none" : "deploy_guide_delete_warning")}</p>
      <div className="deployment-preparation__links">
        <a href={l("/docs/verification/")} className="link-blue">{t("deploy_access_help")}</a>
        <a href={l("/docs/aws-costs/")} className="link-blue">{t("deploy_cost_cleanup_help")}</a>
      </div>
    </div>
  );
}

function scrollToDeployment(e: MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  document.getElementById("deployment")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Compact card for the Overview section: where the access URL / public IP come from,
// and the admin entry when the app registered one.
export function DeployQuickRef({ app }: { app: AppCurrent }) {
  const { locale, t } = useI18n();
  const hold = deploymentHold(app);
  if (hold) return <div className="deploy-quickref" role="note">{pick(locale, hold)}</div>;
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
  const l = useLocalePath();
  const hold = deploymentHold(app);
  if (hold) return <div className="deploy-guide" role="note">{pick(locale, hold)}</div>;
  const pd = app.deploy.post_deploy;
  return (
    <div className="deploy-guide">
      <h3 className="deploy-guide__title">{t("deploy_guide_title")}</h3>
      <p className="deploy-guide__detail">{t("deploy_guide_not_status")}</p>
      <ol className="deploy-guide__steps">
        <li>{t("deploy_guide_step1", { stack: stackNameFor(app.app, app.app_version) })}</li>
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
        <li>
          {t("deploy_guide_step4")}
          <p className="deploy-guide__detail">{t("deploy_guide_tunnel_help")}</p>
        </li>
        {pd?.admin_path && (
          <li>
            <strong>{t("deploy_guide_admin_title")}</strong>
            {" — "}
            {t("deploy_guide_admin_entry")} <code>{pd.admin_path}</code>
            {pd.admin_setup && <p className="deploy-guide__detail">{pick(locale, pd.admin_setup)}</p>}
          </li>
        )}
        <li>{t("deploy_guide_finish_setup")}</li>
      </ol>
      <div className="deploy-guide__notes">
        <h4>{t("deploy_https_title")}</h4>
        <p>{t("deploy_https_steps")}</p>
        <pre><code>sudo /opt/corenova/bin/enable-https.sh app.example.com you@example.com --confirm-initialized</code></pre>
        <p>{t("deploy_https_protection")}</p>
        <a href={l("/docs/verification/")} className="link-blue">{t("deploy_access_help")}</a>
      </div>
      <div className="deploy-guide__notes">
        <h4>{t("deploy_failure_title")}</h4>
        <ul>
          <li>{t("deploy_failure_stack")}</li>
          <li>{t("deploy_failure_access")}</li>
          <li>{t("deploy_failure_support")}</li>
        </ul>
        <a href={l("/docs/aws-costs/")} className="link-blue">{t("deploy_cost_cleanup_help")}</a>
      </div>
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
      <div className="deploy-guide__next">
        <h4>{t("deploy_guide_next_title")}</h4>
        <ul>
          {app.deploy.persistence === "none" ? (
            <li>{t("deploy_stateless_data")}</li>
          ) : (
            <>
              {app.deploy.data_path && (
                <li>{t("deploy_guide_next_data", { path: app.deploy.data_path })}</li>
              )}
              <li>
                {t("deploy_guide_next_backup_prefix")}{" "}
                <a href={l("/docs/upgrading-and-backups/")} className="link-blue">
                  {t("deploy_guide_next_backup_link")}
                </a>
              </li>
            </>
          )}
          <li>
            {t("deploy_guide_next_upgrade_prefix")}{" "}
            <a href={l(`/apps/${app.app}/versions/`)} className="link-blue">
              {t("deploy_guide_next_upgrade_link")}
            </a>
          </li>
        </ul>
        <p className="deploy-guide__warning">{t(app.deploy.persistence === "none" ? "deploy_delete_warning_none" : "deploy_guide_delete_warning")}</p>
      </div>
      {app.deploy.template?.revision && (
        <p className="deploy-guide__meta">
          {t("template_evidence_binding")} <code>{app.deploy.template.revision.slice(0, 7)}</code>
          {app.deploy.template.url && (
            <>
              {" · "}
              <a href={app.deploy.template.url} target="_blank" rel="noreferrer" className="link-blue">
                {t("template_evidence_link")}
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}
