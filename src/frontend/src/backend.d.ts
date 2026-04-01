import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Article {
    id: bigint;
    title: string;
    content: string;
    publishDate: bigint;
}
export interface backendInterface {
    changePassword(currentPassword: string, newPassword: string): Promise<string>;
    deleteArticle(id: bigint, pass: string): Promise<string>;
    getArticles(): Promise<Array<Article>>;
    publishArticle(pass: string, title: string, content: string): Promise<string>;
}
