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
      en: `After the CloudFormation stack reaches CREATE_COMPLETE, open ResolvedLaunchUrl in the stack Outputs.${setup?.en ? ` ${setup.en}` : ""}`,
      zh: `CloudFormation 栈达到 CREATE_COMPLETE 后，在栈的 Outputs 中打开 ResolvedLaunchUrl。${setup?.zh ? ` ${setup.zh}` : ""}`,
    },
  };

  if (app.deploy.data_path) {
    const note = app.deploy.post_deploy?.notes?.[0];
    return [
      access,
      {
        question: {
          en: "Where are application data and credentials stored?",
          zh: "应用数据和凭据保存在哪里？",
        },
        answer: {
          en: `Application data is stored at ${app.deploy.data_path} inside the container on the retained encrypted EBS data volume.${note?.en ? ` ${note.en}` : ""}`,
          zh: `应用数据保存在容器内的 ${app.deploy.data_path}，位于保留的加密 EBS 数据卷上。${note?.zh ? ` ${note.zh}` : ""}`,
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
