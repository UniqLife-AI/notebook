# Notebook (by UniqLife-AI)

An integrated thinking environment that combines local-first knowledge management with powerful, private AI interaction. It's designed for developers, researchers, and anyone who wants to build a "second brain" that is truly their own.

---

### ⚠️ Alpha Stage / Work in Progress ⚠️

**This project is in the early stages of development and is being built in public.** The core architecture has recently shifted from a Web App to a cross-platform **Desktop Application** using Tauri. Expect bugs and frequent changes.

---

## 🗺️ The Roadmap & Vision

The ultimate goal is to create a powerful, private, and extensible thinking tool. Here are the key features planned for the future:

*   🧠 **100% Local & Private:** All your notes, chats, and data live as plain Markdown files in a folder on your computer. No clouds, no servers, no tracking.
*   🔌 **Local LLM Integration:** Connect directly to your own language models running via Ollama, LM Studio, and other local servers.
*   ‍💻 **Project Context Mode:** Open a code repository to activate a powerful workflow with an integrated terminal and project-scoped AI chats.
*   🔗 **Knowledge Graph:** Connect your thoughts using bi-directional wiki-links to build a network of your knowledge.
*   💬 **Multi-Session Chat:** Manage multiple, independent conversations with your AI in a clean, tabbed interface.

## ✅ Current Features (What Works Right Now)

*   **Core:** A stable, three-panel, resizable desktop application powered by **Tauri**.
*   **Knowledge Graph:**
    *   Create notes and link them with `[[Wiki-style Links]]`.
    *   Links to non-existent notes create them on click.
    *   Automatic **backlinks** show you which notes reference the current one.
    *   Support for **semantic links** like `[[supports::Note]]` and `[[refutes::Note]]`.
    *   Support for linking to specific **headings** (`[[Note#Heading]]`).
*   **Project Mode:**
    *   Open any folder on your machine as a "Project".
    *   All notes and chats created in Project Mode are saved to a local `.ai-notebook` folder within that project, making it fully portable.
*   **Chat:** A functional, streaming chat with Google Gemini models.
*   **Context:** Add file contents or the project's file structure to the AI's context via a Command Palette (`Ctrl+K`).
*   **UX:** A Command Palette for core actions.

## 🚀 Getting Started

This is now a desktop application built with Tauri. You will need to install the Rust toolchain to build and run it.

### Prerequisites

1.  **Node.js:** Make sure you have Node.js and npm installed.
2.  **Rust:** Follow the official instructions to install Rust and Cargo: [https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install)

### Installation & Running

```bash
# Clone the repository
git clone https://github.com/UniqLife-AI/notebook.git
cd notebook

# Install Node.js dependencies
npm install

# Run the development server and launch the desktop app
npm run tauri dev
```

The first time you run this, Cargo (the Rust package manager) will download and compile all the necessary dependencies. This may take several minutes. Subsequent launches will be much faster.

---

## Philosophy & Deeper Dive

This project is guided by a strong set of principles focused on user ownership, data portability, and privacy. To understand the "why" behind our architectural decisions and the vision for the future, please read our [**Project Charter**](PROJECT_CHARTER.md).

---

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
