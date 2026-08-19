# SECURITY LOCAL CHANGES

1. **src/hooks/useIsAdmin.ts**
   - Alteração: Remoção completa do hardcode email.includes.
   - Motivo: Privilégio escalado por substring de email.
   - Risco Corrigido: RBAC bypass no frontend.

2. **src/hooks/usePlan.ts**
   - Alteração: Remoção do bypass local de isOwner para o plano pro.
   - Motivo: Concessão automática indevida do plano.
   - Risco Corrigido: Billing bypass no frontend.

3. **supabase/config.toml**
   - Alteração: project_id alterado de mgiwqgmgipyysbgmhyrh para gitzmynfamubetgujtmm.
   - Motivo: Deployments acidentais em infra legada.
   - Risco Corrigido: Ambientes desincronizados.

4. **supabase/functions/track/index.ts**
   - Alteração: Remoção de catch { return true } para return false.
   - Motivo: Tracker aceitava payloads livremente sob falhas de banco.
   - Risco Corrigido: Custo abusivo.

5. **.gitignore e Arquivos .env**
   - Alteração: Arquivos .env adicionados ao .gitignore e removidos do tracking.
   - Motivo: Segredos versionados.
   - Risco Corrigido: Exposição de credenciais.

6. **vercel.json e supabase/functions/_shared/cors.ts**
   - Alteração: Security Headers Adicionados.
   - Motivo: Falta de restrição de origens em endpoints restritos.
   - Risco Corrigido: CSRF e CORS abuse.
