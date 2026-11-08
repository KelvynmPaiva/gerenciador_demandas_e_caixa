# Gerenciador de tarefas

App web para duas pessoas da equipe de marketing acompanharem, num só lugar:

- **Marcas** (BMW, MINI, BMW MOTORRAD, PORSCHE, ZEEKR/PARTAGE);
- **Notas recorrentes** de cada mês (despesas que se repetem);
- **Eventos** de cada marca, com **Orçamento** (despesas e status da NF) e **Demandas** (seções, tarefas e subtarefas);
- **Painel inicial** com o que está atrasado, o que vence nesta semana e o que vence na próxima.

O login é por e-mail e senha. Não existe cadastro: as duas pessoas são criadas à mão no painel do Supabase (passo 3). As duas têm as mesmas permissões.

O app usa **Next.js** (o site) e **Supabase** (banco de dados e login). Para colocar no ar usa a **Vercel**.

---

## O que você precisa antes de começar

- **Node.js** versão 20.9 ou mais nova. Para conferir, abra o terminal e digite `node -v`. Se não tiver, baixe em <https://nodejs.org> (versão LTS).
- Uma conta gratuita no **Supabase**: <https://supabase.com>
- Uma conta gratuita no **GitHub**: <https://github.com> (só para publicar na Vercel, passo 6)
- Uma conta na **Vercel**: <https://vercel.com> (entre com a conta do GitHub)

> A Vercel gratuita (plano Hobby) é para uso pessoal. Se o app for usado pela empresa, confira os termos de uso da Vercel antes de publicar.

---

## Passo 1 — Criar o projeto no Supabase

1. Entre em <https://supabase.com/dashboard> e clique em **New project**.
2. Escolha um nome (por exemplo, `gerenciador-de-tarefas`).
3. Crie uma **Database Password** (senha do banco) e guarde em um lugar seguro. Você não vai usá-la no app, mas pode precisar um dia.
4. Escolha a região mais próxima (por exemplo, **South America (São Paulo)**) e clique em **Create new project**.
5. Espere uns 2 minutos até o projeto terminar de ser criado.

## Passo 2 — Criar as tabelas (rodar a migration)

A "migration" é um arquivo com os comandos que criam as tabelas, as regras de acesso e as 5 marcas iniciais.

1. No Supabase, abra **SQL Editor** (menu da esquerda) e clique em **New query**.
2. Abra o arquivo [`supabase/migrations/0001_inicial.sql`](supabase/migrations/0001_inicial.sql) deste projeto, copie **todo** o conteúdo e cole no editor.
3. Clique em **Run**. Deve aparecer a mensagem de sucesso (*Success. No rows returned*).
4. Para conferir, abra **Table Editor**: devem aparecer as tabelas `marcas`, `eventos`, `tarefas` e outras. A tabela `marcas` já vem com 5 linhas.

> Rode a migration **uma vez só**. Se rodar de novo, o Supabase avisa que as tabelas já existem. Não é grave, mas também não é preciso.

## Passo 3 — Criar os 2 usuários e fechar o cadastro

Como o app não tem tela de cadastro, você cria as duas pessoas aqui.

**Criar os usuários**

1. No Supabase, abra **Authentication → Users**.
2. Clique em **Add user → Create new user**.
3. Digite o e-mail e uma senha.
4. Deixe marcada a opção **Auto Confirm User**. Sem ela, a pessoa fica sem conseguir entrar, porque o login espera a confirmação do e-mail.
5. Clique em **Create user**. Repita para a segunda pessoa.

**Desativar o cadastro público (importante)**

Por padrão, o Supabase deixa qualquer pessoa criar uma conta. Como as regras do banco liberam tudo para quem está logado, **quem criasse uma conta teria acesso a todos os dados**. Por isso:

1. Abra **Authentication** e entre em **Sign In / Providers** (em versões mais antigas do painel, o nome é **Providers**).
2. Procure a opção **Allow new users to sign up** e **desligue**.
3. Salve.

> Os usuários que você criou no painel continuam funcionando normalmente. Só o cadastro feito por fora é que fica bloqueado.

## Passo 4 — Pegar a URL e a chave do projeto

O app precisa de duas informações para falar com o seu Supabase:

1. No Supabase, abra **Project Settings** (ícone de engrenagem, no canto inferior esquerdo).
2. Em **Data API**, copie a **Project URL**. Ela é parecida com `https://abcdefghijk.supabase.co`.
3. Em **API Keys**, copie a **Publishable key**. Ela começa com `sb_publishable_`.

> Use **somente** a Publishable key. **Nunca** use a chave `secret` ou `service_role`: ela dá acesso total ao banco e não pode ficar dentro do app. A chave `anon` antiga também funciona por enquanto, mas o Supabase vai desativá-la no fim de 2026.

## Passo 5 — Rodar no seu computador

Abra o terminal **dentro da pasta do projeto** e siga a ordem:

1. Instale as dependências (só na primeira vez):

   ```bash
   npm install
   ```

2. Crie o arquivo de configuração a partir do modelo.

   No PowerShell (Windows):

   ```powershell
   Copy-Item .env.example .env.local
   ```

   No Mac ou Linux:

   ```bash
   cp .env.example .env.local
   ```

3. Abra o arquivo `.env.local` e preencha com o que você copiou no passo 4:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxx
   ```

   O nome `ANON_KEY` é só o nome da variável. O valor que vai nela é a Publishable key.

4. Inicie o app:

   ```bash
   npm run dev
   ```

5. Abra <http://localhost:3000> no navegador. Você será levado para a tela de login. Entre com um dos usuários do passo 3.

Para parar o app, volte ao terminal e aperte `Ctrl + C`.

O arquivo `.env.local` guarda dados do seu projeto e **não é enviado ao GitHub** (já está no `.gitignore`). Só o `.env.example`, que está vazio, vai junto.

## Passo 6 — Publicar na Vercel

A Vercel pega o código do GitHub, monta o app e entrega um endereço na internet.

**6.1 — Enviar o código para o GitHub**

1. No GitHub, crie um repositório novo (**New repository**). Pode ser **Private**. Não marque nenhuma opção de criar README, `.gitignore` ou licença.
2. No terminal, dentro da pasta do projeto, rode (troque o endereço pelo do seu repositório):

   ```bash
   git init
   git add .
   git commit -m "Primeira versão"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
   git push -u origin main
   ```

   Se a pasta já estiver ligada a um repositório do Git, pule o `git init`.

**6.2 — Criar o projeto na Vercel**

1. Entre em <https://vercel.com/new> e escolha o repositório que você acabou de enviar (**Import**).
2. A Vercel reconhece sozinha que é um projeto **Next.js**. Não mude as configurações de build.
3. Abra a seção **Environment Variables** e adicione as **mesmas duas variáveis** do `.env.local`:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | a Project URL do Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | a Publishable key (`sb_publishable_...`) |

4. Clique em **Deploy** e espere terminar (cerca de 1 a 2 minutos).
5. Ao final, a Vercel mostra o endereço do app (algo como `https://seu-projeto.vercel.app`). Abra, entre com um dos usuários e confira se o painel carrega.

**Esqueceu de colocar as variáveis, ou errou algum valor?** Na Vercel, abra o projeto → **Settings → Environment Variables**, corrija e depois vá em **Deployments**, abra os três pontinhos do último deploy e clique em **Redeploy**. As variáveis só valem para deploys feitos depois da mudança.

**Para atualizar o app no futuro:** altere o código, rode `git add .`, `git commit -m "o que mudou"` e `git push`. A Vercel publica a nova versão sozinha.

---

## Comandos do dia a dia

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Roda o app no seu computador, em <http://localhost:3000> |
| `npm run build` | Monta a versão final, a mesma que a Vercel faz. Serve para achar erros antes de publicar |
| `npm run start` | Roda a versão montada pelo `npm run build` |
| `npm run lint` | Procura erros e descuidos no código |

## Se algo der errado

- **"E-mail ou senha incorretos" para um usuário que existe:** no Supabase, em **Authentication → Users**, confira se o usuário está confirmado. Se não estiver, apague e crie de novo com **Auto Confirm User** marcado. O app não tem "esqueci a senha"; para trocar uma senha, use o painel do Supabase.
- **Tela de erro ou página em branco logo ao abrir:** confira se o `.env.local` (ou as variáveis na Vercel) tem os dois valores certos, sem espaços sobrando nem aspas. Depois de mexer no `.env.local`, pare o `npm run dev` (`Ctrl + C`) e inicie de novo.
- **Dados não aparecem, ou "permission denied":** a migration (passo 2) provavelmente não rodou por inteiro. Rode-a de novo num projeto vazio, ou confira no **Table Editor** se as tabelas existem.
- **`npm run dev` diz que a porta 3000 está em uso:** já há outro app aberto. Feche-o ou aceite a porta que o Next.js sugerir.

## Como o projeto é organizado

| Pasta ou arquivo | O que tem |
| --- | --- |
| `app/` | As telas: login, painel, marcas e eventos |
| `components/` | Peças de tela reutilizadas (botões, campos, diálogos) |
| `lib/` | Funções de apoio: datas, formatos, conexão com o Supabase |
| `proxy.ts` | Barra quem não está logado e leva para `/login` |
| `supabase/migrations/` | O arquivo que cria as tabelas do banco |
| `types/database.ts` | Tipos do banco, gerados pelo Supabase |
| `spec/` e `prototipos/` | Documentação do projeto e imagens das telas, só para consulta |
