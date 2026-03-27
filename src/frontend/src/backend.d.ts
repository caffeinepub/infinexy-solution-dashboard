import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ExecutiveCredential {
    username: string;
    password: string;
    name: string;
}
export interface UserProfile {
    username: string;
    name: string;
    role: string;
}
export interface ProfitRecord {
    id: string;
    customerName: string;
    isDailyTargetSet: boolean;
    dailyTarget: number;
    date: string;
    createdAt: bigint;
    executiveName: string;
    executiveUsername: string;
    amountReceived: number;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addExecutive(name: string, username: string, password: string): Promise<void>;
    addProfitRecordAsAdmin(id: string, date: string, customerName: string, amountReceived: number, dailyTarget: number, executiveName: string, executiveUsername: string): Promise<void>;
    addProfitRecordAsExecutive(id: string, date: string, customerName: string, amountReceived: number, executiveName: string, executiveUsername: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    authenticateAdmin(username: string, password: string): Promise<string>;
    authenticateExecutive(username: string, password: string): Promise<string>;
    changeAdminPassword(newPassword: string): Promise<void>;
    changeExecutivePassword(username: string, newPassword: string): Promise<void>;
    deleteExecutive(username: string): Promise<void>;
    deleteProfitRecord(id: string): Promise<void>;
    getAllExecutives(): Promise<Array<[ExecutiveCredential, bigint]>>;
    getAllProfitRecords(): Promise<Array<ProfitRecord>>;
    getAnnualProfitRecords(year: string): Promise<Array<ProfitRecord>>;
    getAnnualProfitRecordsByExecutive(executiveUsername: string, year: string): Promise<Array<ProfitRecord>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getExecutive(username: string): Promise<ExecutiveCredential>;
    getExecutiveName(executiveUsername: string): Promise<string>;
    getMonthlyProfitRecords(yearMonth: string): Promise<Array<ProfitRecord>>;
    getMonthlyProfitRecordsByExecutive(executiveUsername: string, yearMonth: string): Promise<Array<ProfitRecord>>;
    getProfitRecordsForExecutive(executiveUsername: string): Promise<Array<ProfitRecord>>;
    getRecordsByDay(day: string): Promise<Array<ProfitRecord>>;
    getRecordsByExecutiveByDay(executiveUsername: string, day: string): Promise<Array<ProfitRecord>>;
    getRecordsSortedByAmountReceived(): Promise<Array<ProfitRecord>>;
    getRecordsSortedByDailyTarget(): Promise<Array<ProfitRecord>>;
    getRecordsSortedByDate(): Promise<Array<ProfitRecord>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isAdminMode(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
