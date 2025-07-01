# FiveMGen

**FiveMGen** is a Visual Studio Code extension that helps streamline the development of FiveM resources using Lua or JavaScript. It provides code snippets, templates, and tools to help developers create scripts faster and with fewer errors.

---

## 🚀 Features

- 🔁 Snippets for FiveM Lua and JavaScript scripting
- 📁 Quick generation of `__resource.lua` and `fxmanifest.lua`
- 🧱 Scaffolding for new FiveM resource projects
- 🧠 Smart suggestions for events and native functions
- 🛠 Compatible with both client-side and server-side scripts

---

## ⚙️ Requirements

To get the most out of this extension, ensure you have:

- Visual Studio Code installed
- Basic knowledge of Lua or JavaScript (depending on your scripting language)
- A local FiveM server for testing your scripts

No other dependencies are required to use the extension itself.

---

## 🔧 Extension Settings

FiveMGen contributes the following settings:

- `fivemgen.enable`: Enable or disable the extension (default: `true`)
- `fivemgen.language`: Set preferred scripting language (`lua` | `javascript`)
- `fivemgen.defaultResourceName`: Default name for new resource folders

---

## 🐛 Known Issues

- C# support is currently not implemented
- May not support nested workspace folders properly
- No live validation of manifest files (planned for future release)

---

## 📦 Release Notes

### 1.3.1
- Added 1 more new snippet called genf. Go and explore!


---

## 📷 Screenshots

<!--
Uncomment and add images to showcase your extension:

![Command Palette](images/command-palette.png)
![Generated Manifest](images/fxmanifest-example.png)
-->

---

## 📚 Resources

- [FiveM Documentation](https://docs.fivem.net/)
- [Visual Studio Code Extension Docs](https://code.visualstudio.com/api)
- [Lua Reference](https://www.lua.org/manual/5.4/)
- [Node.js](https://nodejs.org) (for development)

---

## 🛠 Development

To build and test the extension locally:

```bash
npm install
npm run compile
code .
```


## Usage HOW TO


* Ctrl + Shift + P -> Generate Fivem Resource 

* genfm -> Generates just fxmanifest file 

* genf -> Starts the same process at first step


