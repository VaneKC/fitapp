# Meu App de Treino — Guia de instalação

## O que você vai precisar (tudo gratuito)
- Uma conta em: github.com
- Uma conta em: supabase.com
- Uma conta em: vercel.com
- O programa: Node.js (nodejs.org — baixe a versão LTS)

---

## PASSO 1 — Preparar o banco de dados (Supabase)

1. Acesse supabase.com e clique em "Start for free"
2. Crie uma conta e clique em "New project"
3. Dê um nome (ex: "fitapp"), escolha uma senha forte e clique em "Create new project"
4. Aguarde 1–2 minutos enquanto o projeto é criado
5. No menu lateral, clique em "SQL Editor"
6. Clique em "New query"
7. Abra o arquivo `supabase_setup.sql` deste projeto, copie todo o conteúdo e cole no editor
8. Clique em "RUN" (ou Ctrl+Enter)
9. Você verá "Success" — as tabelas foram criadas!

### Pegar suas chaves do Supabase:
1. No menu lateral, clique em "Project Settings"
2. Clique em "API"
3. Copie o "Project URL" e o "anon public" key
4. Abra o arquivo `src/lib/supabase.js` e substitua:
   - `COLE_SUA_URL_AQUI` pela URL copiada
   - `COLE_SUA_CHAVE_AQUI` pela chave anon copiada

---

## PASSO 2 — Subir o código no GitHub

1. Acesse github.com e crie uma conta (se ainda não tiver)
2. Clique no "+" no canto superior direito → "New repository"
3. Dê o nome "fitapp", deixe como "Public" e clique em "Create repository"
4. Baixe e instale o GitHub Desktop: desktop.github.com
5. Abra o GitHub Desktop → "Add an Existing Repository from your Hard Drive"
6. Selecione a pasta deste projeto
7. Clique em "Publish repository" → escolha o repositório que você criou
8. Clique em "Push origin"

---

## PASSO 3 — Publicar na internet (Vercel)

1. Acesse vercel.com e clique em "Sign up" → "Continue with GitHub"
2. Clique em "New Project"
3. Encontre o repositório "fitapp" e clique em "Import"
4. Em "Framework Preset" selecione "Create React App"
5. Clique em "Deploy"
6. Aguarde 2–3 minutos
7. Pronto! Você terá um link público do tipo: fitapp-seuusuario.vercel.app

---

## PASSO 4 — Testar localmente (opcional, para ver antes de publicar)

1. Instale o Node.js em nodejs.org (versão LTS)
2. Abra o terminal na pasta do projeto
3. Digite: `npm install` e aguarde
4. Digite: `npm start`
5. O app abre automaticamente em: http://localhost:3000

---

## Estrutura dos arquivos

```
fitapp/
├── public/
│   └── index.html          ← página base (não precisa mexer)
├── src/
│   ├── lib/
│   │   ├── supabase.js     ← conexão com banco (coloque suas chaves aqui)
│   │   └── planEngine.js   ← motor de decisão que gera os planos
│   ├── pages/
│   │   ├── Anamnese.js     ← formulário de 8 etapas
│   │   ├── Home.js         ← tela inicial com treino do dia
│   │   └── Treino.js       ← execução do treino com timer
│   ├── App.js              ← rotas do app
│   └── index.js            ← ponto de entrada (não precisa mexer)
├── supabase_setup.sql      ← cole no Supabase para criar as tabelas
└── package.json            ← lista de dependências (não precisa mexer)
```

---

## O que o app já faz

✅ Anamnese completa em 8 etapas com chips interativos
✅ Motor de decisão que gera o plano baseado nas respostas
✅ Filtra exercícios por restrições de saúde e lesões
✅ Filtra por equipamento disponível e local de treino
✅ Define divisão (Full Body / Upper-Lower / PPL) por nível e dias
✅ Tela inicial com treino do dia e progresso da semana
✅ Execução do treino com timer, registro de esforço e técnica
✅ Feedback automático ao final do treino
✅ Salva tudo no banco de dados

## Próximas funcionalidades para adicionar

⬜ Tela de Progresso com gráficos
⬜ Tela de Plano (visão do mesociclo)
⬜ Tela de Perfil para atualizar biometria
⬜ Login com e-mail e senha
⬜ Notificações de treino

---

## Dúvidas frequentes

**O app não abre após `npm start`?**
Verifique se colou corretamente as chaves do Supabase em `src/lib/supabase.js`

**Aparece erro "Failed to fetch"?**
Confirme que rodou o SQL no Supabase e que as políticas de acesso foram criadas

**Quero mudar o nome do app?**
Edite a tag `<title>` no arquivo `public/index.html`
