import "./style.scss";
import prompt from "dialogs/prompt";
import select from "dialogs/select";
import alert from "dialogs/alert";
import Sidebar from "components/sidebar";
import agentBridge from "./agentBridge";

let container;
let $chatList;
let $input;
let $sendBtn;
let $activeProjectLabel;

export default [
	"zap", // icon name
	"antigravity", // unique ID
	"Aero AI Agent", // sidebar title
	initApp,
	false,
	onSelected,
];

function initApp(el) {
	container = el;
	container.id = "antigravity-sidebar-app";

	const initialProject = agentBridge.activeProject || "None (Click Projects to create)";

	container.innerHTML = `
		<div class="aerocode-ai-header">
			<div class="header-title-box">
				<span class="ai-badge">AGENT</span>
				<span class="ai-name">AeroCode AI</span>
			</div>
			<div class="header-actions">
				<button id="aerocode-auth-btn" title="AI Settings / API Key">🔑 Key</button>
				<button id="aerocode-projects-btn" title="Manage Projects">📁 Projects</button>
				<button id="aerocode-preview-btn" class="btn-preview" title="Live Preview">🌐 Preview</button>
			</div>
		</div>

		<div class="aerocode-project-bar">
			<span class="active-project-label">Active: <strong id="aerocode-active-name">${initialProject}</strong></span>
			<button id="aerocode-new-project-btn" class="project-btn">+ New</button>
		</div>

		<div class="aerocode-chat-list" id="aerocode-chat-box">
			<div class="welcome-banner">
				<h2>⚡ AeroCode AI Agent</h2>
				<p>Created by Shahid • Powered by Antigravity & Gemini</p>
				<p style="margin-top:6px; font-size:11px;">Tell me what website or app you want to build (HTML/CSS/JS or React+Vite). I will autonomously create files, write code, and configure it for you!</p>
			</div>
		</div>

		<div class="quick-prompt-chips">
			<span class="chip" data-prompt="Build a modern dark-themed Portfolio website with project showcase, skills, and contact form">🌟 Portfolio Site</span>
			<span class="chip" data-prompt="Build a complete React + Vite Todo app with categories, local storage, and sleek design">⚡ React Todo App</span>
			<span class="chip" data-prompt="Build a fully working 2048 Game in HTML, CSS and JavaScript with high score">🎮 2048 Game</span>
			<span class="chip" data-prompt="Review all files in this project, find any bugs or syntax errors, and fix them">🐛 Debug & Fix</span>
		</div>

		<div class="aerocode-input-box">
			<textarea id="aerocode-prompt-input" rows="1" placeholder="Type prompt: e.g. 'Build a crypto tracker app in React'"></textarea>
			<button id="aerocode-send-btn" class="btn-send">Send</button>
		</div>
	`;

	$chatList = container.querySelector("#aerocode-chat-box");
	$input = container.querySelector("#aerocode-prompt-input");
	$sendBtn = container.querySelector("#aerocode-send-btn");
	$activeProjectLabel = container.querySelector("#aerocode-active-name");

	// Event Listeners
	$sendBtn.addEventListener("click", handleSend);
	$input.addEventListener("keydown", (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	});

	container.querySelector("#aerocode-auth-btn").addEventListener("click", showAuthDialog);
	container.querySelector("#aerocode-projects-btn").addEventListener("click", showProjectsDialog);
	container.querySelector("#aerocode-new-project-btn").addEventListener("click", promptNewProject);
	container.querySelector("#aerocode-preview-btn").addEventListener("click", handlePreview);

	const chips = container.querySelectorAll(".quick-prompt-chips .chip");
	chips.forEach((chip) => {
		chip.addEventListener("click", () => {
			$input.value = chip.getAttribute("data-prompt");
			$input.focus();
		});
	});
}

function onSelected() {
	if ($activeProjectLabel) {
		$activeProjectLabel.textContent = agentBridge.activeProject || "None";
	}
}

async function handleSend() {
	const text = $input.value.trim();
	if (!text) return;

	$input.value = "";
	appendMessage("user", text);

	const agentMsgEl = appendMessage("agent", "⚡ Thinking and preparing workspace...");
	$sendBtn.disabled = true;

	try {
		const reply = await agentBridge.sendChatMessage(text, (event) => {
			if (event.type === "tool_start") {
				const pill = document.createElement("div");
				pill.className = "tool-pill";
				pill.innerHTML = `<span class="icon zap"></span> Running: ${event.tool} (${event.path || ""})`;
				agentMsgEl.appendChild(pill);
				$chatList.scrollTop = $chatList.scrollHeight;
			} else if (event.type === "tool_done") {
				const pill = document.createElement("div");
				pill.className = "tool-pill";
				pill.style.borderColor = "#22c55e";
				pill.style.color = "#4ade80";
				pill.innerHTML = `✓ Completed: ${event.path || event.tool}`;
				agentMsgEl.appendChild(pill);
				$chatList.scrollTop = $chatList.scrollHeight;
			}
		});

		agentMsgEl.innerHTML = formatMarkdown(reply);
	} catch (err) {
		if (err.message === "AUTH_REQUIRED") {
			agentMsgEl.innerHTML = `⚠️ <strong>Authentication Required!</strong><br/>Please click the 🔑 <strong>Key</strong> button at the top to set your Gemini API key (or login with Antigravity).`;
			showAuthDialog();
		} else {
			agentMsgEl.innerHTML = `❌ Error: ${err.message}`;
		}
	} finally {
		$sendBtn.disabled = false;
		if ($activeProjectLabel) {
			$activeProjectLabel.textContent = agentBridge.activeProject || "None";
		}
		$chatList.scrollTop = $chatList.scrollHeight;
	}
}

function appendMessage(role, content) {
	const msg = document.createElement("div");
	msg.className = `chat-message ${role}`;
	msg.innerHTML = formatMarkdown(content);
	$chatList.appendChild(msg);
	$chatList.scrollTop = $chatList.scrollHeight;
	return msg;
}

function formatMarkdown(text) {
	if (!text) return "";
	return text
		.replace(/```([a-zA-Z]*)\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
		.replace(/`([^`]+)`/g, "<code>$1</code>")
		.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
		.replace(/\n/g, "<br/>");
}

async function showAuthDialog() {
	const current = agentBridge.getToken();
	const key = await prompt(
		"Enter Google Gemini API Key / Antigravity Token",
		current,
		"text",
		{
			placeholder: "AIzaSy...",
			test: (val) => Boolean(val.trim()),
		}
	);

	if (key) {
		agentBridge.setToken(key);
		alert("Success", "AeroCode AI Agent authenticated successfully! ✅");
	}
}

async function showProjectsDialog() {
	const projects = await agentBridge.listProjects();
	if (!projects.length) {
		const createNew = await promptNewProject();
		return;
	}

	const options = projects.map((p) => [p.name, p.name, p.name === agentBridge.activeProject]);
	options.push(["+ Create New Project", "+create"]);

	const selected = await select("Select Project", options);
	if (!selected) return;

	if (selected === "+create") {
		promptNewProject();
	} else {
		agentBridge.openProjectInEditor(selected);
		if ($activeProjectLabel) $activeProjectLabel.textContent = selected;
		alert("Project Loaded", `Project "${selected}" opened in editor!`);
	}
}

async function promptNewProject() {
	const name = await prompt("Project Name", "my-new-app", "text", {
		placeholder: "e.g. portfolio, react-store",
		test: (val) => Boolean(val.trim()),
	});

	if (!name) return;

	const type = await select("Choose Template", [
		["Vanilla Web (HTML, CSS, JS)", "vanilla", true],
		["React + Vite App", "react-vite"],
	]);

	if (!type) return;

	const proj = await agentBridge.createProject(name, type);
	if ($activeProjectLabel) $activeProjectLabel.textContent = proj.name;
	alert("Created", `Project "${proj.name}" created and loaded into AeroCode! 🚀`);
}

function handlePreview() {
	if (!agentBridge.activeProject) {
		alert("Notice", "Please create or open a project first.");
		return;
	}

	if (window.acode && acode.exec) {
		try {
			acode.exec("run");
			return;
		} catch (e) {}
	}

	alert("Live Preview", `Open index.html in the editor and click the Play ▶ button to preview live!`);
}
