# Notebook (by UniqLife-AI)

An integrated thinking environment that combines local-first knowledge management with powerful, private AI interaction. It's designed for developers, researchers, and anyone who wants to build a "second brain" that is truly their own.

---

### ⚠️ Alpha Stage / Work in Progress ⚠️

**This project is in the very early stages of development and is being built in public.** The current functionality is a proof-of-concept for the core chat interface. Many of the features described in the roadmap are not yet implemented. Expect bugs and frequent changes.

---

## 🗺️ The Roadmap & Vision

The ultimate goal is to create a powerful, private, and extensible thinking tool. Here are the key features planned for the future:

*   🧠 **100% Local & Private:** All your notes, chats, and data will live as plain Markdown files in a folder on your computer. No clouds, no servers, no tracking.
*   🔌 **Local LLM Integration:** Connect directly to your own language models running via Ollama, LM Studio, and other local servers.
*   ‍💻 **Project Context Mode:** Open a code repository to activate a powerful workflow with an integrated terminal and project-scoped AI chats.
*   🔗 **Knowledge Graph:** Connect your thoughts using bi-directional wiki-links to build a network of your knowledge.
*   💬 **Multi-Session Chat:** Manage multiple, independent conversations with your AI in a clean, tabbed interface.

## ✅ Current Features (What Works Right Now)

*   **Core:** A stable, three-panel, resizable interface.
*   **Chat:** A fully functional, streaming chat with Google Gemini models.
*   **Context:** Image pasting from the clipboard for multimodal queries. The AI remembers the image in the current session.
*   **UX:** Interactive controls for each message (Delete, Copy, etc.).
*   **Rendering:** Full Markdown support in chat, including beautiful, syntax-highlighted code blocks with a "Copy" button.
*   **Settings:** A working dialog for managing your API key, model, and temperature.

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/UniqLife-AI/notebook.git
cd notebook

# Install dependencies
npm install

# Run the development server
npm run dev
```

---

## Philosophy & Deeper Dive

This project is guided by a strong set of principles focused on user ownership, data portability, and privacy. To understand the "why" behind our architectural decisions and the vision for the future, please read our [**Project Charter**](PROJECT_CHARTER.md).

---

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
