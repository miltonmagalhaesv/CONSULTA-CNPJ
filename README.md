# Consulta Empresa Brasil

Aplicação web moderna para consulta pública de CNPJ, desenvolvida com **React**, **Vite** e **Tailwind CSS**, utilizando a API pública do [CNPJ.ws](https://www.cnpj.ws/).

O projeto permite consultar dados cadastrais de empresas brasileiras, visualizar um resumo organizado, gerar um cartão cadastral para impressão/PDF, consultar inscrições estaduais, visualizar sócios, atividades econômicas e explorar o JSON completo retornado pela API de forma dinâmica e recolhível.

---

## Objetivo do projeto

Este projeto nasceu como um MVP para facilitar consultas rápidas de empresas, fornecedores, clientes e parceiros comerciais.

A proposta é transformar uma consulta técnica de CNPJ em uma interface mais amigável, visual e útil para processos internos de cadastro, análise e conferência de dados empresariais.

---

## Funcionalidades

* Consulta de CNPJ pela API pública do CNPJ.ws
* Campo de CNPJ com máscara automática
* Tratamento de loading, erros e CNPJ inválido
* Layout responsivo para desktop e mobile
* Resumo cadastral da empresa
* Exibição de:

  * Razão social
  * Nome fantasia
  * Situação cadastral
  * Endereço
  * Cidade/UF
  * CEP
  * CNAE principal
  * Telefone
  * E-mail
  * Capital social
  * Natureza jurídica
  * Porte da empresa
* Aba de cartão cadastral para impressão ou salvar como PDF
* Botão para abrir o comprovante oficial da Receita Federal
* Aba de inscrições estaduais
* Botão para consulta oficial via SINTEGRA
* Aba de sócios / quadro societário
* Aba de atividades econômicas
* Visualização dinâmica do JSON completo
* Accordion para minimizar e expandir objetos e listas do JSON
* Opção de visualizar JSON bruto
* Copiar JSON para área de transferência
* Baixar JSON como arquivo `.json`
* Contador de campos preenchidos
* Formatação automática de:

  * CNPJ
  * CEP
  * Datas
  * Booleanos
  * Capital social

---

## Tecnologias utilizadas

* React
* Vite
* Tailwind CSS
* JavaScript
* API pública CNPJ.ws
* Netlify para deploy
* GitHub para versionamento

---

## Demonstração

A aplicação está publicada em:

[Consulta Empresa Brasil](https://consulta-empresa-brasil.netlify.app/)

---

## Status do projeto

Projeto em desenvolvimento.

A versão atual contempla a consulta individual de CNPJ, visualização dos dados cadastrais, cartão cadastral para impressão/PDF e exploração do JSON completo retornado pela API.

---

## Como usar

1. Acesse a aplicação.
2. Digite um CNPJ válido no campo de consulta.
3. Clique em **Consultar**.
4. Navegue pelas abas disponíveis:

   * Resumo
   * Cartão CNPJ
   * Inscrições Estaduais
   * Sócios
   * Atividades
   * JSON
5. Use os botões para imprimir, salvar PDF, copiar JSON ou abrir consultas oficiais.

---

## Como rodar localmente

Clone o repositório:

```bash
git clone https://github.com/miltonmagalhaesv/CONSULTA-CNPJ.git
```

Entre na pasta do projeto:

```bash
cd CONSULTA-CNPJ
```

Instale as dependências:

```bash
npm install
```

Rode o projeto em ambiente de desenvolvimento:

```bash
npm run dev
```

Gere a versão de produção:

```bash
npm run build
```

Visualize a versão de produção localmente:

```bash
npm run preview
```

---

## Estrutura do projeto

```text
CONSULTA-CNPJ/
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── App.jsx
    ├── main.jsx
    └── index.css
```

---

## API utilizada

Este projeto utiliza a API pública do CNPJ.ws:

```text
https://publica.cnpj.ws/cnpj/{cnpj}
```

A API retorna dados públicos relacionados ao CNPJ consultado, como dados cadastrais, estabelecimento, endereço, atividades econômicas, sócios e inscrições estaduais, quando disponíveis.

---

## Observações importantes

O cartão cadastral gerado pela aplicação é um documento de apoio para conferência interna, gerado com base nos dados públicos retornados pela API.

Ele não substitui o comprovante oficial emitido pela Receita Federal.

Para emissão oficial, a aplicação disponibiliza um botão de acesso ao serviço da Receita Federal.

---

## Possíveis evoluções

Este projeto pode evoluir para uma ferramenta mais completa de análise cadastral e onboarding de fornecedores, clientes e parceiros.

Próximas melhorias planejadas:

* Histórico de consultas
* Favoritar empresas consultadas
* Exportação para PDF com layout avançado
* Exportação para Excel/CSV
* Consulta em lote de CNPJs
* Integração com Google Sheets
* Integração com Notion
* Integração com Appsmith
* Cadastro interno de fornecedores/clientes
* Login de usuários
* Área administrativa
* Consulta de certidões e fontes públicas adicionais
* Camada backend para cache e controle de uso
* Integração com banco PostgreSQL
* Enriquecimento de dados com outras APIs públicas ou privadas

---

## Aprendizados demonstrados

Este projeto demonstra conhecimentos práticos em:

* Desenvolvimento frontend com React
* Criação de interfaces responsivas
* Consumo de APIs REST
* Manipulação e renderização de JSON dinâmico
* Tratamento de estados com React Hooks
* Organização de componentes
* UX para dados empresariais
* Deploy contínuo com GitHub e Netlify
* Versionamento de código com GitHub
* Criação de MVP funcional a partir de uma necessidade real de negócio

---

## Contexto

Este projeto faz parte de uma iniciativa de criação de microaplicações para apoiar processos internos de negócios, automações e inteligência operacional.

A ideia é criar ferramentas simples, úteis e escaláveis que resolvam problemas práticos do dia a dia empresarial, começando por consultas cadastrais e evoluindo para fluxos mais completos de análise, cadastro e integração de dados.

---

## Autor

Desenvolvido por **Milton Magalhães**.

* GitHub: [@miltonmagalhaesv](https://github.com/miltonmagalhaesv)
* LinkedIn: [Milton Magalhães](https://www.linkedin.com/in/miltonmagalhaesv/)
* Projeto: Consulta Empresa Brasil

---

## Licença

Este projeto está sob a licença MIT.

Você pode utilizar, estudar, modificar e evoluir este projeto, mantendo os devidos créditos ao autor.
