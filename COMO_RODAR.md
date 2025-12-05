# Como Rodar o Painel CNIEP Gestão na Sua Máquina

Este guia explica como executar o painel de indicadores no seu computador pessoal.

## Pré-requisitos

Antes de começar, você precisa ter o **Node.js** instalado.
1. Acesse [nodejs.org](https://nodejs.org/).
2. Baixe e instale a versão **LTS** (Recomendada).

## Passo a Passo

1. **Baixe o Projeto**
   - Faça o download dos arquivos do projeto e extraia (descompacte) em uma pasta de sua preferência.

2. **Abra o Terminal**
   - No Windows: Abra a pasta do projeto, clique com o botão direito em um espaço vazio e selecione "Abrir no Terminal" (ou abra o CMD/PowerShell e navegue até a pasta com `cd caminho/da/pasta`).
   - No Mac/Linux: Abra o Terminal e navegue até a pasta do projeto.

3. **Instale as Dependências**
   - Digite o seguinte comando e aperte Enter:
     ```bash
     npm install
     ```
   - Aguarde o término da instalação (pode levar alguns minutos).

4. **Inicie o Painel**
   - Digite o comando:
     ```bash
     npm run dev
     ```
   - O terminal mostrará um endereço local, geralmente `http://localhost:5173`.

5. **Acesse no Navegador**
   - Abra seu navegador (Chrome, Edge, Firefox) e digite o endereço mostrado no terminal (ex: `http://localhost:5173`).
   - Pronto! O painel está rodando localmente e seus dados editados ficarão salvos no seu navegador.

## Dúvidas Comuns

- **Os dados somem se eu fechar o terminal?**
  Não. Os dados que você editou ficam salvos no "Armazenamento Local" do seu navegador. O terminal apenas serve o site.

- **Como paro a execução?**
  No terminal, pressione `Ctrl + C` para encerrar o servidor.
