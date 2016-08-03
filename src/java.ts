
export class java {
     public typeToJavaType(jsonschematype: string) : string {
        if(jsonschematype=='string')
          return 'String';
        if(jsonschematype=='boolean')
            return 'Boolean';
        if(jsonschematype=='number')
            return 'Double';
        if(jsonschematype=='integer')
            return 'Integer';
        if(jsonschematype=='null')
            return 'void';
        else
          console.log("Unsupported data type:"+jsonschematype)
        return "String";
     }
}
