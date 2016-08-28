#!/usr/bin/env node


import bluebird = require('bluebird')
import pathModule = require('path');
import fsModule = require('fs');
let thenifyModule = require('thenify')

import yargs  = require('yargs')

let mkdirpModule = require('mkdirp');

let pkg = require('../package.json');
let lodash = require('lodash');
var argv = process.argv;
var mkdirp = mkdirpModule;

var async = require('async');

import handlebars = require('handlebars')
var Visitor = handlebars.Visitor;

import { helpers } from './helpers'
let hlprs: any = helpers;

var fs = fsModule;
var thenify = thenifyModule;

let readFile = thenify(fs.readFile);
let writeFile = thenify(fs.writeFile);

let mkdirpthen = thenify(mkdirp.mkdirp);

let args: any = yargs
    .usage(pkg.description + "\n\n$0 --out [directory] --prefix [file prefix]")
    .version(pkg.version, 'version')
    .alias('d', 'debug')
    .describe('d', 'Enable debugging')
    .alias('c', 'csharp')
    .describe('c', 'Generate plain old c# sharp objects')
    .alias('j', 'java')
    .describe('j', 'Generate plain old java objects')
    .demand('i')
    .alias('i', 'in')
    .describe('i', 'In directory containing any number of schema files')
    .demand('o')
    .alias('o', 'out')
    .describe('o', 'Out directory where the generated files should go')
    .demand('n')
    .alias('n', 'namespace')
    .describe('n', 'namespace')
    .alias('d', 'data')
    .describe('d', 'Path to JSON configuration file')
    .alias('p', 'prefix')
    .describe('p', 'Prefix for all files produced')
    .parse(argv);

if(args['d'])
  process.env['DEBUG']=pkg.name;

var debug = require('debug')(pkg.name);

var cwd = process.cwd();

var sourcePath=args['i'];
var targetPath = args['o'];

let langs : string [] = [];
if(args['j'])
  langs.push('java');
  if(args['c'])
    langs.push('cs');

function findFiles(filesPath: string) : Promise<string[]>  {
  debug('findfiles');
  return new Promise<string[]>(function(res,rej){
    fs.readdir(filesPath, function (err, files) {
        if (err) {
            throw err;
        }
        let filesToGenerate : string [] = [];
        bluebird.map(files, function (file: string) {
            if (file.substr(-5) === '.json') {
                filesToGenerate.push(pathModule.join(filesPath, file));
            }
        }).then(function(){
          res(filesToGenerate);
        });
    });
  })
}

function loadschemas(files: string[]) : Promise<any> {
   debug('loadschemas'+ files)
  return new Promise(function(res,rej){
      var schemas : any[] = [];
      async.each(files, function (file: string, cb: any) {
          let schemaContent: any = fs.readFileSync(file);
          let schemaObj: any = JSON.parse(schemaContent);
          schemas.push(schemaObj);
          cb();
      }, function (err: any) {
          if (err) {
              console.log(err);
              rej(err);
          } else {
              res(schemas);
          }
      });
  })
}

function denormalize(schemaObjs: any []) : Promise<any>  {
  debug('denormalize')
  return new Promise(function(res,rej){

    bluebird.map(schemaObjs,function(schemaObj: any){
      let alltypes = {};
      addType(schemaObj,alltypes,'#');
      schemaObj['alltypes']=alltypes;
    }).then(function(){
      res(schemaObjs);
    })
  })
}

// function denormalize(schemaObjs: any []) : Promise<any>  {
//   debug('denormalize')
//   return new Promise(function(res,rej){
//     let alltypes = {};
//     bluebird.map(schemaObjs,function(schemaObj: any){
//       addRootType(schemaObj,alltypes);
//     }).then(function(){
//       res(alltypes);
//     })
//   })
// }

// function addRootType(schematype: any,alltypes: any){
//   if(schematype.type=='object'){
//     var location = '#';
//     alltypes[location+schematype.title] = { namespace: args['n'], ref: location, type: schematype.title, schema: schematype};
//   }
//   for (var key in schematype) {
//     if(typeof schematype[key] == 'object')
//       addType(schematype[key],alltypes,"#/"+key);
//   }
// }

function addType(schematype: any,alltypes: any, location: string){
  if(schematype.type=='object'){
    alltypes[location] = { namespace: args['n'], ref: location, type: schematype.title, schema: schematype};
  }else if(schematype.hasOwnProperty('enum'))  {
    alltypes[location] = { namespace: args['n'], ref: location, type: schematype.title, schema: schematype};;
  }
  for (var key in schematype) {
    if(typeof schematype[key] == 'object')
      addType(schematype[key],alltypes,location+"/"+key);
  }
}

// function generate(alltypes: any) : Promise<any>  {
//   return new Promise(function(res,rej){
//     bluebird.map(Object.keys(alltypes),function(key: string){
//       hlprs.setReferences(alltypes);
//       generateSchema(key,alltypes[key],langs).then(function(contents){
//         for(var i=0;i<contents.length;i++){
//           saveGenerated(alltypes[key].type,contents[i].content,contents[i].namespace,contents[i].lang);
//         }
//       });
//     }).then(function(){
//       res();
//     })
//   })
// }

function generate(schemaobjs: any) : Promise<any>  {
  return new Promise(function(res,rej){
    bluebird.mapSeries(schemaobjs,function(schemaobj: any){
      return bluebird.mapSeries(Object.keys(schemaobj.alltypes),function(key: string){
        return new Promise(function(res2,rej2){
          hlprs.setReferences(schemaobj.alltypes);
          generateSchema(key,schemaobj.alltypes[key],langs).then(function(contents){
            for(var i=0;i<contents.length;i++){
              saveGenerated(schemaobj.alltypes[key].type,contents[i].content,contents[i].namespace,contents[i].lang);
            }
          });
          res2();
        })
      });
    }).then(function(){
      res();
    })
  })
}

function generateSchema(schemaname: string,schema: any, langs: string []) : Promise<any[]> {
  debug('generate schema:'+ schemaname);
  let results : any [] = [];
  return new Promise<any[]>(function(res,rej){
    bluebird.map(langs,function(lang){
      let renderer: Renderer = new Renderer(cwd);
      return renderer.render("src/handlebars/"+lang+"/schema.hbs",schema).then(function(content){
        results.push({lang: lang, namespace: args['n'],content: content});
      });
    }).then(function(){
        res(results)
    });
  })
}

function saveGenerated(file: string,content:string, namespace: string, lang: string) : Promise<any> {
  return new Promise(function(res,rej){
    var targetdir = pathModule.resolve(targetPath, lang, namespace.replace(/\./g,"/") );
    mkdirpthen(targetdir).then(function(){
      var filename = pathModule.resolve(targetdir, file+ "."+lang);
      debug("Saving:"+filename);
      writeFile(filename, content).then(function(){
        res();
      })
    })
  })
}

class ImportScanner  extends Visitor {
      partials : any = [];

      PartialStatement(partial:any){
         var name = partial.name.original;

        if (!pathModule.isAbsolute(name)) {
          name = pathModule.join('/src/handlebars/', name);
        }
        partial.name.original = name
        this.partials.push(name);
    }
}

class Renderer {
   ctx: any;

   ids: any={};
   templates: any = {};
   partials : any = [];
   basePath : string = "/";

   constructor(public defaultBasePath: string){
     //debug(defaultBasePath);
     this.basePath = defaultBasePath;
     for (var name in hlprs) {
       let helperFn = hlprs[name];
        handlebars.registerHelper(name,helperFn);
      }
   }

   readFile(filename: string) : Promise<string> {
     return new Promise<string>(function(resolve, reject) {
       var rs = fs.readFileSync(filename,'utf-8');
       resolve(rs);
     });
   }

   template(name: string, context: any) {
     try {
       //fs.writeFileSync('./doc.tests.json',JSON.stringify(context,null,1));
      return this.templates[name](context);
     }catch(e){
       console.log(e);
     }
   }

  prepare(filename: string) : Promise<any> {
    var r = this;

    var basepath = this.defaultBasePath;

    return new Promise(function(resolve: any,reject: any){
      if (r.templates[filename]) {
          resolve();
      }else {

        r.readFile(basepath+'/'+filename)
        .then(function(content: string) {

          try {
            var ast = handlebars.parse(content);

            let scanner  = new ImportScanner();

            scanner.accept(ast);
            var promises = scanner.partials.map(function(fn:string){
              return r.prepare(fn);
            });
            r.templates[filename] = handlebars.compile(ast);
            handlebars.registerPartial(filename,r.templates[filename]);
            if(promises.length>0){
              Promise.all(promises).then(function(){
                resolve();
              })
            }else
              resolve();

          }catch(exception){
            console.log(exception)
            reject(exception);
          }
        })
        .catch(function(msg: string){
          console.log(msg);
          reject();
        });
      }
  });
}


render(filename: string, schema: any) : Promise<any>{
    var t = this;

    this.ctx = schema;
    return new Promise(function(resolve: any,reject: any){
      try {
        if (!filename) {
          throw new Error("template file is not defined");
        }
        if (t.templates[filename]!= undefined) {
            var res = t.template(filename, t.ctx );
            resolve(res);
        }else {
              t.prepare(filename)
                .then(function() {
                  var res = t.template(filename, t.ctx);
                  resolve(res);
                })
                .catch(function(msg: any){
                  console.log(msg);
                })
        }
      }catch(exception){
        console.log(exception.stack);
      }
    });
  }
}

findFiles(sourcePath)
  .then(loadschemas)
  .then(denormalize)
  .then(generate);
