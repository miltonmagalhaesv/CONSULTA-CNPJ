import { useMemo, useState } from "react";

export default function App() {
  const [cnpj, setCnpj] = useState("");
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarJson, setMostrarJson] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const cnpjLimpo = cnpj.replace(/\D/g, "");

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

    const chaveNormalizada = chave.toLowerCase();

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

  const totalCamposPreenchidos = useMemo(() => {
    if (!dados) return 0;
    return contarCamposPreenchidos(dados);
  }, [dados]);

  async function consultarCNPJ() {
    setErro("");
    setDados(null);
    setMostrarJson(false);
    setCopiado(false);

    if (cnpjLimpo.length !== 14) {
      setErro("Digite um CNPJ válido com 14 números.");
      return;
    }

    try {
      setLoading(true);

      const resposta = await fetch(
        `https://publica.cnpj.ws/cnpj/${cnpjLimpo}`
      );

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

  const estabelecimento = dados?.estabelecimento;

  const endereco = estabelecimento
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
    ? [
        estabelecimento.cidade?.nome,
        estabelecimento.estado?.sigla,
      ]
        .filter(Boolean)
        .join(" / ")
    : "-";

  const telefone = estabelecimento
    ? [
        estabelecimento.ddd1,
        estabelecimento.telefone1,
      ]
        .filter(Boolean)
        .join(" ")
    : "-";

  const cnaePrincipal = estabelecimento?.atividade_principal
    ? `${estabelecimento.atividade_principal.id} - ${estabelecimento.atividade_principal.descricao}`
    : "-";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-6 shadow-2xl md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-indigo-400/30 bg-indigo-400/10 px-4 py-1 text-sm font-medium text-indigo-200">
                Consulta pública de CNPJ
              </div>

              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                Consulte empresas de forma rápida e organizada
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Informe um CNPJ para visualizar o resumo da empresa, endereço,
                contatos, CNAE, inscrições estaduais e todos os dados retornados
                pela API em uma visualização dinâmica.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="text-slate-400">Fonte</p>
              <p className="font-semibold text-white">publica.cnpj.ws</p>
            </div>
          </div>
        </header>

        <section className="mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-xl md:p-6">
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

        {loading && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
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
        )}

        {dados && !loading && (
          <div className="space-y-8">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-xl">
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
                      {estabelecimento?.nome_fantasia ||
                        "Nome fantasia não informado"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200">
                      {estabelecimento?.situacao_cadastral || "Situação não informada"}
                    </span>

                    <span className="rounded-full border border-indigo-400/20 bg-indigo-400/10 px-4 py-2 text-sm font-semibold text-indigo-200">
                      {formatarCNPJ(estabelecimento?.cnpj || cnpjLimpo)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-3 md:p-6">
                <InfoCard titulo="Razão social" valor={dados.razao_social} />
                <InfoCard
                  titulo="Nome fantasia"
                  valor={estabelecimento?.nome_fantasia}
                />
                <InfoCard
                  titulo="Situação"
                  valor={estabelecimento?.situacao_cadastral}
                />
                <InfoCard titulo="Endereço" valor={endereco} destaque />
                <InfoCard titulo="Cidade / UF" valor={cidadeUf} />
                <InfoCard
                  titulo="CEP"
                  valor={formatarCEP(estabelecimento?.cep)}
                />
                <InfoCard titulo="CNAE principal" valor={cnaePrincipal} destaque />
                <InfoCard titulo="Telefone" valor={telefone} />
                <InfoCard titulo="E-mail" valor={estabelecimento?.email} />
                <InfoCard
                  titulo="Capital social"
                  valor={formatarCapitalSocial(dados.capital_social)}
                />
                <InfoCard
                  titulo="Natureza jurídica"
                  valor={dados.natureza_juridica?.descricao}
                />
                <InfoCard titulo="Porte" valor={dados.porte?.descricao} />
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-xl md:p-6">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">
                    Inscrições estaduais
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    Registros encontrados
                  </h2>
                </div>

                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                  {estabelecimento?.inscricoes_estaduais?.length || 0} inscrição(ões)
                </span>
              </div>

              {estabelecimento?.inscricoes_estaduais?.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {estabelecimento.inscricoes_estaduais.map((item, index) => (
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-slate-400">
                  Nenhuma inscrição estadual retornada pela API.
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-xl md:p-6">
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
                    <span className="font-bold text-white">
                      {totalCamposPreenchidos}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setMostrarJson((valor) => !valor)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    {mostrarJson ? "Ver cards" : "Ver JSON bruto"}
                  </button>

                  <button
                    onClick={copiarJson}
                    className="rounded-xl border border-indigo-400/20 bg-indigo-400/10 px-4 py-3 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-400/20"
                  >
                    {copiado ? "Copiado!" : "Copiar JSON"}
                  </button>
                </div>
              </div>

              {mostrarJson ? (
                <pre className="max-h-[650px] overflow-auto rounded-2xl border border-white/10 bg-slate-950 p-5 text-sm leading-6 text-slate-300">
                  {JSON.stringify(dados, null, 2)}
                </pre>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <RenderDinamico dados={dados} nivel={0} formatarValor={formatarValor} />
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
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
      <p className="text-xs uppercase tracking-widest text-slate-500">
        {titulo}
      </p>

      <p className="mt-2 break-words text-base font-semibold leading-6 text-white">
        {valor || "-"}
      </p>
    </div>
  );
}

function RenderDinamico({ dados, nivel = 0, formatarValor, nomeCampo = "root" }) {
  if (dados === null || dados === undefined || dados === "") {
    return <span className="text-slate-500">-</span>;
  }

  if (Array.isArray(dados)) {
    if (dados.length === 0) {
      return <span className="text-slate-500">Lista vazia</span>;
    }

    return (
      <div className="space-y-3">
        {dados.map((item, index) => (
          <div
            key={index}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-indigo-300">
              Item {index + 1}
            </div>

            <RenderDinamico
              dados={item}
              nivel={nivel + 1}
              formatarValor={formatarValor}
              nomeCampo={nomeCampo}
            />
          </div>
        ))}
      </div>
    );
  }

  if (typeof dados === "object") {
    const entradas = Object.entries(dados);

    if (entradas.length === 0) {
      return <span className="text-slate-500">Objeto vazio</span>;
    }

    return (
      <div className="space-y-3">
        {entradas.map(([chave, valor]) => {
          const ehComplexo =
            valor !== null && typeof valor === "object";

          return (
            <div
              key={chave}
              className={`rounded-xl border border-white/10 ${
                nivel === 0 ? "bg-white/[0.03]" : "bg-slate-900/70"
              } p-4`}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-white/10 px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-300">
                  {chave}
                </span>

                <span className="text-xs text-slate-500">
                  {Array.isArray(valor)
                    ? `lista com ${valor.length} item(ns)`
                    : ehComplexo
                    ? "objeto"
                    : typeof valor}
                </span>
              </div>

              {ehComplexo ? (
                <RenderDinamico
                  dados={valor}
                  nivel={nivel + 1}
                  formatarValor={formatarValor}
                  nomeCampo={chave}
                />
              ) : (
                <p className="break-words text-sm leading-6 text-slate-200">
                  {formatarValor(chave, valor)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <span className="break-words text-sm text-slate-200">
      {formatarValor(nomeCampo, dados)}
    </span>
  );
}