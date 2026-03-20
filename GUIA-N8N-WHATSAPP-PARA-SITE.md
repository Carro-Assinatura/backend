# Guia: Reutilizar fluxo N8N do WhatsApp no site

Este guia mostra como adaptar um workflow N8N que funciona no WhatsApp para funcionar no chat do site (multi.kingsengine.tech).

---

## Visão geral

| Canal | Trigger | Como a resposta volta |
|-------|---------|----------------------|
| **WhatsApp** | WhatsApp Trigger / Webhook | Enviada pelo nó de envio ao WhatsApp |
| **Site** | Chat Trigger | Enviada automaticamente pelo Chat Trigger |

O Chat Trigger **substitui** o trigger do WhatsApp. O restante da lógica (AI Agent, ferramentas, etc.) pode ser reaproveitada.

---

## Passo 1: Duplicar o workflow do WhatsApp

1. Abra o workflow que funciona no WhatsApp no N8N.
2. Clique nos **três pontinhos** (⋮) no canto superior direito.
3. Selecione **Duplicate** (ou use Ctrl+D).
4. Renomeie o novo workflow, ex.: "Bot Multi - Site".

---

## Passo 2: Trocar o trigger do WhatsApp pelo Chat Trigger

### Onde encontrar o Chat Trigger

1. Clique em **+** para adicionar nó.
2. Na busca, digite **"Chat Trigger"** ou apenas **"Chat"**.
3. O nó pode aparecer nas categorias **AI**, **LangChain** ou **Triggers**.
4. **Requisito:** N8N 1.24.0 ou superior. Em versões antigas, o nó se chamava **"Manual Chat Trigger"** — atualize o N8N se não encontrar.

### Se não encontrar o Chat Trigger

O site usa o widget `@n8n/chat`, que foi feito para funcionar **apenas** com o Chat Trigger. Não há nó alternativo compatível direto.

**Opções:**

| Opção | Descrição |
|-------|-----------|
| **A) Atualizar N8N** | Atualize para a versão mais recente (1.24+). O Chat Trigger é nativo. |
| **B) Usar Hosted Chat** | No N8N, crie o workflow com Chat Trigger em modo "Hosted Chat" e use o link que o N8N gera. Depois, na intranet, desative o bot e coloque um link/botão para abrir esse chat em nova aba. |
| **C) Chatrigger.com** | Serviço terceiro (pago) que conecta ao webhook do N8N e oferece widget de chat. Exige trocar o widget do site. |

**Recomendação:** Atualize o N8N e use o Chat Trigger — é a forma oficial e gratuita.

---

### Adicionar o nó

1. **Remova** o nó que inicia o fluxo no WhatsApp (WhatsApp Trigger, Webhook, etc.).
2. Adicione o nó **Chat Trigger** (busque "Chat Trigger" ou "Chat").
3. Arraste para o canvas.
3. **Conecte** o Chat Trigger ao próximo nó do fluxo (geralmente o **AI Agent**).

### Estrutura esperada

```
[Chat Trigger] → [AI Agent] → (resposta vai automaticamente para o chat)
```

Se o fluxo do WhatsApp tiver algo assim:

```
[WhatsApp Trigger] → [AI Agent] → [Enviar para WhatsApp]
```

No site, fica:

```
[Chat Trigger] → [AI Agent]
```

O Chat Trigger envia a saída do último nó (AI Agent) para o chat automaticamente. Não use "Respond to Webhook".

---

## Passo 3: Configurar o Chat Trigger

1. Clique no nó **Chat Trigger**.
2. Em **Options** (ou configurações avançadas):
   - **Response Mode**: escolha **"What Last Node Finishes"**.
   - **Streaming**: deixe desativado (a menos que o AI Agent tenha streaming habilitado).
3. Em **Allowed Origins (CORS)**:
   - Adicione o domínio do site, ex.: `https://multi.kingsengine.tech`
   - Para testes locais: `http://localhost:8080`
   - Use uma linha por domínio.
4. **Salve** o workflow.
5. **Ative** o workflow (toggle no canto superior direito).

---

## Passo 4: Copiar a URL do webhook

1. Com o workflow ativo, clique no nó **Chat Trigger**.
2. Copie a **Webhook URL** (algo como `https://seu-n8n.app.n8n.cloud/webhook/xxxx-xxxx-xxxx`).
3. Guarde essa URL para o próximo passo.

---

## Passo 5: Configurar o bot no site

1. Acesse a **intranet** do site: `https://multi.kingsengine.tech/admin`
2. Faça login (admin@multi.com.br ou seu usuário).
3. Vá em **Configuração do Bot** (ou **Bot Config**).
4. Preencha:
   - **Bot ativo**: ative (toggle ligado).
   - **URL do Webhook N8N**: cole a URL copiada no Passo 4.
   - **Streaming de respostas**: deixe **desativado** (evita erro "No response received").
5. Clique em **Salvar**.

---

## Passo 6: Testar no site

1. Abra o site: `https://multi.kingsengine.tech`
2. No desktop, deve aparecer o ícone do bot (canto inferior direito).
3. Clique no ícone e envie uma mensagem.
4. A resposta deve vir do mesmo AI Agent usado no WhatsApp.

---

## Fluxos mais complexos (vários nós entre trigger e resposta)

Se o fluxo do WhatsApp tiver vários nós entre o trigger e a resposta (ex.: condições, HTTP Request, etc.):

### Opção A: Chat Trigger → AI Agent (recomendado)

Se o núcleo da conversa é um **AI Agent**, use:

```
[Chat Trigger] → [AI Agent]
```

O AI Agent pode ter as mesmas ferramentas (tools) do fluxo do WhatsApp.

### Opção B: Usar Execute Workflow

Se a lógica está em um subworkflow ou em vários nós:

1. Crie um workflow **intermediário** para o site:
   ```
   [Chat Trigger] → [Execute Workflow] → (workflow do WhatsApp)
   ```
2. O workflow do WhatsApp precisa aceitar a mensagem do chat como entrada e retornar a resposta em formato compatível com o Chat Trigger.
3. Isso exige ajustes no workflow original e é mais avançado.

Para a maioria dos casos, a **Opção A** é suficiente.

---

## Checklist final

- [ ] Workflow duplicado e renomeado
- [ ] Trigger do WhatsApp removido
- [ ] Chat Trigger adicionado e conectado ao AI Agent
- [ ] Response Mode = "What Last Node Finishes"
- [ ] Allowed Origins com o domínio do site
- [ ] Workflow ativado
- [ ] URL do webhook copiada
- [ ] Bot configurado na intranet (webhook_url, bot ativo)
- [ ] Streaming desativado no site (se o AI Agent não usar streaming)
- [ ] Teste no site realizado

---

## Erros comuns

| Erro | Solução |
|------|---------|
| "No response received" | Desative "Streaming de respostas" no site ou ative streaming no AI Agent. |
| "Workflow was started" | Não use Respond to Webhook. Conecte Chat Trigger direto ao AI Agent. |
| **"No item to return was found"** | Veja solução detalhada abaixo. |
| CORS / bloqueio de origem | Adicione o domínio em Allowed Origins no Chat Trigger. |
| Bot não aparece | Verifique se "Bot ativo" está ligado e se a URL do webhook está correta. |

---

## Erro: "No item to return was found"

O Chat Trigger espera que o **último nó** do fluxo retorne um campo `output` ou `text` com a resposta. Se não encontrar, mostra esse erro.

### Causas comuns

1. **O AI Agent não é o último nó** — O fluxo do WhatsApp pode ter nós depois do AI Agent (ex.: "Enviar para WhatsApp"). O Chat Trigger usa a saída do **último** nó executado. Remova ou desconecte esses nós para o site.
2. **O AI Agent não recebe a mensagem** — No AI Agent, o campo "Prompt" ou "Text" deve usar a mensagem do chat. Use a opção **"Connected Chat Trigger"** ou referencie `{{ $json.chatInput }}` / `{{ $json.message }}`.
3. **Response Mode incorreto** — No Chat Trigger → Options → Response Mode = **"What Last Node Finishes"**.

### Solução passo a passo

1. **Estrutura do fluxo:** O fluxo deve ser **Chat Trigger → AI Agent** (e nada depois).
2. **AI Agent como último nó:** Não pode haver nós após o AI Agent que enviem para WhatsApp ou outro destino.
3. **Prompt do AI Agent:** No AI Agent, em "Prompt" ou "Text", use:
   - A opção **"From Connected Chat Trigger"** (se disponível), ou
   - `{{ $json.chatInput }}` ou `{{ $json.text }}` para pegar a mensagem do usuário.
4. **Teste no N8N:** Execute o workflow manualmente no N8N e confira se o AI Agent retorna saída com `output` ou `text`.
