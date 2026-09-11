/** Public examples never contain an actual customer's project identifier. */
export function installationExamples(baseUrl: string | undefined) {
  if (!baseUrl) return null;
  let url: URL;
  try {
    url = new URL(baseUrl);
    if (url.protocol !== "https:" || url.username || url.password) return null;
  } catch {
    return null;
  }
  const source = `${url.origin}/functions/v1/tracker-script?pid=SEU_PROJECT_ID&consent=required`;
  const tag = `<script defer src="${source.replace(/&/g, "&amp;")}"></script>`;
  const note = "Substitua SEU_PROJECT_ID pelo ID do projeto em Configurações.";
  return {
    html: `<!-- ${note} -->\n${tag}`,
    wordpress: `<!-- ${note} -->\n<!-- Cole em um bloco de scripts do cabeçalho, não diretamente em PHP. -->\n${tag}`,
    nextjs: `// ${note}\nimport Script from "next/script";\n\n<Script\n  src={${JSON.stringify(source)}}\n  strategy="afterInteractive"\n/>`,
    gtm: `<!-- ${note} -->\n<!-- Tag HTML personalizado; configure o acionador e o consentimento do seu site. -->\n${tag}`,
  };
}
