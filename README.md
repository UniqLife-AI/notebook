# Notebook (by UniqLife-AI)

An integrated thinking environment that combines local-first knowledge management with powerful, private AI interaction. It's a cross-platform desktop application designed for developers, researchers, and anyone who wants to build a "second brain" that is truly their own.

---

### ⚠️ Alpha Stage / Work in Progress ⚠️

**This project is in the very early stages of development and is being built in public.** The current functionality is a proof-of-concept for the core interface and terminal. Many of the features described in the roadmap are not yet implemented. Expect bugs and frequent changes.

---

## 🗺️ The Roadmap & Vision

The ultimate goal is to create a powerful, private, and extensible thinking tool. Here are the key features planned for the future:

*   🧠 **100% Local & Private:** All your notes, chats, and data will live as plain Markdown files in a folder on your computer. No clouds, no servers, no tracking.
*   🔌 **Local LLM Integration:** Connect directly to your own language models running via Ollama, LM Studio, and other local servers.
*   ‍💻 **Project Context Mode:** Open a code repository to activate a powerful workflow with an integrated terminal and project-scoped AI chats.
*   🔗 **Knowledge Graph:** Connect your thoughts using bi-directional wiki-links to build a network of your knowledge.
*   💬 **Multi-Session Chat:** Manage multiple, independent conversations with your AI in a clean, tabbed interface.

## ✅ Current Features (What Works Right Now)

*   **Core:** A stable, three-panel, resizable interface built with Wails.
*   **Integrated Terminal:** A working, interactive PowerShell terminal integrated directly into the application.
*   **Chat:** A functional chat interface (backend logic pending).
*   **UX:** Foundational UI components for sources, drafts, and settings.

## 🚀 Getting Started

To run this project, you will need Go and the Wails CLI installed.

```bash
# Clone the repository
git clone https://github.com/UniqLife-AI/notebook.git
cd notebook

# Install frontend dependencies
cd frontend
npm install
cd ..

# Run the application in development mode
wails dev
```

---

## Philosophy & Deeper Dive

This project is guided by a strong set of principles focused on user ownership, data portability, and privacy. To understand the "why" behind our architectural decisions and the vision for the future, please read our [**Project Charter**](PROJECT_CHARTER.md).

---

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.