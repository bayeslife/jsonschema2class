
export class csharp {
     public typeToCSharpType(schematype: string) : string {
        if(schematype=='string')
          return 'String';
        if(schematype=='boolean')
            return 'bool';
        if(schematype=='number')
            return 'double';
        else
          console.log("Unsupported data type:"+schematype)
        return "String";
     }
}
