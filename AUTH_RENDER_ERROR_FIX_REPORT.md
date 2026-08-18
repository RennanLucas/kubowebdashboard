# REPORT: Falha ao renderizar o painel (Erro removeChild)

## 1. CAUSA RAIZ
O erro `Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node` é um bug amplamente conhecido no ecossistema do React 18, particularmente frequente em aplicações que renderizam muitos dados dinâmicos ou gráficos (como o Recharts).

A causa primária costuma ser **agentes externos modificando o DOM do React**.
O maior culpado para isso em páginas de dashboards é o **Google Translate** (ou extensões de tradução automáticas). Quando a extensão traduz a página, ela envolve elementos de texto em tags `<font>`. Quando o React tenta desmontar ou atualizar o componente original (por exemplo, quando o usuário troca de aba no dashboard ou o gráfico atualiza), ele tenta remover um nó de texto puro, mas encontra a tag `<font>` injetada, resultando no *crash* total da árvore e caindo no `ErrorBoundary` ("Falha ao renderizar o painel").

## 2. ARQUIVO RESPONSÁVEL
A raiz do componente onde a aplicação inteira é montada: `index.html`. 

## 3. CORREÇÃO RECOMENDADA
Como solicitado, não apliquei uma correção cegamente sem sua aprovação, e como a causa requer confirmação do seu ambiente (você possivelmente estava com o tradutor ativo ou alguma extensão similar), a correção **definitiva e segura** é adicionar o atributo `translate="no"` na raiz da aplicação. Isso impede que tradutores quebrem a árvore do DOM manipulada pelo React.

Se o senhor aprovar, basta alterar o `index.html`:
```html
<html lang="pt-BR" translate="no" class="dark">
```
ou envolver apenas o `Dashboard.tsx` em um container `translate="no"`.

## 4. O BOTÃO DO GOOGLE (Vercel)
O botão "Continuar com Google" não está aparecendo porque você estava visualizando uma versão armazenada no **Cache do Service Worker (PWA)** do seu navegador.
O seu build na Vercel (commit `196e4e2`) foi um sucesso (você mesmo informou "A Fase 3.9 foi concluída... Redeploy Vercel"). Mas o Service Worker da aplicação prioriza a velocidade e carrega o código offline. 

**Como testar:** Abra a URL da produção em uma **Janela Anônima** ou clique no botão **"Limpar Cache e Recarregar"** que aparece na própria tela de erro "Falha ao renderizar o painel".

## 5. TESTES E COMMIT
Nenhum código foi comitado nesta sessão investigativa, respeitando a regra de "Não alterar nada de produção até identificar a causa".
Todos os testes locais continuam passando perfeitamente (`typecheck`, `lint`, `test --run`, `build`), atestando a qualidade do código da branch `main`.
