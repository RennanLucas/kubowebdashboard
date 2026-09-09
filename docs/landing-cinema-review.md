# Kubo Analytics — revisão cinematográfica da landing

Revisão de 8 de setembro de 2026. Comparação desta entrega com `669a99297d0ccce9803a6bcf205e1b5ee6520fdc`, na mesma PR 14. Escopo: apresentação da landing; não é uma nova auditoria de pagamentos ou do painel autenticado.

## 1. Direção visual

Azul profundo, luz difusa e tipografia de alto contraste. O produto é o protagonista: hero centralizado, dashboard em perspectiva que se aproxima com a rolagem, capítulos com composições distintas e redução gradual do movimento em planos e FAQ. Sem copiar marcas, adicionar copy ou criar assets fictícios.

## 2. Arquivos modificados/criados nesta revisão

- `src/components/landing/ProfessionalHero.tsx`: contêiner de cena, preservando o conteúdo original.
- `src/pages/Landing.tsx`: troca da camada final de estilos de movimento.
- `src/components/landing/premium/useSpatialExperience.ts`: progresso por capítulo, leitura/escrita de geometria separadas, preferência de movimento e indicação acessível do capítulo ativo.
- `src/components/landing/premium/landing-cinema.css`: direção visual, responsividade, profundidade e animações.
- `scripts/qa-landing-cinema.mjs`: inventário comparativo, imagens por hash, inspeção de largura e capturas no navegador.
- `scripts/qa-landing-frames.mjs`: amostragem local de intervalos entre frames.
- `docs/landing-cinema-review.md`: este relatório.

Nenhuma alteração em dependências, lockfile, APIs, Edge Functions, autenticação, checkout, regras de planos ou arquivos de dados.

## 3. Componentes e inventário preservado

Ordem existente mantida: LandingNav → ProfessionalHero → SignalRail → ProductStory (quatro etapas) → RealtimeSection → InsightsSection (três exemplos) → CapabilitiesSection (seis recursos) → SetupSection (quatro passos) → PremiumPricing → LandingFAQ (seis perguntas) → FinalCTA → PremiumFooter.

Reutilizados ProductDashboard, SpatialBackdrop, SpatialExperienceLayer, useLandingReveal e usePlans. Nenhum novo componente de conteúdo foi necessário. A logo existente foi reutilizada. Textos, dados demonstrativos, benefícios e fontes de planos não foram reescritos.

Inventário automatizado: 35 headings, 24 links, seis respostas do FAQ, uma imagem e metadados de SEO comparados com a base. O texto normalizado contém 5.357 caracteres, sem o readout que alterna por etapa; os dados desse readout continuam no arquivo original, sem alterações. O teste de preços usa o fallback já existente ao bloquear a consulta de planos, para comparar um cenário determinístico; a consulta dinâmica real não foi substituída no produto.

## 4. Sistema de animação

CSS + IntersectionObserver + requestAnimationFrame, reaproveitando os hooks existentes. Três valores por capítulo controlam progresso, deslocamento da cena e entrada. Não há interceptação da roda do mouse, scroll-jacking ou motor WebGL. GSAP e Three.js já constavam do projeto e não foram importados nesta experiência.

## 5. Efeitos 3D

Dashboard com rotateX/rotateY, escala e perspectiva; planos de profundidade no produto, cards laterais, bordas iluminadas e sombras em camadas. Mouse com amplitude de aproximadamente ±2,5° em telas largas e ponteiro preciso. Movimento ambiente de apenas seis pixels de amplitude total. Sem rotação contínua de 360°.

## 6. Scroll e ritmo

- Hero: entrada escalonada de título, descrição, CTAs e painel; na cena desktop, título recua e o dashboard aproxima-se e fica frontal.
- Produto: painel sticky acompanha quatro capítulos e destaca métricas, fontes e gráfico existentes.
- Live: revelação horizontal com perspectiva e eventos em sequência.
- Insights: três camadas com deslocamentos distintos.
- Recursos: bento com entradas em profundidade e traçado de gráfico.
- Instalação: linha de conexão e passos escalonados.
- Planos e FAQ: movimentos mais curtos e calmos.
- Encerramento: sinal em perspectiva cresce com a entrada do CTA.

## 7. Performance

Animações priorizam transform e opacity. O hook atualiza apenas capítulos visíveis, agrupa leituras antes das escritas e usa um frame agendado por evento, não um loop permanente. Listeners, observers e frames são limpos no unmount. Animações CSS pausam fora do viewport. Nenhuma imagem, dependência, canvas ou chunk 3D pesado foi adicionado; o carregamento dividido da rota foi mantido.

Amostra diagnóstica de quatro segundos em Chromium headless local, 1440×1000, ambas as versões em desenvolvimento: média antes 31,1 FPS / depois 40,3 FPS; p95 entre frames de 50,0ms para 33,4ms; frames acima de 50ms de três para um. Uma amostra não é benchmark estatístico: não comprova 60 FPS, desempenho de GPU física ou Web Vitals. O scroll foi amostrado em requestAnimationFrame, não por medição de frames efetivamente apresentados pelo compositor.

## 8. Mobile e telas baixas

Larguras de teste: 375, 390, 430, 768, 1024, 1280, 1440, 1920 e 2560px. Layout móvel em coluna, métricas em duas colunas, fontes abaixo do gráfico, sem efeitos de mouse. Sticky do hero exige largura acima de 1100px e altura mínima de 950px; telas mais baixas usam fluxo natural para não cortar o produto. O storytelling vira conteúdo sequencial em tablet/mobile.

## 9. Acessibilidade e SEO

Conteúdo continua em HTML. Links, CTAs, accordion, semântica, metadados e rotas mantidos. Navegação lateral usa aria-current. Reduced motion remove o deslocamento 3D e o sticky cinematográfico, mantendo as informações acessíveis. Testados teclado, menu móvel, FAQ e mudança de preferência de movimento. Sem alegação de certificação WCAG ou auditoria completa com leitor de tela.

## 10–14. Checks locais

| Check | Resultado |
| --- | --- |
| npm ci | Passou após liberar um executável esbuild preso por um servidor local |
| Typecheck | Passou |
| Lint completo | 0 erros; 218 avisos existentes |
| Vitest | 43 arquivos, 587 testes passaram; sem skips |
| Build final | Passou; Vite em 55,60s; PWA com 128 entradas |
| E2E da landing | 11/11 passaram novamente após o refinamento final; sem skips; 1,9min |
| Comparação de conteúdo | Passou no cenário determinístico descrito acima |
| Revisão visual | Duas passadas, sendo a final sobre o build servido localmente; desktop e mobile |
| Overflow / erros no navegador | Nenhum nas nove larguras da segunda passada |

Os testes existentes não foram alterados para acomodar falhas. Suites de checkout e multi-tenancy não foram executadas nesta revisão visual.

## 15. Bundle

Valores em bytes; gzip calculado sobre os arquivos gerados, não sobre o tráfego total da página.

| Parte da landing | Antes bruto / gzip | Depois bruto / gzip |
| --- | ---: | ---: |
| JavaScript | 33.626 / 10.214 | 34.176 / 10.378 |
| CSS | 70.041 / 15.633 | 80.231 / 17.365 |
| Total | 103.667 / 25.847 | 114.407 / 27.743 |

Acréscimo da rota: **1.896 bytes gzip** (aproximadamente 1,85 KiB). Sem novas dependências nem chunks adicionais específicos de 3D. O CSS global permaneceu em 144.722 bytes brutos / 23.537 gzip. Hashes de outros arquivos podem mudar por referências de build, sem novas funcionalidades nesses módulos.

## 16. Problemas encontrados e corrigidos

- CTA cruzava o painel no meio da cena: deslocamento do texto revisto.
- Indicador lateral encostava nos cards largos: margem desktop ampliada.
- Dashboard do hero ficava próximo demais do rodapé da cena: altura do gráfico e espaçamento compactados.
- Telas baixas poderiam limitar o enquadramento sticky: limite de altura adicionado.
- Efeitos de mouse poderiam permanecer em larguras móveis: media query e reset corrigidos.
- Pausa fora da tela precisava acompanhar a substituição do CSS anterior: regra restaurada na nova camada.
- Um ensaio visual foi interrompido por recarga do servidor de desenvolvimento. A revisão final foi direcionada ao build estático.

## 17. Limites e pendências

O npm ci reportou três avisos de vulnerabilidade de dependências (um baixo, um moderado, um alto); não foram feitas atualizações fora do escopo. As medições locais não certificam FPS em celulares físicos nem LCP/CLS/INP de produção. O preview da Vercel pode exigir login. Não houve merge nem publicação em produção.

Evidências locais ficam no diretório irmão `kubo-cinema-evidence`: inventários, bundles, capturas e resultados de revisão. O baseline está fixado no commit informado acima. Para reproduzir a comparação é necessário servir esse baseline e executar primeiro a fase baseline; depois executar a fase second apontando LANDING_QA_URL para a nova versão.
