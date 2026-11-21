import fsOperation from "fileSystem";
import openFolder from "lib/openFolder";
import Url from "utils/Url";

const STORAGE_KEY_TOKEN = "aerocode_ai_token";
const STORAGE_KEY_MODEL = "aerocode_ai_model";
const STORAGE_KEY_ACTIVE_PROJECT = "aerocode_active_project";
const DEFAULT_MODEL = "gemini-1.5-flash";

class AeroCodeAgentBridge {
	constructor() {
		this.activeProject = localStorage.getItem(STORAGE_KEY_ACTIVE_PROJECT) || null;
		this.projectsDir = null;
		this.initProjectsDir();
	}

	async initProjectsDir() {
		try {
			const basePath = window.DATA_STORAGE || (window.cordova && cordova.file && cordova.file.externalDataDirectory) || "";
			if (basePath) {
				this.projectsDir = Url.join(basePath, "AeroCodeProjects");
				const fs = fsOperation(this.projectsDir);
				if (!(await fs.exists())) {
					await fsOperation(basePath).createDirectory("AeroCodeProjects");
				}
			}
		} catch (err) {
			console.warn("Could not init AeroCodeProjects directory:", err);
		}
	}

	getToken() {
		return localStorage.getItem(STORAGE_KEY_TOKEN) || "";
	}

	setToken(token) {
		localStorage.setItem(STORAGE_KEY_TOKEN, token.trim());
	}

	getModel() {
		return localStorage.getItem(STORAGE_KEY_MODEL) || DEFAULT_MODEL;
	}

	setModel(model) {
		localStorage.setItem(STORAGE_KEY_MODEL, model);
	}

	setActiveProject(projectName) {
		this.activeProject = projectName;
		localStorage.setItem(STORAGE_KEY_ACTIVE_PROJECT, projectName);
	}

	async listProjects() {
		if (!this.projectsDir) await this.initProjectsDir();
		if (!this.projectsDir) return [];
		try {
			const entries = await fsOperation(this.projectsDir).lsDir();
			return entries.filter(e => e.isDirectory).map(e => ({
				name: e.name,
				url: e.url,
			}));
		} catch (err) {
			return [];
		}
	}

	async createProject(name, template = "vanilla") {
		if (!this.projectsDir) await this.initProjectsDir();
		const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "_");
		const projectUrl = Url.join(this.projectsDir, safeName);
		const fs = fsOperation(projectUrl);

		if (!(await fs.exists())) {
			await fsOperation(this.projectsDir).createDirectory(safeName);
		}

		if (template === "vanilla") {
			await fsOperation(projectUrl).createFile(
				"index.html",
				`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeName}</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="app-container">
    <h1>Welcome to ${safeName}</h1>
    <p>Created by AeroCode AI Studio</p>
    <button id="actionBtn">Click Me</button>
  </div>
  <script src="script.js"></script>
</body>
</html>`
			);

			await fsOperation(projectUrl).createFile(
				"style.css",
				`* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
body {
  background: #0f172a;
  color: #f8fafc;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
.app-container {
  text-align: center;
  padding: 2.5rem;
  background: #1e293b;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
}
h1 {
  font-size: 2rem;
  margin-bottom: 0.75rem;
  color: #38bdf8;
}
p {
  color: #94a3b8;
  margin-bottom: 1.5rem;
}
button {
  background: #38bdf8;
  color: #0f172a;
  border: none;
  padding: 0.75rem 1.75rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
button:hover {
  background: #0284c7;
  color: #fff;
  transform: translateY(-2px);
}`
			);

			await fsOperation(projectUrl).createFile(
				"script.js",
				`document.getElementById("actionBtn")?.addEventListener("click", () => {
  alert("Hello from AeroCode AI Studio!");
});`
			);
		} else if (template === "react-vite") {
			await fsOperation(projectUrl).createFile(
				"package.json",
				JSON.stringify(
					{
						name: safeName.toLowerCase(),
						private: true,
						version: "0.0.0",
						type: "module",
						scripts: {
							dev: "vite",
							build: "vite build",
							preview: "vite preview",
						},
						dependencies: {
							react: "^18.3.1",
							"react-dom": "^18.3.1",
						},
						devDependencies: {
							"@vitejs/plugin-react": "^4.3.1",
							vite: "^5.4.2",
						},
					},
					null,
					2
				)
			);

			await fsOperation(projectUrl).createFile(
				"index.html",
				`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
			);

			await fsOperation(projectUrl).createFile(
				"vite.config.js",
				`import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});`
			);

			const srcDir = Url.join(projectUrl, "src");
			await fsOperation(projectUrl).createDirectory("src");

			await fsOperation(srcDir).createFile(
				"main.jsx",
				`import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
			);

			await fsOperation(srcDir).createFile(
				"App.jsx",
				`import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ textAlign: 'center', padding: '50px', background: '#111827', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#60a5fa' }}>${safeName} (React + Vite)</h1>
      <p style={{ color: '#9ca3af' }}>Built with AeroCode AI Agent</p>
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => setCount((c) => c + 1)}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', fontSize: '16px', cursor: 'pointer' }}
        >
          Count is {count}
        </button>
      </div>
    </div>
  );
}`
			);

			await fsOperation(srcDir).createFile(
				"index.css",
				`body { margin: 0; padding: 0; box-sizing: border-box; }`
			);
		}

		this.setActiveProject(safeName);

		try {
			openFolder(projectUrl, { name: safeName, saveState: true, listFiles: true });
		} catch (e) {
			console.log("Opened folder via openFolder", e);
		}

		return { name: safeName, url: projectUrl };
	}

	async openProjectInEditor(projectName) {
		if (!this.projectsDir) await this.initProjectsDir();
		const projectUrl = Url.join(this.projectsDir, projectName);
		this.setActiveProject(projectName);
		try {
			openFolder(projectUrl, { name: projectName, saveState: true, listFiles: true });
		} catch (e) {
			console.error("Failed to open project in editor:", e);
		}
	}

	async executeTool(projectUrl, toolName, args) {
		const targetUrl = Url.join(projectUrl, args.path || "");
		if (toolName === "create_file" || toolName === "write_file") {
			const parts = args.path.split("/");
			const fileName = parts.pop();
			const dirPath = parts.join("/");
			let folderUrl = projectUrl;
			if (dirPath) {
				folderUrl = Url.join(projectUrl, dirPath);
				const dirFs = fsOperation(folderUrl);
				if (!(await dirFs.exists())) {
					const segments = dirPath.split("/");
					let curr = projectUrl;
					for (const seg of segments) {
						if (!seg) continue;
						const next = Url.join(curr, seg);
						if (!(await fsOperation(next).exists())) {
							await fsOperation(curr).createDirectory(seg);
						}
						curr = next;
					}
				}
			}
			await fsOperation(folderUrl).createFile(fileName, args.content || "");
			return `File "${args.path}" created successfully.`;
		} else if (toolName === "read_file") {
			const content = await fsOperation(targetUrl).readFile("utf-8");
			return content;
		} else if (toolName === "edit_file") {
			const current = await fsOperation(targetUrl).readFile("utf-8");
			if (!current.includes(args.target)) {
				return `Target string not found in ${args.path}`;
			}
			const updated = current.replace(args.target, args.replacement || "");
			await fsOperation(targetUrl).writeFile(updated);
			return `File "${args.path}" edited successfully.`;
		} else if (toolName === "list_files") {
			const entries = await fsOperation(projectUrl).lsDir();
			return entries.map(e => (e.isDirectory ? `[DIR] ${e.name}` : e.name)).join("\n");
		}
		return `Unknown tool: ${toolName}`;
	}

	async sendChatMessage(prompt, onEvent) {
		const token = this.getToken();
		if (!token) {
			throw new Error("AUTH_REQUIRED");
		}

		if (!this.activeProject) {
			await this.createProject("my-first-app", "vanilla");
		}

		const projectUrl = Url.join(this.projectsDir, this.activeProject);
		const model = this.getModel();

		onEvent({ type: "status", text: "Thinking & planning..." });

		const systemPrompt = `You are AeroCode AI Agent, created for Shahid's AeroCode Studio.
You build, modify, write, and debug web applications (HTML/CSS/JS, React, Vite).
When you want to create or edit files in the active project "${this.activeProject}", output json blocks with tool calls:
\`\`\`tool:create_file
{"path": "index.html", "content": "..."}
\`\`\`
\`\`\`tool:edit_file
{"path": "index.html", "target": "old code", "replacement": "new code"}
\`\`\`
\`\`\`tool:read_file
{"path": "index.html"}
\`\`\`
Always explain what you built in clean, friendly language with Hinglish/English mix as appropriate.`;

		const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${token}`;

		const response = await fetch(endpoint, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				contents: [
					{
						role: "user",
						parts: [{ text: `${systemPrompt}\n\nUser Request: ${prompt}` }],
					},
				],
			}),
		});

		if (!response.ok) {
			const errData = await response.json().catch(() => ({}));
			throw new Error(errData?.error?.message || `API error (${response.status})`);
		}

		const data = await response.json();
		const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

		const toolRegex = /```tool:([a-zA-Z_]+)\n([\s\S]*?)```/g;
		let match;
		while ((match = toolRegex.exec(replyText)) !== null) {
			const toolName = match[1];
			try {
				const args = JSON.parse(match[2].trim());
				onEvent({ type: "tool_start", tool: toolName, path: args.path });
				const res = await this.executeTool(projectUrl, toolName, args);
				onEvent({ type: "tool_done", tool: toolName, path: args.path, result: res });
			} catch (err) {
				onEvent({ type: "tool_error", tool: toolName, error: err.message });
			}
		}

		try {
			openFolder(projectUrl, { name: this.activeProject, saveState: true, listFiles: true });
		} catch (e) {}

		return replyText;
	}
}

export default new AeroCodeAgentBridge();
