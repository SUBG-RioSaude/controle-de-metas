import { beforeEach, describe, expect, it } from "vitest";
import {
  dispararDownload,
  totalDocumentosDaMeta,
  totalDocumentosDoTema,
  totalDocumentosDosTemas,
  urlDownloadDocumento,
  urlDownloadMeta,
  urlDownloadTema,
  urlDownloadTodosTemas,
} from "@/lib/downloads";
import type { ApiTema, ApiTopico, DocumentoPublico } from "@/lib/types";

const BASE = "https://api.exemplo.gov.br";

function doc(id: string): DocumentoPublico {
  return {
    id,
    nome: `${id}.pdf`,
    driveOficialUrl: `https://drive.google.com/file/d/${id}/view`,
    aprovadoEm: "2026-05-01T12:00:00Z",
  };
}

function topico(id: string, documentos: DocumentoPublico[]): ApiTopico {
  return {
    id,
    temaId: "tema-1",
    descricao: `Meta ${id}`,
    setorIds: [],
    setorNomes: [],
    pontosFocais: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    metas: [],
    documentosAprovados: documentos,
    temDocumentoOficial: documentos.length > 0,
  };
}

function tema(id: string, topicos: ApiTopico[]): ApiTema {
  return {
    id,
    nome: `Tema ${id}`,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    topicos,
  };
}

beforeEach(() => {
  // As funções leem a base da API de window.__ENV__ em runtime (não inlined no build).
  window.__ENV__ = { NEXT_PUBLIC_METAS_API: BASE };
  document.body.innerHTML = "";
});

describe("URLs de download", () => {
  it("monta a URL do ZIP de todos os temas", () => {
    expect(urlDownloadTodosTemas()).toBe(`${BASE}/downloads/temas`);
  });

  it("monta a URL do ZIP de um tema", () => {
    expect(urlDownloadTema("abc")).toBe(`${BASE}/downloads/temas/abc`);
  });

  it("aponta a Meta da interface para o endpoint de tópicos da API", () => {
    expect(urlDownloadMeta("abc")).toBe(`${BASE}/downloads/topicos/abc`);
  });

  it("monta a URL de um documento individual", () => {
    expect(urlDownloadDocumento("abc")).toBe(`${BASE}/downloads/documentos/abc`);
  });

  it("não duplica barra quando a base termina em /", () => {
    window.__ENV__ = { NEXT_PUBLIC_METAS_API: `${BASE}/` };
    expect(urlDownloadTema("abc")).toBe(`${BASE}/downloads/temas/abc`);
  });
});

describe("contagem de documentos oficiais", () => {
  const t1 = topico("1", [doc("a"), doc("b")]);
  const t2 = topico("2", []);
  const t3 = topico("3", [doc("c")]);

  it("conta os documentos de uma meta", () => {
    expect(totalDocumentosDaMeta(t1)).toBe(2);
    expect(totalDocumentosDaMeta(t2)).toBe(0);
  });

  it("soma os documentos de todas as metas do tema", () => {
    expect(totalDocumentosDoTema(tema("x", [t1, t2, t3]))).toBe(3);
  });

  it("soma os documentos de todos os temas", () => {
    expect(totalDocumentosDosTemas([tema("x", [t1]), tema("y", [t3])])).toBe(3);
  });

  it("retorna zero quando não há tema nenhum", () => {
    expect(totalDocumentosDosTemas([])).toBe(0);
  });
});

describe("dispararDownload", () => {
  // preventDefault evita que o jsdom tente navegar de verdade (ele não implementa
  // navegação e só imprimiria ruído no stderr); de quebra captura o link criado.
  function capturarClique(): () => HTMLAnchorElement | null {
    let clicado: HTMLAnchorElement | null = null;
    document.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        clicado = e.target as HTMLAnchorElement;
      },
      { capture: true, once: true }
    );
    return () => clicado;
  }

  it("clica em um link apontando para a URL recebida", () => {
    const link = capturarClique();
    const url = urlDownloadTema("abc");

    dispararDownload(url);

    expect(link()?.tagName).toBe("A");
    expect(link()?.getAttribute("href")).toBe(url);
    expect(link()?.getAttribute("download")).toBe("");
  });

  it("não deixa o link temporário no DOM depois do clique", () => {
    capturarClique();
    dispararDownload(urlDownloadTema("abc"));
    expect(document.querySelectorAll("a").length).toBe(0);
  });
});
