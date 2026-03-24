"use client";

import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { getToken } from "@/lib/auth";

export type MetaStatus =
  | "NaoIniciada"
  | "EmAndamento"
  | "PendenteAprovacao"
  | "Concluido"
  | "AguardandoRetorno";

export interface MetaStatusChangedPayload {
  metaId:   string;
  topicoId: string;
  status:   MetaStatus;
}

export interface MetaCreatedPayload {
  id:              string;
  topicoId:        string;
  descricao:       string;
  status:          MetaStatus;
  documentUrl:     string | null;
  approverComment: string | null;
  createdAt:       string;
  updatedAt:       string;
}

export interface TopicoDocumentoPayload {
  id:                  string;
  topicoId:            string;
  nome:                string;
  driveUrl:            string;
  driveOficialUrl?:    string;
  uploadedAt:          string;
  uploadedByUserId:    string;
  status:              "PendenteAprovacao" | "Aprovado" | "Devolvido";
  comentarioAprovacao?: string;
}

export interface TopicoDocumentoRemovedPayload {
  topicoId: string;
  docId:    string;
}

export interface MetaStatusLoggedPayload {
  metaId: string;
  log: MetaStatusLog;
}

export interface TopicoDocumentLoggedPayload {
  topicoId: string;
  docId:    string;
  log:      DocumentoLog;
}

export interface UserRoleLoggedPayload {
  targetUserId: string;
  log:          UserRoleLog;
}

// Minimal log types (same shape as backend DTOs)
export interface MetaStatusLog   { id: string; statusAnterior: string; statusNovo: string; criadoEm: string; userNome: string; userEmail: string; }
export interface DocumentoLog    { id: string; acao: string; detalhes?: string; criadoEm: string; userNome: string; userEmail: string; }
export interface UserRoleLog     { id: string; roleAnterior: string; roleNova: string; criadoEm: string; changedByNome: string; changedByEmail: string; }

interface UseMetaHubOptions {
  onMetaStatusChanged?:      (payload: MetaStatusChangedPayload) => void;
  onMetaCreated?:            (payload: MetaCreatedPayload) => void;
  onTopicoDocumentAdded?:    (payload: TopicoDocumentoPayload) => void;
  onTopicoDocumentRemoved?:  (payload: TopicoDocumentoRemovedPayload) => void;
  onTopicoDocumentUpdated?:  (payload: TopicoDocumentoPayload) => void;
  onMetaStatusLogged?:       (payload: MetaStatusLoggedPayload) => void;
  onTopicoDocumentLogged?:   (payload: TopicoDocumentLoggedPayload) => void;
  onUserRoleLogged?:         (payload: UserRoleLoggedPayload) => void;
}

// Module-level variables to share connection across remounts (fixes double/triple /negotiate in dev)
let globalConnection: signalR.HubConnection | null = null;
let subscribers = 0;
let disconnectTimeout: NodeJS.Timeout | null = null;

export function useMetaHub({
  onMetaStatusChanged,
  onMetaCreated,
  onTopicoDocumentAdded,
  onTopicoDocumentRemoved,
  onTopicoDocumentUpdated,
  onMetaStatusLogged,
  onTopicoDocumentLogged,
  onUserRoleLogged,
}: UseMetaHubOptions) {
  const onStatusRef          = useRef(onMetaStatusChanged);
  const onCreatedRef         = useRef(onMetaCreated);
  const onDocAddedRef        = useRef(onTopicoDocumentAdded);
  const onDocRemovedRef      = useRef(onTopicoDocumentRemoved);
  const onDocUpdatedRef      = useRef(onTopicoDocumentUpdated);
  const onMetaLoggedRef      = useRef(onMetaStatusLogged);
  const onDocLoggedRef       = useRef(onTopicoDocumentLogged);
  const onUserRoleLoggedRef  = useRef(onUserRoleLogged);

  useEffect(() => { onStatusRef.current         = onMetaStatusChanged;     }, [onMetaStatusChanged]);
  useEffect(() => { onCreatedRef.current        = onMetaCreated;           }, [onMetaCreated]);
  useEffect(() => { onDocAddedRef.current       = onTopicoDocumentAdded;   }, [onTopicoDocumentAdded]);
  useEffect(() => { onDocRemovedRef.current     = onTopicoDocumentRemoved; }, [onTopicoDocumentRemoved]);
  useEffect(() => { onDocUpdatedRef.current     = onTopicoDocumentUpdated; }, [onTopicoDocumentUpdated]);
  useEffect(() => { onMetaLoggedRef.current     = onMetaStatusLogged;      }, [onMetaStatusLogged]);
  useEffect(() => { onDocLoggedRef.current      = onTopicoDocumentLogged;  }, [onTopicoDocumentLogged]);
  useEffect(() => { onUserRoleLoggedRef.current = onUserRoleLogged;        }, [onUserRoleLogged]);

  useEffect(() => {
    subscribers++;

    if (disconnectTimeout) {
      clearTimeout(disconnectTimeout);
      disconnectTimeout = null;
    }

    if (!globalConnection) {
      const token = getToken();
      if (!token) return;

      const hub = window.__ENV__?.NEXT_PUBLIC_AUTH_API || "";
      globalConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${hub}/hubs/meta`, { accessTokenFactory: () => getToken() ?? "" })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      globalConnection.start()
        .then(() => console.log("[MetaHub] Connected to SignalR"))
        .catch(err => console.error("[MetaHub] Connection failed:", err));
    }

    const handleStatus      = (p: MetaStatusChangedPayload)      => onStatusRef.current?.(p);
    const handleCreated     = (p: MetaCreatedPayload)             => onCreatedRef.current?.(p);
    const handleDocAdded    = (p: TopicoDocumentoPayload)         => onDocAddedRef.current?.(p);
    const handleDocRemoved  = (p: TopicoDocumentoRemovedPayload)  => onDocRemovedRef.current?.(p);
    const handleDocUpdated  = (p: TopicoDocumentoPayload)         => onDocUpdatedRef.current?.(p);
    const handleMetaLogged  = (p: MetaStatusLoggedPayload)        => onMetaLoggedRef.current?.(p);
    const handleDocLogged   = (p: TopicoDocumentLoggedPayload)    => onDocLoggedRef.current?.(p);
    const handleRoleLogged  = (p: UserRoleLoggedPayload)          => onUserRoleLoggedRef.current?.(p);

    globalConnection.on("metaStatusChanged",     handleStatus);
    globalConnection.on("metaCreated",           handleCreated);
    globalConnection.on("topicoDocumentAdded",   handleDocAdded);
    globalConnection.on("topicoDocumentRemoved", handleDocRemoved);
    globalConnection.on("topicoDocumentUpdated", handleDocUpdated);
    globalConnection.on("metaStatusLogged",      handleMetaLogged);
    globalConnection.on("topicoDocumentLogged",  handleDocLogged);
    globalConnection.on("userRoleLogged",        handleRoleLogged);

    return () => {
      if (globalConnection) {
        globalConnection.off("metaStatusChanged",     handleStatus);
        globalConnection.off("metaCreated",           handleCreated);
        globalConnection.off("topicoDocumentAdded",   handleDocAdded);
        globalConnection.off("topicoDocumentRemoved", handleDocRemoved);
        globalConnection.off("topicoDocumentUpdated", handleDocUpdated);
        globalConnection.off("metaStatusLogged",      handleMetaLogged);
        globalConnection.off("topicoDocumentLogged",  handleDocLogged);
        globalConnection.off("userRoleLogged",        handleRoleLogged);
      }

      subscribers--;
      if (subscribers === 0) {
        disconnectTimeout = setTimeout(() => {
          if (subscribers === 0 && globalConnection) {
            globalConnection.stop().catch(() => {});
            globalConnection = null;
            console.log("[MetaHub] Disconnected");
          }
        }, 1000);
      }
    };
  }, []);
}
