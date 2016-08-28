#  JsonSchema 2 Class

This functionality will generate plain old c# and java source files corresponding to a Json Schema


## Usage

```
dist/bin.js --out [directory] --prefix [file prefix]

Options:
  --version            Show version number                             [boolean]
  -d, --debug, --data  Path to JSON configuration file
  -c, --csharp         Plain old c# sharp objects
  -j, --java           Plain old java objects
  -i, --in             In directory                                   [required]
  -o, --out            Out directory                                  [required]
  -n, --namespace      namespace                                      [required]
  -p, --prefix         Prefix for all files produced
```

## Example
```
node dist/bin.js -c -j -n foo.bar.TestNamespace -i ./test/resources/schemas -o ./build/src/main
```

## Run the sample

```
npm run sample
```
This will run the sample script from package.json and will generate classes for the json schemas in test/resources/schemas.
