import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

const installUrl = "/settings?tab=general&action=install";

function Article({ children }: { children: ReactNode }) {
  return <div className="space-y-7 text-sm leading-relaxed text-foreground/90">{children}</div>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="space-y-3"><h2 className="text-xl font-semibold text-foreground">{title}</h2>{children}</section>;
}

function Note({ children, warning = false }: { children: ReactNode; warning?: boolean }) {
  const Icon = warning ? AlertTriangle : Info;
  return <div className={`flex gap-3 rounded-xl border p-4 ${warning ? "border-amber-500/30 bg-amber-500/10" : "border-primary/20 bg-primary/5"}`}><Icon className={`mt-0.5 h-5 w-5 shrink-0 ${warning ? "text-amber-600" : "text-primary"}`} /><div>{children}</div></div>;
}

function Checklist({ children }: { children: ReactNode }) { return <ul className="space-y-2">{children}</ul>; }
function Check({ children }: { children: ReactNode }) { return <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /><span>{children}</span></li>; }
function Code({ children }: { children: string }) { return <pre className="overflow-x-auto rounded-xl border bg-muted/50 p-4 text-xs"><code>{children}</code></pre>; }
function InstallLink({ children = "Abrir instalação do projeto" }: { children?: ReactNode }) { return <Link to={installUrl} className="font-semibold text-primary hover:underline">{children} →</Link>; }

export const ARTICLE_COMPONENTS: Record<string, React.FC> = {
  "tracking-install": () => <Article>
    <p>O código de rastreamento conecta seu site ao projeto correto. Ele deve aparecer uma única vez no <code>&lt;head&gt;</code> de todas as páginas.</p>
    <Section title="Instalação em seis passos"><ol className="list-decimal space-y-2 pl-5">
      <li>Abra <InstallLink>Configurações e instalação</InstallLink>.</li><li>Escolha o projeto e a plataforma do seu site.</li><li>Copie o código sem alterar o endereço nem o identificador do projeto.</li><li>Cole antes de <code>&lt;/head&gt;</code> e publique a alteração.</li><li>Clique em <strong>Verificar instalação</strong> e, sem fechar a janela, abra o site em outra aba.</li><li>Navegue por alguns segundos até a confirmação aparecer.</li>
    </ol></Section>
    <Section title="WordPress, Shopify, Wix e GTM"><Checklist><Check><strong>WordPress:</strong> use o editor do tema ou um plugin de inserção no cabeçalho.</Check><Check><strong>Shopify:</strong> adicione ao <code>theme.liquid</code>, dentro do <code>&lt;head&gt;</code>.</Check><Check><strong>Wix:</strong> use Código personalizado, no cabeçalho e em todas as páginas.</Check><Check><strong>Google Tag Manager:</strong> crie uma tag HTML personalizada, acione em todas as páginas e publique o contêiner.</Check></Checklist></Section>
    <Note>Se o modo LGPD estiver ativado, nenhuma visita será enviada antes de seu banner chamar <code>window.kuboweb.consent(true)</code>.</Note>
  </Article>,

  "no-data": () => <Article>
    <p>Na maioria dos casos, os dados não aparecem porque o código ainda não foi publicado, o projeto selecionado é outro ou o consentimento não foi concedido.</p>
    <Section title="Diagnóstico rápido"><ol className="list-decimal space-y-3 pl-5"><li>Confirme no código-fonte do site publicado que o script está no <code>&lt;head&gt;</code>.</li><li>Confira se o identificador do script pertence ao projeto aberto no Kubo.</li><li>Limpe o cache do site/CDN e teste em uma janela anônima sem bloqueadores.</li><li>Se usa consentimento obrigatório, aceite Analytics no banner durante o teste.</li><li>Abra <InstallLink>o verificador</InstallLink> e gere uma nova visita enquanto ele estiver escutando.</li><li>Confira o período selecionado no Dashboard e a página Live.</li></ol></Section>
    <Note warning>Bloqueadores de conteúdo, políticas de segurança e firewalls podem impedir a requisição. O Kubo não promete contornar essas ferramentas.</Note>
  </Article>,

  "tracking-issues": () => <Article>
    <p>Use esta lista quando a verificação falhar ou o recebimento parar.</p><Checklist><Check>O script está completo, sem caracteres removidos e sem duplicação.</Check><Check>O projeto e o domínio configurados correspondem ao site testado.</Check><Check>A alteração está publicada em produção, não apenas salva no editor.</Check><Check>O navegador consegue acessar o endereço da função <code>tracker-script</code>.</Check><Check>O banner LGPD chama o consentimento somente após a escolha do visitante.</Check><Check>Cache, CSP, extensão de privacidade e firewall foram considerados no teste.</Check></Checklist>
    <Note>O verificador procura uma visita nova. Inicie a verificação primeiro e abra o site depois.</Note><InstallLink>Abrir o verificador de instalação</InstallLink>
  </Article>,

  "metrics-explained": () => <Article>
    <Section title="Indicadores principais"><Checklist><Check><strong>Visitantes:</strong> pessoas ou navegadores únicos identificados no período.</Check><Check><strong>Visualizações:</strong> carregamentos de páginas rastreadas.</Check><Check><strong>Sessões:</strong> grupos de navegação de um visitante.</Check><Check><strong>Leads:</strong> interações de conversão, como WhatsApp e formulário.</Check><Check><strong>Taxa de conversão:</strong> proporção entre leads e visitantes.</Check><Check><strong>Valor estimado:</strong> leads multiplicados pelo valor configurado por lead.</Check></Checklist></Section>
    <Note warning>Valor estimado não é faturamento comprovado. Ele serve para projeção e depende do valor por lead informado em Configurações.</Note><Section title="Como interpretar corretamente"><p>Compare períodos equivalentes, confira o projeto ativo e use origem, página, dispositivo e localização para entender de onde veio a mudança.</p></Section>
  </Article>,

  "dashboard-guide": () => <Article>
    <p>O Dashboard resume o desempenho do projeto ativo no período selecionado.</p><Section title="Ordem recomendada de análise"><ol className="list-decimal space-y-2 pl-5"><li>Confirme o projeto e o intervalo de datas no topo.</li><li>Leia visitantes, visualizações, leads e conversão.</li><li>Observe o gráfico para localizar picos e quedas.</li><li>Analise origens, UTMs e páginas mais acessadas.</li><li>Confira dispositivos e localização aproximada.</li><li>Abra Live para atividade atual e Metas e Funis para conversões.</li></ol></Section><Note>Recursos com cadeado são controlados pelo plano da organização. Isso é um bloqueio esperado, não uma falha da página.</Note>
  </Article>,

  "goals": () => <Article>
    <p>Metas e Funis mostra a passagem de visitantes por etapas de interesse e conversão, sempre no projeto selecionado.</p><Section title="O que você pode fazer"><Checklist><Check>Definir metas mensais de visitantes, leads e valor estimado.</Check><Check>Editar o mês atual e consultar metas recentes.</Check><Check>Acompanhar WhatsApp, formulários e botões a partir dos eventos recebidos.</Check><Check>Usar o funil para localizar a etapa com maior perda.</Check></Checklist></Section><Note warning>O último estágio é “Leads identificados”. O Kubo não apresenta vendas ou pagamentos simulados como conversões reais.</Note>
  </Article>,

  "events": () => <Article>
    <p>O tracker reconhece cliques comuns em links e botões como interações. Para alimentar categorias específicas de conversão, envie o evento correspondente.</p><Section title="Eventos de conversão"><Code>{`window._kw("whatsapp_click", "botao_whatsapp");\nwindow._kw("form_submit", "formulario_contato");\nwindow._kw("button_click", "cta_orcamento");`}</Code><p>Chame a linha correta no clique ou no envio bem-sucedido. O segundo valor é um rótulo e o terceiro parâmetro, opcional, pode conter metadados.</p></Section><Section title="Não rastrear um elemento"><Code>{`<button data-kw-no-track>Não registrar este clique</button>`}</Code></Section><Note warning>O atributo <code>data-track</code> não classifica conversões no tracker atual. Use <code>window._kw(...)</code>.</Note>
  </Article>,

  "ai-insights": () => <Article>
    <p>Insights com IA transforma métricas do projeto em um resumo com oportunidades e riscos. O recurso pertence ao plano Pro.</p><Section title="Como usar"><ol className="list-decimal space-y-2 pl-5"><li>Selecione o projeto correto.</li><li>Escolha a janela de análise disponível.</li><li>Gere a análise e confira as métricas usadas como fonte.</li><li>Use o histórico para comparar resultados e exporte quando necessário.</li></ol></Section><Note>O plano Pro permite até 10 análises por mês. Poucos dados podem produzir uma análise limitada; a IA apoia decisões, mas não substitui a leitura das métricas.</Note>
  </Article>,

  "projects": () => <Article>
    <p>Um projeto representa um site e mantém seu identificador e dados separados dos demais.</p><Section title="Criar e conectar"><ol className="list-decimal space-y-2 pl-5"><li>Abra Configurações, informe nome e endereço do site e crie o projeto.</li><li>Abra a instalação, copie o código e publique-o no site correto.</li><li>Execute a verificação gerando uma visita nova.</li><li>Use o seletor de projeto para alternar o Dashboard.</li></ol></Section><p>O plano Gratuito permite 1 projeto. O Pro permite projetos ilimitados. Nome e URL podem ser editados; confirme cuidadosamente antes de excluir.</p><InstallLink>Gerenciar projetos</InstallLink>
  </Article>,

  "members": () => <Article>
    <p>A organização separa os acessos da equipe. As permissões devem sempre ser avaliadas no contexto da organização ativa.</p><Section title="Perfis de acesso"><Checklist><Check><strong>Owner:</strong> responsável principal e acesso administrativo.</Check><Check><strong>Admin:</strong> gerencia configurações e equipe.</Check><Check><strong>Editor:</strong> trabalha com os recursos permitidos.</Check><Check><strong>Viewer:</strong> acesso de leitura.</Check></Checklist></Section><p>Use as abas <strong>Membros</strong> e <strong>Convites</strong> em Configurações. Antes de considerar um convite concluído, confirme que o destinatário recebeu e conseguiu aceitar o acesso na organização correta.</p><Note warning>Nunca compartilhe senha. Se um convite não chegar ou não puder ser aceito, contate o suporte; não adicione acesso manualmente a outra organização.</Note>
  </Article>,

  "billing-plans": () => <Article>
    <Section title="Gratuito"><p>1 projeto e histórico de 7 dias. IA, Live, Comparar, Apresentação, PDF/CSV, alertas por e-mail, anotações, metas e heatmaps ficam bloqueados. Os alertas dentro do painel continuam disponíveis.</p></Section><Section title="Pro"><p>Projetos ilimitados, histórico de 365 dias, até 10 análises de IA por mês e acesso aos recursos avançados.</p></Section><Section title="Cobrança e cancelamento"><p>A assinatura é processada pelo Mercado Pago. A tela de Assinatura mostra o plano atual. Ao cancelar, o acesso permanece até o fim do período já pago.</p></Section><Note>Os limites efetivos exibidos na tela de Assinatura são a referência para sua organização.</Note>
  </Article>,

  "faq": () => <Article>
    <Section title="Quanto tempo leva para aparecer uma visita?"><p>Normalmente poucos segundos após uma visita válida. Cache, bloqueadores ou consentimento obrigatório podem impedir o envio.</p></Section><Section title="O código precisa estar em todas as páginas?"><p>Sim. Instale-o globalmente no <code>&lt;head&gt;</code> para acompanhar navegação e fontes corretamente.</p></Section><Section title="Funciona em WordPress, Shopify e Wix?"><p>Sim, desde que a plataforma permita inserir o script no cabeçalho e publicar a alteração.</p></Section><Section title="O que o modo LGPD faz?"><p>Com consentimento obrigatório, o tracker não cria identificadores locais nem envia requisições antes de <code>window.kuboweb.consent(true)</code>.</p></Section><Section title="Posso ter vários sites?"><p>O Gratuito permite 1 projeto; o Pro permite projetos ilimitados.</p></Section><Section title="Como pedir ajuda?"><p>Envie um e-mail para <a href="mailto:contato.kuboweb@gmail.com" className="font-medium text-primary">contato.kuboweb@gmail.com</a> informando o projeto e o problema, sem enviar senhas ou chaves secretas.</p></Section>
  </Article>,
};
