# tree-sitter-heptagon

A [Heptagon](https://gitlab.inria.fr/synchrone/heptagon) grammar for
tree-sitter.


## Installation

>[!Note]
> Installation instructions are available for NeoVim and VSCode/VSCodium in
> a UNIX-like environment. For any other text editor or platforms you need
> to find yourself how to correctly install a tree-sitter grammar with
> highlighting queries.

Both installations needs you to clone this repository on your machine.

### NeoVim

The [nvim-tree-sitter](https://github.com/nvim-treesitter/nvim-treesitter)
plugin must be installed and up-to-date.

If you use the **Lazy** plugin manager you can ensure that you are up-to-date by
running in the neovim console :
```VimL
:Lazy update
```
Whatever plugin manager you may have, copy-paste the following *after* the place
in your neovim config where you load your plugins :
```lua
local parser_config = require "nvim-treesitter.parsers".get_parser_configs()
parser_config.heptagon = {
  install_info = {
    url = "path/to/tree-sitter-heptagon",
    files = {"src/parser.c"},
  },
  filetype = "heptagon",
}
```
Do not forget to replace the `path/to/tree-sitter-heptagon` bit by the actual
path to the place you cloned this repository. This code adds manually the
heptagon grammar to the list of grammars managed by the tree-sitter plugin.

Then, in an appropriate place of your config (e.g. an `autocmd` file), add the
following code that registers files ending in `.ept` as Heptagon files :
```lua
vim.filetype.add({
  extension = {
    ept = "heptagon",
  },
})
```
These steps alone will not suffice to allow syntax highlighting. Highlighting
information is stored in a `highlights.scm` tree-sitter queries files that is
not automatically added by the tree-sitter plugin. This must be done manually by
adding query files to your neovim config.
Supposing that your neovim config is located at `~/.config/nvim`, add a
`queries` directory to store queries for programming languages :
```bash
mkdir -p ~/.config/nvim/queries/
```
Then create a symlink :
```bash
ln -s /path/to/tree-sitter-heptagon/queries ~/.config/nvim/queries/heptagon
```
If the symlink fails you may copy the files instead but keep in mind that you'll
have to re-copy them during parser updates. The tree-sitter plugin should
automatically find the queries file in the neovim configuration path. 

The last step is to install the Heptagon grammar by running :
```VimL
:TSInstall heptagon
```

To update the grammar you simply need to pull the new content from the remote
repository via `git pull` and to either re-run the installation command or to
run :
```VimL
:TSUpdate
```

You can verify that everything has been correctly installed by running :
```VimL
:checkhealth nvim-tree-sitter
```


### VSCode

The [tree-sitter-vscode](https://marketplace.visualstudio.com/items?itemName=AlecGhost.tree-sitter-vscode)
extension must be installed and up-to-date.

>[!IMPORTANT]
> VSCode natively supports syntax highlighting using a format called TextMate,
> the tree-sitter-vscode plugins allows creating "semantic tokens" from
> tree-sitter grammars.
> This allows to use tree-sitter in VSCode but be wary as multiple themes do
> not support those "semantic tokens".

The extension requires the grammar be produced in a WebAssembly format, to do so
one must [install the tree-sitter CLI](https://tree-sitter.github.io/tree-sitter/creating-parsers/1-getting-started.html#installation)
(cargo or npm are needed for the install), then, in the project directory, run :
```bash
tree-sitter generate --abi 15 && tree-sitter build --wasm
```
In VSCode navigate to the extension folder by opening the command prompt
(**Ctrl+Shift+P**), and typing `Extensions: Open Extension Folder`. This should
open the folder where your VSCode extensions are stored in your file manager.
Open the `package.json` file in the tree-sitter extension's directory and add
this block in the `"contributes"` section (beware of missing or trailing comma
errors in JSON) :
```JSON
"languages": [
    {
      "id": "heptagon",
      "extensions": [ ".ept" ]
    }
],
```
This registers Heptagon as a language recognized by VSCode and links the `.ept`
file extension to it.


Then, open the settings of the tree-sitter extension, chose to
*Edit in `settings.json`* the language configs and inside the
`"tree-sitter-vscode.languageConfigs"` list add the block :
```JSON
{
    "lang": "heptagon",
    "parser": "path/to/tree-sitter-heptagon/tree-sitter-heptagon.wasm",
    "highlights": "path/to/tree-sitter-heptagon/queries/highlights.scm",
},
```
Which registers the Heptagon parser. Do not forget to replace with the actual
path to where the parser is on your machine.

