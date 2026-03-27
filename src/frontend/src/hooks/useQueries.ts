import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExecutiveCredential, ProfitRecord } from "../backend.d";
import { useActor } from "./useActor";

export function useAllProfitRecords() {
  const { actor, isFetching } = useActor();
  return useQuery<ProfitRecord[]>({
    queryKey: ["profit-records"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProfitRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMonthlyProfitRecords(yearMonth: string) {
  const { actor, isFetching } = useActor();
  return useQuery<ProfitRecord[]>({
    queryKey: ["profit-records", "monthly", yearMonth],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMonthlyProfitRecords(yearMonth);
    },
    enabled: !!actor && !isFetching && !!yearMonth,
  });
}

export function useMonthlyProfitRecordsByExecutive(
  executiveUsername: string,
  yearMonth: string,
) {
  const { actor, isFetching } = useActor();
  return useQuery<ProfitRecord[]>({
    queryKey: ["profit-records", "monthly", yearMonth, executiveUsername],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMonthlyProfitRecordsByExecutive(
        executiveUsername,
        yearMonth,
      );
    },
    enabled: !!actor && !isFetching && !!yearMonth && !!executiveUsername,
  });
}

export function useAllExecutives() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[ExecutiveCredential, bigint]>>({
    queryKey: ["executives"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllExecutives();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddProfitRecordAsAdmin() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      date: string;
      customerName: string;
      amountReceived: number;
      dailyTarget: number;
      executiveName: string;
      executiveUsername: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addProfitRecordAsAdmin(
        vars.id,
        vars.date,
        vars.customerName,
        vars.amountReceived,
        vars.dailyTarget,
        vars.executiveName,
        vars.executiveUsername,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profit-records"] });
    },
  });
}

export function useAddProfitRecordAsExecutive() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      date: string;
      customerName: string;
      amountReceived: number;
      executiveName: string;
      executiveUsername: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addProfitRecordAsExecutive(
        vars.id,
        vars.date,
        vars.customerName,
        vars.amountReceived,
        vars.executiveName,
        vars.executiveUsername,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profit-records"] });
    },
  });
}

export function useAddExecutive() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      name: string;
      username: string;
      password: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.addExecutive(vars.name, vars.username, vars.password);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executives"] });
    },
  });
}

export function useDeleteExecutive() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteExecutive(username);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["executives"] });
    },
  });
}

export function useDeleteProfitRecord() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteProfitRecord(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profit-records"] });
    },
  });
}

export function useChangeAdminPassword() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: (newPassword: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.changeAdminPassword(newPassword);
    },
  });
}
