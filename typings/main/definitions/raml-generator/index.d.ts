// Generated by typings
// Source: node_modules/raml-generator/dist/index.d.ts
declare module '~raml-generator/dist/index' {
export type Api = any;
export type Data = any;
export interface Templates {
    [name: string]: (api: Api, data: Data) => string;
}
export interface Files {
    [filename: string]: string;
}
export interface Options {
    templates: Templates;
    generate?: (templates: Templates, api: Api, data: Data) => Files;
}
export interface GeneratorResult {
    files: Files;
    api: Api;
    data: Data;
    options: Options;
}
export type Generator = (api: Api, data?: Data) => GeneratorResult;
export function generator(options: Options): Generator;
}
declare module 'raml-generator/dist/index' {
export * from '~raml-generator/dist/index';
}
declare module 'raml-generator' {
export * from '~raml-generator/dist/index';
}
