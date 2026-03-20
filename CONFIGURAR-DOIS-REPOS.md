# Configurar dois repositórios (front_end_multi + backend)

Você tem dois repositórios no GitHub:
- **front_end_multi** – código do frontend
- **backend** – código do backend

## Situação atual

Localmente tudo está em uma pasta só, e o `git push` envia tudo para o repositório **backend**.

## O que fazer

### 1. Configurar o front_end_multi como repositório próprio

Execute na raiz do projeto Multi:

```bash
cd "/Users/reis_reginaldojr/Library/Mobile Documents/com~apple~CloudDocs/Reis Gestão Empresarial/Curso N8N/Multi/front_end_multi"

# Inicializar git (se ainda não existir)
git init

# Adicionar remote do front_end_multi
git remote add origin https://github.com/Carro-Assinatura/front_end_multi.git

# Adicionar e commitar
git add .
git commit -m "Sincronizar com repositório local"

# Push (pode ser necessário -u origin main para definir a branch)
git push -u origin main
```

Se o repositório `front_end_multi` no GitHub já tiver commits, use `git pull origin main --allow-unrelated-histories` antes do push.

### 2. Atualizar o deploy

O workflow de deploy está no repositório **backend** e usa a pasta `front_end_multi`. Por isso:

- **Para atualizar o site (multi.kingsengine.tech):** faça push na **raiz** do projeto (Multi):

  ```bash
  cd "/Users/reis_reginaldojr/Library/Mobile Documents/com~apple~CloudDocs/Reis Gestão Empresarial/Curso N8N/Multi"
  git add .
  git commit -m "Atualizar front e backend"
  git push origin main
  ```

- **Para atualizar só o repositório front_end_multi no GitHub:** faça push no `front_end_multi`:

  ```bash
  cd "/Users/reis_reginaldojr/Library/Mobile Documents/com~apple~CloudDocs/Reis Gestão Empresarial/Curso N8N/Multi/front_end_multi"
  git add .
  git commit -m "Atualizar frontend"
  git push origin main
  ```

### 3. Resumo dos remotes

| Pasta | Remote | Repositório |
|-------|--------|-------------|
| `Multi/` (raiz) | origin → backend | Carro-Assinatura/backend |
| `Multi/front_end_multi/` | origin → front_end_multi | Carro-Assinatura/front_end_multi |

### 4. Fluxo recomendado

1. Depois de alterar o frontend: `cd front_end_multi` → `git add .` → `git commit` → `git push`
2. Depois de alterar o backend ou qualquer coisa na raiz: `cd ..` (raiz) → `git add .` → `git commit` → `git push`
3. Para atualizar o site (deploy): o push na **raiz** dispara o workflow.

---

**URL do repositório front_end_multi:** se for diferente de `https://github.com/Carro-Assinatura/front_end_multi.git`, ajuste no comando `git remote add`.

---

## Opção: Deploy a partir do front_end_multi

Se preferir que o deploy seja disparado ao fazer push no **front_end_multi** (em vez do backend):

1. Copie o arquivo `.github/workflows/deploy-pages.yml` para dentro do `front_end_multi`
2. Ajuste o `working-directory` e `path` no workflow (a raiz passa a ser o front)
3. Configure o GitHub Pages no repositório **front_end_multi**
4. O repositório **backend** ficaria só com o código do backend
