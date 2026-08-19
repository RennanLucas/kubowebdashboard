import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

export const ARTICLE_COMPONENTS: Record<string, React.FC> = {
  "tracking-install": () => (
    <div className="space-y-6 text-sm text-foreground/90 leading-relaxed">
      <p>
        Para que o Kubo Analytics possa rastrear as visitas e conversões do seu site, é necessário instalar um pequeno código JavaScript (script) em todas as páginas que você deseja monitorar.
      </p>

      <h3 className="text-lg font-semibold text-foreground mt-8 mb-4">Passo a passo geral</h3>
      <ol className="list-decimal pl-5 space-y-3">
        <li>Vá até <strong>Configurações → Projetos → Instalação</strong> no Kubo Analytics.</li>
        <li>Escolha a sua plataforma (HTML, WordPress, GTM, etc.).</li>
        <li>Copie o código fornecido.</li>
        <li>Cole o código na tag <code>&lt;head&gt;</code> do seu site, antes de fechar <code>&lt;/head&gt;</code>.</li>
        <li>Publique as alterações no seu site.</li>
        <li>Acesse seu próprio site para gerar a primeira visita.</li>
        <li>Volte ao Kubo Analytics e clique em <strong>Verificar Instalação</strong>.</li>
      </ol>

      <h3 className="text-lg font-semibold text-foreground mt-8 mb-4">Guias por plataforma</h3>
      <ul className="space-y-3">
        <li>
          <strong>WordPress:</strong> Instale um plugin como "Insert Headers and Footers" ou "WPCode" e cole o script na seção Head.
        </li>
        <li>
          <strong>Google Tag Manager:</strong> Crie uma nova Tag do tipo "HTML Personalizado", cole o script e defina o acionador para "All Pages".
        </li>
        <li>
          <strong>Shopify:</strong> Vá em "Loja Virtual" {'>'} "Temas" {'>'} "Editar código" e cole o script no arquivo <code>theme.liquid</code> dentro de <code>&lt;head&gt;</code>.
        </li>
        <li>
          <strong>Wix:</strong> Vá em Configurações {'>'} Código personalizado {'>'} Adicionar código, selecione "Cabeçalho" e aplique a todas as páginas.
        </li>
      </ul>

      <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
        <p className="font-medium mb-2">Pronto para instalar?</p>
        <Link to="/settings" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
          Acessar página de Instalação do projeto
        </Link>
      </div>
    </div>
  ),

  "no-data": () => (
    <div className="space-y-6 text-sm text-foreground/90 leading-relaxed">
      <p>
        Você instalou o código, mas o Dashboard continua mostrando "Ainda não há dados disponíveis"? Siga os passos abaixo para resolver.
      </p>

      <h3 className="text-lg font-semibold text-foreground mt-8 mb-4">O que fazer?</h3>
      <ol className="list-decimal pl-5 space-y-4">
        <li>
          <strong>Verifique se o código foi instalado:</strong> Confirme que o script está presente no código-fonte (Ctrl+U) do seu site em produção.
        </li>
        <li>
          <strong>Confirme que o site foi publicado:</strong> Muitas plataformas de CMS exigem que você "Publique" ou limpe o cache após adicionar códigos.
        </li>
        <li>
          <strong>Abra o site em uma nova aba:</strong> Navegue pelo seu site para gerar tráfego real.
        </li>
        <li>
          <strong>Volte ao Kubo:</strong> Acesse as <Link to="/settings" className="text-primary hover:underline">Configurações</Link> e clique em "Verificar instalação".
        </li>
        <li>
          <strong>Aguarde a primeira visita:</strong> Se a instalação estiver correta, o Dashboard será atualizado automaticamente em poucos segundos após a detecção.
        </li>
      </ol>
      <p className="text-muted-foreground mt-6 italic">
        Nota: O Kubo Analytics é imune a grande parte dos bloqueadores de anúncios, mas verifique se você não está usando extensões rigorosas como o uBlock Origin em modo "bloquear scripts de terceiros" ao testar.
      </p>
    </div>
  ),

  "tracking-issues": () => (
    <div className="space-y-6 text-sm text-foreground/90 leading-relaxed">
      <p>Se o Dashboard parou de receber dados ou se o processo de instalação falhou, use esta checklist para identificar o erro.</p>
      
      <h3 className="text-lg font-semibold text-foreground mt-8 mb-4">Checklist de Solução</h3>
      <ul className="list-disc pl-5 space-y-3">
        <li><strong>Código copiado corretamente:</strong> O script não deve estar incompleto ou modificado.</li>
        <li><strong>project_id correto:</strong> Verifique se o ID dentro do script coincide com o projeto selecionado na sua conta do Kubo.</li>
        <li><strong>Script publicado:</strong> O código deve estar no ambiente Live/Produção, e não apenas no rascunho do construtor de sites.</li>
        <li><strong>Domínio correto:</strong> Confirme se o domínio configurado na <Link to="/settings" className="text-primary hover:underline">aba Projetos</Link> bate exatamente com a URL do seu site.</li>
        <li><strong>Bloqueadores de conteúdo / Firewall:</strong> Se o seu site usa Cloudflare com bot-fight agressivo, ele pode bloquear a comunicação.</li>
        <li><strong>Cache / CDN:</strong> Purgue o cache do seu servidor ou plugin de otimização (LiteSpeed, WP Rocket, Cloudflare) após colar o código.</li>
      </ul>
      <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
        <p className="font-medium mb-2">Quer verificar agora?</p>
        <Link to="/settings" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
          Abrir Validador de Instalação
        </Link>
      </div>
    </div>
  ),

  "faq": () => (
    <div className="space-y-8 text-sm text-foreground/90 leading-relaxed">
      <div>
        <h4 className="font-semibold text-base mb-2">Quanto tempo leva para aparecer uma visita?</h4>
        <p className="text-muted-foreground">O sistema é equipado com monitoramento Realtime. Se o painel estiver aberto, as visitas costumam aparecer automaticamente e os eventos são agregados e refletidos no Dashboard em tempo real.</p>
      </div>
      <div>
        <h4 className="font-semibold text-base mb-2">Preciso instalar o código em todas as páginas?</h4>
        <p className="text-muted-foreground">Sim. Para mapear navegação, fontes de tráfego e conversões com precisão, o script principal deve estar presente globalmente (na tag <code>&lt;head&gt;</code> geral do site).</p>
      </div>
      <div>
        <h4 className="font-semibold text-base mb-2">O Kubo funciona com WordPress?</h4>
        <p className="text-muted-foreground">Sim! Funciona perfeitamente em WordPress, Shopify, Wix, Nuvemshop e também pode ser implementado em aplicações Single Page (React, Vue, Angular, Next.js) usando chamadas diretas.</p>
      </div>
      <div>
        <h4 className="font-semibold text-base mb-2">Posso ter vários sites?</h4>
        <p className="text-muted-foreground">No plano Free, você pode monitorar até 1 projeto ativo. No plano Pro, os projetos são ilimitados. Acesse as <Link to="/settings" className="text-primary hover:underline">Configurações</Link> para adicionar ou trocar de projeto.</p>
      </div>
      <div>
        <h4 className="font-semibold text-base mb-2">O que acontece se eu trocar de projeto?</h4>
        <p className="text-muted-foreground">Cada projeto é rigidamente isolado em nosso banco de dados. Ao selecionar um novo projeto, o Dashboard carregará exclusivamente os dados e configurações daquele domínio específico.</p>
      </div>
      <div>
        <h4 className="font-semibold text-base mb-2">Como funciona a IA?</h4>
        <p className="text-muted-foreground">A inteligência artificial analisa o padrão das suas métricas em comparação com períodos anteriores e gera "Insights" automáticos sobre conversões e tráfego. Disponível exclusivamente no Plano Pro com um limite mensal de chamadas para evitar abusos.</p>
      </div>
    </div>
  ),

  // Fallback para outros artigos
  "default": () => (
    <div className="space-y-4 text-sm text-foreground/90">
      <p>Este artigo ainda está sendo elaborado por nossa equipe de suporte.</p>
      <p>Para dúvidas urgentes, por favor utilize os nossos canais de atendimento ou envie um e-mail diretamente.</p>
      <Link to="/settings" className="text-primary hover:underline">Ir para as Configurações</Link>
    </div>
  )
};
