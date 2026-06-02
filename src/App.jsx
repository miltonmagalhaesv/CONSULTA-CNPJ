import { useMemo, useState } from "react";

const TABS = [
  { id: "resumo", label: "Resumo" },
  { id: "cartao", label: "Cartão CNPJ" },
  { id: "inscricoes", label: "Inscrições Estaduais" },
  { id: "socios", label: "Sócios" },
  { id: "atividades", label: "Atividades" },
  { id: "json", label: "JSON" },
];

export default function App() {
  const [cnpj, setCnpj] = useState("");
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("resumo");
  const [mostrarJsonBruto, setMostrarJsonBruto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const cnpjLimpo = cnpj.replace(/\D/g, "");

  const estabelecimento = dados?.estabelecimento;

  const enderecoCompleto = estabelecimento
    ? [
        estabelecimento.tipo_logradouro,
        estabelecimento.logradouro,
        estabelecimento.numero,
        estabelecimento.complemento,
        estabelecimento.bairro,
      ]
        .filter(Boolean)
        .join(", ")
    : "-";

  const cidadeUf = estabelecimento
    ? [estabelecimento.cidade?.nome, estabelecimento.estado?.sigla]
        .filter(Boolean)
        .join(" / ")
    : "-";

  const telefone = estabelecimento
    ? [estabelecimento.ddd1, estabelecimento.telefone1].filter(Boolean).join(" ")
    : "-";

  const cnaePrincipal = estabelecimento?.atividade_principal
    ? `${estabelecimento.atividade_principal.id} - ${estabelecimento.atividade_principal.descricao}`
    : "-";

  const totalCamposPreenchidos = useMemo(() => {
    if (!dados) return 0;
    return contarCamposPreenchidos(dados);
  }, [dados]);

  function aplicarMascaraCnpj(valor) {
    const numeros = valor.replace(/\D/g, "").slice(0, 14);

    return numeros
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  function formatarCNPJ(valor) {
    if (!valor) return "-";
    const numeros = String(valor).replace(/\D/g, "");
    if (numeros.length !== 14) return valor;

    return numeros.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5"
    );
  }

  function formatarCEP(valor) {
    if (!valor) return "-";
    const numeros = String(valor).replace(/\D/g, "");
    if (numeros.length !== 8) return valor;

    return numeros.replace(/^(\d{5})(\d{3})$/, "$1-$2");
  }

  function formatarData(valor) {
    if (!valor || typeof valor !== "string") return valor;

    const pareceData = /^\d{4}-\d{2}-\d{2}/.test(valor);

    if (!pareceData) return valor;

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) return valor;

    return data.toLocaleDateString("pt-BR", {
      timeZone: "UTC",
    });
  }

  function formatarCapitalSocial(valor) {
    if (valor === null || valor === undefined || valor === "") return "-";

    const numero = Number(valor);

    if (Number.isNaN(numero)) return valor;

    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarBooleano(valor) {
    if (typeof valor !== "boolean") return valor;
    return valor ? "Sim" : "Não";
  }

  function formatarValor(chave, valor) {
    if (valor === null || valor === undefined || valor === "") return "-";

    const chaveNormalizada = String(chave).toLowerCase();

    if (typeof valor === "boolean") return formatarBooleano(valor);

    if (chaveNormalizada.includes("cnpj")) return formatarCNPJ(valor);

    if (chaveNormalizada.includes("cep")) return formatarCEP(valor);

    if (
      chaveNormalizada.includes("data") ||
      chaveNormalizada.includes("inicio") ||
      chaveNormalizada.includes("atualizado")
    ) {
      return formatarData(valor);
    }

    if (chaveNormalizada.includes("capital")) {
      return formatarCapitalSocial(valor);
    }

    return String(valor);
  }

  async function consultarCNPJ() {
    setErro("");
    setDados(null);
    setMostrarJsonBruto(false);
    setCopiado(false);
    setAbaAtiva("resumo");

    if (cnpjLimpo.length !== 14) {
      setErro("Digite um CNPJ válido com 14 números.");
      return;
    }

    try {
      setLoading(true);

      const resposta = await fetch(`https://publica.cnpj.ws/cnpj/${cnpjLimpo}`);

      if (!resposta.ok) {
        if (resposta.status === 404) {
          throw new Error("CNPJ não encontrado na base consultada.");
        }

        if (resposta.status === 429) {
          throw new Error(
            "Muitas consultas em pouco tempo. Aguarde um momento e tente novamente."
          );
        }

        throw new Error("Não foi possível consultar esse CNPJ agora.");
      }

      const json = await resposta.json();

      setDados(json);
    } catch (error) {
      setErro(error.message || "Erro inesperado ao consultar o CNPJ.");
    } finally {
      setLoading(false);
    }
  }

  async function copiarJson() {
    if (!dados) return;

    await navigator.clipboard.writeText(JSON.stringify(dados, null, 2));
    setCopiado(true);

    setTimeout(() => {
      setCopiado(false);
    }, 1800);
  }

  function baixarJson() {
    if (!dados) return;

    const blob = new Blob([JSON.stringify(dados, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `consulta-cnpj-${cnpjLimpo || "empresa"}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  function imprimirCartao() {
    window.print();
  }

  function abrirReceitaFederal() {
    window.open(
      "https://solucoes.receita.fazenda.gov.br/Servicos/cnpjreva/cnpjreva_Solicitacao.asp",
      "_blank",
      "noopener,noreferrer"
    );
  }

  function abrirSintegra() {
    window.open(
      "https://www.sintegra.gov.br/",
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <PrintStyles />

      <div className="mx-auto max-w-7xl">
        <header className="no-print mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-6 shadow-2xl md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-indigo-400/30 bg-indigo-400/10 px-4 py-1 text-sm font-medium text-indigo-200">
                Consulta pública de CNPJ
              </div>

              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                Consulta Empresa Brasil
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Consulte dados públicos de empresas, visualize um cartão
                cadastral, organize inscrições estaduais, sócios, atividades e
                exporte as informações consultadas.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="text-slate-400">Fonte dos dados</p>
              <p className="font-semibold text-white">publica.cnpj.ws</p>
            </div>
          </div>
        </header>

        <section className="no-print mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-xl md:p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                CNPJ
              </label>

              <input
                value={cnpj}
                onChange={(event) =>
                  setCnpj(aplicarMascaraCnpj(event.target.value))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") consultarCNPJ();
                }}
                placeholder="00.000.000/0000-00"
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-5 py-4 text-lg font-semibold tracking-wide text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10"
              />
            </div>

            <button
              onClick={consultarCNPJ}
              disabled={loading}
              className="rounded-2xl bg-indigo-500 px-7 py-4 font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Consultando..." : "Consultar"}
            </button>
          </div>

          {erro && (
            <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {erro}
            </div>
          )}
        </section>

        {loading && <LoadingSkeleton />}

        {dados && !loading && (
          <div className="space-y-8">
            <section className="no-print rounded-3xl border border-white/10 bg-white/[0.03] p-3 shadow-xl">
              <div className="flex gap-2 overflow-x-auto p-2">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setAbaAtiva(tab.id)}
                    className={`whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-bold transition ${
                      abaAtiva === tab.id
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                        : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </section>

            {abaAtiva === "resumo" && (
              <ResumoTab
                dados={dados}
                estabelecimento={estabelecimento}
                enderecoCompleto={enderecoCompleto}
                cidadeUf={cidadeUf}
                telefone={telefone}
                cnaePrincipal={cnaePrincipal}
                formatarCNPJ={formatarCNPJ}
                formatarCEP={formatarCEP}
                formatarCapitalSocial={formatarCapitalSocial}
                abrirReceitaFederal={abrirReceitaFederal}
                abrirSintegra={abrirSintegra}
              />
            )}

            {abaAtiva === "cartao" && (
              <CartaoCnpjTab
                dados={dados}
                estabelecimento={estabelecimento}
                enderecoCompleto={enderecoCompleto}
                cidadeUf={cidadeUf}
                telefone={telefone}
                cnaePrincipal={cnaePrincipal}
                formatarCNPJ={formatarCNPJ}
                formatarCEP={formatarCEP}
                formatarCapitalSocial={formatarCapitalSocial}
                formatarData={formatarData}
                imprimirCartao={imprimirCartao}
                abrirReceitaFederal={abrirReceitaFederal}
              />
            )}

            {abaAtiva === "inscricoes" && (
              <InscricoesTab
                inscricoes={estabelecimento?.inscricoes_estaduais || []}
                formatarBooleano={formatarBooleano}
                formatarData={formatarData}
                abrirSintegra={abrirSintegra}
              />
            )}

            {abaAtiva === "socios" && (
              <SociosTab socios={dados?.socios || []} formatarData={formatarData} />
            )}

            {abaAtiva === "atividades" && (
              <AtividadesTab estabelecimento={estabelecimento} />
            )}

            {abaAtiva === "json" && (
              <JsonTab
                dados={dados}
                mostrarJsonBruto={mostrarJsonBruto}
                setMostrarJsonBruto={setMostrarJsonBruto}
                copiarJson={copiarJson}
                baixarJson={baixarJson}
                copiado={copiado}
                totalCamposPreenchidos={totalCamposPreenchidos}
                formatarValor={formatarValor}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function ResumoTab({
  dados,
  estabelecimento,
  enderecoCompleto,
  cidadeUf,
  telefone,
  cnaePrincipal,
  formatarCNPJ,
  formatarCEP,
  formatarCapitalSocial,
  abrirReceitaFederal,
  abrirSintegra,
}) {
  return (
    <section className="no-print overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-xl">
      <div className="border-b border-white/10 bg-white/[0.04] p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">
              Resumo da empresa
            </p>

            <h2 className="mt-2 text-2xl font-bold md:text-3xl">
              {dados.razao_social || "Razão social não informada"}
            </h2>

            <p className="mt-1 text-slate-400">
              {estabelecimento?.nome_fantasia || "Nome fantasia não informado"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200">
              {estabelecimento?.situacao_cadastral || "Situação não informada"}
            </span>

            <span className="rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-2 text-sm font-semibold text-indigo-200">
              {formatarCNPJ(estabelecimento?.cnpj)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-3 md:p-6">
        <InfoCard titulo="Razão social" valor={dados.razao_social} />
        <InfoCard titulo="Nome fantasia" valor={estabelecimento?.nome_fantasia} />
        <InfoCard titulo="Situação cadastral" valor={estabelecimento?.situacao_cadastral} />
        <InfoCard titulo="Endereço" valor={enderecoCompleto} destaque />
        <InfoCard titulo="Cidade / UF" valor={cidadeUf} />
        <InfoCard titulo="CEP" valor={formatarCEP(estabelecimento?.cep)} />
        <InfoCard titulo="CNAE principal" valor={cnaePrincipal} destaque />
        <InfoCard titulo="Telefone" valor={telefone} />
        <InfoCard titulo="E-mail" valor={estabelecimento?.email} />
        <InfoCard titulo="Capital social" valor={formatarCapitalSocial(dados.capital_social)} />
        <InfoCard titulo="Natureza jurídica" valor={dados.natureza_juridica?.descricao} />
        <InfoCard titulo="Porte" valor={dados.porte?.descricao} />
      </div>

      <div className="flex flex-wrap gap-3 border-t border-white/10 p-5 md:p-6">
        <button
          onClick={abrirReceitaFederal}
          className="rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-400"
        >
          Abrir comprovante oficial na Receita
        </button>

        <button
          onClick={abrirSintegra}
          className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
        >
          Abrir SINTEGRA
        </button>
      </div>
    </section>
  );
}

function CartaoCnpjTab({
  dados,
  estabelecimento,
  enderecoCompleto,
  cidadeUf,
  telefone,
  cnaePrincipal,
  formatarCNPJ,
  formatarCEP,
  formatarCapitalSocial,
  formatarData,
  imprimirCartao,
  abrirReceitaFederal,
}) {
  return (
    <section className="space-y-5">
      <div className="no-print rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-xl md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">
              Cartão cadastral
            </p>

            <h2 className="mt-2 text-2xl font-bold">Cartão CNPJ para impressão</h2>

            <p className="mt-2 text-sm text-slate-400">
              Este cartão é gerado pelo seu app com base nos dados públicos
              consultados. Para documento oficial, use o botão da Receita Federal.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={imprimirCartao}
              className="rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-400"
            >
              Imprimir / Salvar PDF
            </button>

            <button
              onClick={abrirReceitaFederal}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Abrir Receita Federal
            </button>
          </div>
        </div>
      </div>

      <div
        id="cartao-cnpj-print"
        className="rounded-3xl border border-slate-300 bg-white p-6 text-slate-950 shadow-xl md:p-10"
      >
        <div className="border-b-2 border-slate-900 pb-5 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em]">
            República Federativa do Brasil
          </p>
          <h1 className="mt-2 text-xl font-black uppercase md:text-2xl">
            Cartão Cadastral de Pessoa Jurídica
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Documento gerado para conferência interna com base em dados públicos
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <PrintField label="CNPJ" value={formatarCNPJ(estabelecimento?.cnpj)} />
          <PrintField label="Situação cadastral" value={estabelecimento?.situacao_cadastral} />
          <PrintField label="Razão social" value={dados.razao_social} wide />
          <PrintField label="Nome fantasia" value={estabelecimento?.nome_fantasia} wide />
          <PrintField label="Porte" value={dados.porte?.descricao} />
          <PrintField label="Capital social" value={formatarCapitalSocial(dados.capital_social)} />
          <PrintField label="Natureza jurídica" value={dados.natureza_juridica?.descricao} wide />
          <PrintField label="CNAE principal" value={cnaePrincipal} wide />
          <PrintField label="Endereço" value={enderecoCompleto} wide />
          <PrintField label="CEP" value={formatarCEP(estabelecimento?.cep)} />
          <PrintField label="Cidade / UF" value={cidadeUf} />
          <PrintField label="Telefone" value={telefone} />
          <PrintField label="E-mail" value={estabelecimento?.email} />
          <PrintField label="Data de início da atividade" value={formatarData(estabelecimento?.data_inicio_atividade)} />
          <PrintField label="Atualizado em" value={formatarData(estabelecimento?.atualizado_em)} />
        </div>

        <div className="mt-8 rounded-xl border border-slate-300 p-4 text-xs leading-5 text-slate-700">
          <strong>Observação:</strong> este cartão não substitui o comprovante
          oficial emitido pela Receita Federal. Utilize este documento para
          conferência operacional, cadastro interno e apoio em processos de
          fornecedores, clientes e parceiros.
        </div>
      </div>
    </section>
  );
}

function InscricoesTab({ inscricoes, formatarBooleano, formatarData, abrirSintegra }) {
  return (
    <section className="no-print rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-xl md:p-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">
            Inscrições estaduais
          </p>

          <h2 className="mt-2 text-2xl font-bold">Registros encontrados</h2>

          <p className="mt-2 text-sm text-slate-400">
            Para comprovante oficial, consulte o SINTEGRA ou a Sefaz do estado.
          </p>
        </div>

        <button
          onClick={abrirSintegra}
          className="rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-400"
        >
          Abrir SINTEGRA
        </button>
      </div>

      {inscricoes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {inscricoes.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"
            >
              <p className="text-xs uppercase tracking-widest text-slate-500">
                Inscrição estadual
              </p>

              <p className="mt-2 text-lg font-bold text-white">
                {item.inscricao_estadual || "-"}
              </p>

              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p>
                  <span className="text-slate-500">Estado: </span>
                  {item.estado?.nome || item.estado?.sigla || "-"}
                </p>

                <p>
                  <span className="text-slate-500">Ativo: </span>
                  {formatarBooleano(item.ativo)}
                </p>

                <p>
                  <span className="text-slate-500">Atualizado em: </span>
                  {formatarData(item.atualizado_em)}
                </p>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(item.inscricao_estadual || "")
                  }
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
                >
                  Copiar IE
                </button>

                <button
                  onClick={abrirSintegra}
                  className="rounded-xl border border-indigo-400/20 bg-indigo-400/10 px-3 py-2 text-xs font-bold text-indigo-200 transition hover:bg-indigo-400/20"
                >
                  Consultar oficial
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState mensagem="Nenhuma inscrição estadual retornada pela API." />
      )}
    </section>
  );
}

function SociosTab({ socios, formatarData }) {
  return (
    <section className="no-print rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-xl md:p-6">
      <div className="mb-5">
        <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">
          Quadro societário
        </p>

        <h2 className="mt-2 text-2xl font-bold">Sócios encontrados</h2>

        <p className="mt-2 text-sm text-slate-400">
          Exibição baseada nos dados disponíveis no retorno da API.
        </p>
      </div>

      {socios.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {socios.map((socio, index) => (
            <div
              key={index}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"
            >
              <p className="text-xs uppercase tracking-widest text-slate-500">
                Sócio {index + 1}
              </p>

              <h3 className="mt-2 text-xl font-bold text-white">
                {socio.nome || socio.nome_socio || "Nome não informado"}
              </h3>

              <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                <p>
                  <span className="text-slate-500">Documento: </span>
                  {socio.cpf_cnpj_socio || socio.cnpj_cpf_do_socio || "-"}
                </p>

                <p>
                  <span className="text-slate-500">Tipo: </span>
                  {socio.tipo || "-"}
                </p>

                <p>
                  <span className="text-slate-500">Qualificação: </span>
                  {socio.qualificacao_socio?.descricao ||
                    socio.qualificacao?.descricao ||
                    "-"}
                </p>

                <p>
                  <span className="text-slate-500">Entrada: </span>
                  {formatarData(socio.data_entrada)}
                </p>

                <p>
                  <span className="text-slate-500">País: </span>
                  {socio.pais?.nome || "-"}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState mensagem="Nenhum sócio retornado pela API para este CNPJ." />
      )}
    </section>
  );
}

function AtividadesTab({ estabelecimento }) {
  const principal = estabelecimento?.atividade_principal;
  const secundarias = estabelecimento?.atividades_secundarias || [];

  return (
    <section className="no-print rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-xl md:p-6">
      <div className="mb-5">
        <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">
          Atividades econômicas
        </p>

        <h2 className="mt-2 text-2xl font-bold">CNAEs da empresa</h2>
      </div>

      <div className="mb-5 rounded-2xl border border-indigo-400/20 bg-indigo-400/10 p-5">
        <p className="text-xs uppercase tracking-widest text-indigo-300">
          Atividade principal
        </p>

        <h3 className="mt-2 text-xl font-bold text-white">
          {principal ? `${principal.id} - ${principal.descricao}` : "-"}
        </h3>
      </div>

      <div>
        <p className="mb-3 text-sm font-bold text-slate-300">
          Atividades secundárias
        </p>

        {secundarias.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {secundarias.map((atividade, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"
              >
                <p className="text-sm font-bold text-white">{atividade.id}</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  {atividade.descricao}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState mensagem="Nenhuma atividade secundária retornada pela API." />
        )}
      </div>
    </section>
  );
}

function JsonTab({
  dados,
  mostrarJsonBruto,
  setMostrarJsonBruto,
  copiarJson,
  baixarJson,
  copiado,
  totalCamposPreenchidos,
  formatarValor,
}) {
  return (
    <section className="no-print rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-xl md:p-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">
            Dados completos
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Renderização dinâmica do JSON
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Campos preenchidos encontrados:{" "}
            <span className="font-bold text-white">{totalCamposPreenchidos}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMostrarJsonBruto((valor) => !valor)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {mostrarJsonBruto ? "Ver accordion" : "Ver JSON bruto"}
          </button>

          <button
            onClick={copiarJson}
            className="rounded-xl border border-indigo-400/20 bg-indigo-400/10 px-4 py-3 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-400/20"
          >
            {copiado ? "Copiado!" : "Copiar JSON"}
          </button>

          <button
            onClick={baixarJson}
            className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
          >
            Baixar JSON
          </button>
        </div>
      </div>

      {mostrarJsonBruto ? (
        <pre className="max-h-[650px] overflow-auto rounded-2xl border border-white/10 bg-slate-950 p-5 text-sm leading-6 text-slate-300">
          {JSON.stringify(dados, null, 2)}
        </pre>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <DynamicAccordion
            dados={dados}
            nomeCampo="dados"
            path="dados"
            nivel={0}
            formatarValor={formatarValor}
          />
        </div>
      )}
    </section>
  );
}

function DynamicAccordion({ dados, nomeCampo, path, nivel, formatarValor }) {
  const [aberto, setAberto] = useState(nivel === 0);

  if (dados === null || dados === undefined || dados === "") {
    return <span className="text-slate-500">-</span>;
  }

  const ehObjeto = typeof dados === "object";
  const ehArray = Array.isArray(dados);

  if (!ehObjeto) {
    return (
      <span className="break-words text-sm text-slate-200">
        {formatarValor(nomeCampo, dados)}
      </span>
    );
  }

  const entradas = ehArray ? dados.map((item, index) => [index, item]) : Object.entries(dados);

  const descricao = ehArray
    ? `lista com ${dados.length} item(ns)`
    : `objeto com ${entradas.length} campo(s)`;

  return (
    <div className={`${nivel === 0 ? "" : "mt-3"} space-y-3`}>
      <button
        onClick={() => setAberto((valor) => !valor)}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:bg-white/[0.07]"
      >
        <div>
          <p className="text-sm font-bold text-white">{String(nomeCampo)}</p>
          <p className="text-xs text-slate-500">{descricao}</p>
        </div>

        <span className="text-lg font-black text-indigo-300">
          {aberto ? "−" : "+"}
        </span>
      </button>

      {aberto && (
        <div className="space-y-3 border-l border-white/10 pl-3 md:pl-5">
          {entradas.length === 0 ? (
            <span className="text-sm text-slate-500">Sem dados.</span>
          ) : (
            entradas.map(([chave, valor]) => {
              const itemEhComplexo =
                valor !== null && typeof valor === "object";

              return (
                <div
                  key={`${path}.${chave}`}
                  className="rounded-xl border border-white/10 bg-slate-900/70 p-4"
                >
                  {itemEhComplexo ? (
                    <DynamicAccordion
                      dados={valor}
                      nomeCampo={ehArray ? `Item ${Number(chave) + 1}` : chave}
                      path={`${path}.${chave}`}
                      nivel={nivel + 1}
                      formatarValor={formatarValor}
                    />
                  ) : (
                    <>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-white/10 px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-300">
                          {String(chave)}
                        </span>

                        <span className="text-xs text-slate-500">
                          {typeof valor}
                        </span>
                      </div>

                      <p className="break-words text-sm leading-6 text-slate-200">
                        {formatarValor(chave, valor)}
                      </p>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function InfoCard({ titulo, valor, destaque = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        destaque
          ? "border-indigo-400/20 bg-indigo-400/10"
          : "border-white/10 bg-slate-900/70"
      }`}
    >
      <p className="text-xs uppercase tracking-widest text-slate-500">{titulo}</p>

      <p className="mt-2 break-words text-base font-semibold leading-6 text-white">
        {valor || "-"}
      </p>
    </div>
  );
}

function PrintField({ label, value, wide = false }) {
  return (
    <div
      className={`rounded-lg border border-slate-300 p-3 ${
        wide ? "md:col-span-2" : ""
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-slate-950">
        {value || "-"}
      </p>
    </div>
  );
}

function EmptyState({ mensagem }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-slate-400">
      {mensagem}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <section className="no-print rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-1/3 rounded bg-white/10" />
        <div className="h-24 rounded-2xl bg-white/10" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-24 rounded-2xl bg-white/10" />
          <div className="h-24 rounded-2xl bg-white/10" />
          <div className="h-24 rounded-2xl bg-white/10" />
        </div>
      </div>
    </section>
  );
}

function PrintStyles() {
  return (
    <style>
      {`
        @media print {
          body {
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          #cartao-cnpj-print,
          #cartao-cnpj-print * {
            visibility: visible !important;
          }

          #cartao-cnpj-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}
    </style>
  );
}

function contarCamposPreenchidos(obj) {
  let total = 0;

  function percorrer(valor) {
    if (Array.isArray(valor)) {
      valor.forEach(percorrer);
      return;
    }

    if (valor && typeof valor === "object") {
      Object.values(valor).forEach(percorrer);
      return;
    }

    if (valor !== null && valor !== undefined && valor !== "") {
      total += 1;
    }
  }

  percorrer(obj);
  return total;
}