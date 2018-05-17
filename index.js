/**
 * @module index
 * @license MIT
 * @author nuintun
 * @version 2018/05/17
 * @description Webpack plugin for generating an asset manifest with grouped entry chunks.
 * @see https://github.com/jakedahm/webpack-asset-manifest-plugin
 */

const fs = require("fs");
const path = require("path");

class WebpackEntryManifestPlugin {
  constructor(opts) {
    this.name = "WebpackEntryManifestPlugin";
    this.options = Object.assign(
      {
        filename: "manifest.json",
        outputPath: null
      },
      opts || {}
    );
  }

  apply(compiler) {
    compiler.hooks.emit.tap(this.name, compilation => {
      const manifest = compilation.chunkGroups.reduce((manifest, group) => {
        if (group.name) {
          const groupFiles = group
            .getFiles()
            .map(file => path.join(compiler.options.output.publicPath, file));

          manifest[group.name] = {
            files: groupFiles,
            chunks: group.getChildren().reduce((chunks, chunk) => {
              const files = chunk.chunks.reduce((items, item) => {
                item.files.forEach(file => {
                  const item = path.join(
                    compiler.options.output.publicPath,
                    file
                  );
                  if (
                    chunks.indexOf(item) === -1 &&
                    groupFiles.indexOf(item) === -1
                  ) {
                    items.push(
                      path.join(compiler.options.output.publicPath, file)
                    );
                  }
                });

                return items;
              }, []);
              
              return chunks.concat(files);
            }, [])
          };
        }

        return manifest;
      }, {});

      if (Object.keys(manifest).length > 0) {
        const outputPath = this.options.outputPath || compiler.outputPath;
        
        compiler.outputFileSystem.mkdirp(outputPath, () => {
          fs.writeFileSync(
            path.join(outputPath, "manifest.json"),
            JSON.stringify(manifest)
          );
        });
      }
    });
  }
}

module.exports = WebpackEntryManifestPlugin;
