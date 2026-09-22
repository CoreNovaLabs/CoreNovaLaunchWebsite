import type { AppCurrent, Localized } from "./types";

export interface AppFaqItem {
  question: Localized;
  answer: Localized;
}

// FAQ shown on the app detail page (#faq) and emitted as JSON-LD FAQPage.
// App-specific details are projected from the Manifest; the generic wording only
// explains the platform workflow and never invents credentials or data paths.
export function appFaq(app: AppCurrent): AppFaqItem[] {
  const name = app.display_name;
  const setup = app.deploy.post_deploy?.admin_setup;
  const access: AppFaqItem = {
    question: {
      en: `How do I access ${name.en} after deployment?`,
      zh: `部署后如何访问${name.zh}？`,
    },
    answer: {
      en: `After CREATE_COMPLETE, run SSMPortForwardCommand from the stack Outputs in your local terminal and keep it running. Open http://localhost:8080 to initialize the application privately. Public access stays blocked until you explicitly enable HTTPS.${setup?.en ? ` ${setup.en}` : ""}`,
      zh: `栈达到 CREATE_COMPLETE 后，在本机终端运行 Outputs 中的 SSMPortForwardCommand 并保持连接，再打开 http://localhost:8080 私下完成应用初始化。公网访问默认关闭，需另行启用 HTTPS。${setup?.zh ? ` ${setup.zh}` : ""}`,
    },
  };

  if (app.deploy.data_path) {
    return [
      access,
      {
        question: {
          en: "Where are application data and credentials stored?",
          zh: "应用数据和凭据保存在哪里？",
        },
        answer: {
          en: `Application data is mounted at ${app.deploy.data_path} from the encrypted EBS data volume. The volume survives stack deletion and keeps billing; retention is not a backup. Platform proxy credentials and host configuration are on the root disk and are not included in a data-volume snapshot. See the backup guide before deleting anything.`,
          zh: `容器内的 ${app.deploy.data_path} 挂载自加密 EBS 数据卷；删栈后数据卷保留并继续计费，保留不等于备份。平台代理凭据及主机配置位于系统盘，不包含在数据卷快照中。删除资源前请按备份指南核对数据。`,
        },
      },
    ];
  }

  return [
    access,
    {
      question: {
        en: "Where does the deployment run?",
        zh: "应用会部署到哪里？",
      },
      answer: {
        en: "CoreNova Launch provides verified deployment artifacts; all resources run in your own AWS account.",
        zh: "CoreNova Launch 提供已验证的部署产物，所有资源都运行在你自己的 AWS 账号中。",
      },
    },
  ];
}
