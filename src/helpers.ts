import handlebars = require('handlebars');
import http = require('http');
import paramCase = require('param-case')
import pascalCase = require('pascal-case')
import camelCase = require('camel-case')

import changecase = require('change-case');

let marked = require('marked');

import { csharp} from './csharp'
let cs = new csharp();

let markedRenderer = new marked.Renderer();

let references : any = {};

export const helpers = {

  paramCase: function(val: string) {
      return paramCase(val);
  },

  pascalCase: function(val: string) {
      return pascalCase(val);
  },

  echo: function(val: any) {
    console.log(val);
 },

 setReferences: function(refs: any) {
   references = refs;
  },

 typeFromReference: function(ref: string) : string {
   return references[ref].type;
 },

 // isArray: function(type: string) {
 //   if(type!=null)
 //    return type == "array"? "[]" : "--";
 //  return "--";
 // },

 propertyType: function(schematype: any) : string {
   if(schematype.type=='array' && schematype.items){
     return helpers.propertyType(schematype.items)+ "[]";
   }  else if(schematype['$ref']!=null){
     return references[schematype['$ref']].type;
   } else if(schematype.type=='object' && schematype.hasOwnProperty('title')){
     return schematype.title;
   } else if(schematype.hasOwnProperty('type')){
     let t= schematype.type;
     return cs.typeToCSharpType(t);
   }
  return "String";
 },

  documentationDescription: function(val: string,content: string) {
   if(val=='Description')
      return content;
  return "";
  },

  documentationEffort: function(val: string,content: string) {
    if(val=='Effort'){
      return content.trim();
    }
   return "";
 },

  documentationHistory: function(val: string,content: string) {
    if(val=='History')
       return content;
   return "";
  },

  json: function(text: string,id: string,options: any){
     var j =  JSON.parse(text);
     j.id = id;
     return options.fn(j);
  },
  addId: function(context: any,id: string,options: any){
      context.id=id;
      return options.fn(context);
  },

  parseCsv: function(csv: string,options: any){
      for(var v  of csv){
        return options.fn(v);
      }
  },

  md: function(text: string) {
    if (text && text.length) {
      var html = marked(text, {
        renderer: markedRenderer
      });
      return new handlebars.SafeString(html);
    }
    return '';
  },
  markdown: function(options: any) {
    var content = options.fn(this);
    return helpers.md(content);
  },
  toStatusCode: function(value: any) {
    var code = parseInt(value, 10);
    if (code && (code in http.STATUS_CODES)) {
      return http.STATUS_CODES[code];
    }
    return '';
  },
  toLowerCase: function(text: string) {
    return text.toLowerCase();
  },
  toUpperCase: function(text: string) {
    return text.toUpperCase();
  },
  asJson: function(j: any) {
    //console.log("aaaaaaaaaaaaaaaaaaaaaas");
    //console.log(j);
    return JSON.stringify(j);
  },

  required: function(property: any, cl: any) {
    if(!cl.hasOwnProperty('required')){
      return "false";
    }
    for(var i=0;i<cl.required.length;i++){
      if (cl.required[i] == property.name){
        return "true";
      }
    }
    return "false";
  }
};

//}
