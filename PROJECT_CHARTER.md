# Project Charter: Local-first LLM Notebook
### v3.0 (Final)

This document is the final and approved charter for the `Local-first LLM Notebook` project, an integrated thinking environment.

---

### 1. Core Vision & Mission

We are building a **local-first web application** that serves as an **Integrated Thinking Environment (ITE)** for **technical professionals and researchers**. We are blurring the lines between knowledge management, software development, and AI interaction.

**Mission:** To provide developers with a unified workspace for maintaining "lab journals," documenting research, prototyping ideas, and conducting multiple, parallel dialogues with AI, all while working directly with a local folder of project files.

**Strategic Goal:** To become an indispensable AI co-processor for intellectual work, guaranteeing 100% data privacy and portability, and enabling maximum productivity through deep contextual integration.

---

### 2. Technology Stack

* **Application Type:** Progressive Web App (PWA).
* **Framework:** Next.js (App Router).
* **Data Storage (Single Source of Truth):** The user's local file system (via File System Access API). All notes and chats are portable `.md` files.
* **Data Storage (Cache):** IndexedDB (via Dexie.js) for indexing and accelerating access.
* **State Management:** Zustand.
* **Styling:** Tailwind CSS.
* **LLM Integration:** Prioritized support for **local LLMs** (Ollama, LM Studio, etc.) with optional integration for cloud-based APIs.

---

### 3. Key Entities & Data Models

* **`Note`:**
    * `id`: `filePath` (the path to the `.md` file).
    * `metadata`: An object parsed from the file's YAML Frontmatter.
    * `links`: A linking system to be implemented in three phases:
        1.  **MVP:** Standard wiki-links (`[[Note Name]]`) and automatic backlinks.
        2.  **v1.1:** Links to specific sections (`[[...#Heading]]`) and link aliases (`[[...|display text]]`).
        3.  **v2.0:** Semantic links (`[[supports::...]]`, `[[refutes::...]]`) to build a true graph of reasoning.

* **`ChatSession`:**
    * Each session is a discrete `.md` file with a standardized structure (YAML Frontmatter for metadata, headings for `user`/`assistant` roles).
    * This design ensures independence, portability, and simple management of multiple conversations.

* **`ContextItem`:**
    * An abstraction over a `Note` or `ChatSession` used to build the context for an LLM prompt. Contains an `id` (`filePath`), `type` (`note`/`chat`), and `label`.

---

### 4. Core Business Rules

* **Local-First Principle:** Non-negotiable. No proprietary cloud for user content.
* **Data Portability:** User data will forever remain in an open, human-readable `.md` format. We are selling freedom from vendor lock-in.
* **Multi-Session Capability:** The user can conduct an unlimited number of parallel dialogues with an AI.
* **Privacy:** Cloud API keys are stored client-side only. Interaction with local LLMs requires no data to be sent externally.

---

### 5. Architecture & User Experience (UX)

* **Primary Interface:** A three-pane layout (`[Sources] - [Chat] - [Draft]`).
* **Chat Management:** The central "Chat" pane will use **tabs**, where each tab represents an active `ChatSession`.
* **Primary Interaction Method:** A **Command Palette (`Ctrl/Cmd+K`)**. This is the main tool for navigation and executing actions: `Find...`, `New Chat...`, `Switch Project...`, `Add to Context...`.
* **Service-Oriented Logic:** `FileSystemService`, `DatabaseService`, `LLMService`, `ParserService`.

---

### 6. "Project Context" Mode

This is a key feature that transforms the application into a development-aware environment.

* **Activation:** The user opens a project's root directory (e.g., a folder containing a `.git` repository).
* **Integrated Terminal:** The application provides a built-in terminal panel operating in the project's root directory. The user can run any console command (`git`, `npm`, `docker compose`, etc.) without leaving the application.
* **Contextualized AI:** All chats initiated in this mode are automatically aware of the project's context. The LLM can be informed of the file structure, dependencies (`package.json`), etc.
* **Localized History:** All project-related dialogues are saved to a `.ai-notebook/chats/` sub-folder within the project itself. This makes the entire project, including the intellectual history behind it, fully autonomous and portable.

---

### 7. User Roles

* **`User`:** The single and only role. Maximum power and functionality for one person over their own data.