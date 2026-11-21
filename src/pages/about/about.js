import "./about.scss";
import Logo from "components/logo";
import Page from "components/page";
import Reactive from "html-tag-js/reactive";
import actionStack from "lib/actionStack";
import config from "lib/config";
import helpers from "utils/helpers";
export default function AboutInclude() {
	const $page = Page(strings.about.capitalize());
	const webviewVersionName = Reactive("N/A");
	const webviewPackageName = Reactive("N/A");

	$page.classList.add("about-us");
	$page.body = (
		<main id="about-page" className="main scroll">
			<Logo />

			<div className="version-info">
				<h1 className="version-title">AeroCode Studio</h1>
				<div className="version-number">
					Version {BuildInfo.version} ({BuildInfo.versionCode})
				</div>
				<div style={{ marginTop: "8px", fontSize: "14px", color: "var(--accent-color, #81a1c1)", fontWeight: "600" }}>
					Developed & Customized by Shahid
				</div>
				<div style={{ fontSize: "12px", opacity: 0.8, marginTop: "4px" }}>
					AI-Powered Web & App IDE with Antigravity CLI Agent
				</div>
			</div>

			<div className="info-section">
				<a
					href="#"
					className="info-item"
					onclick={(e) => {
						e.preventDefault();
						system.openInBrowser(
							`https://play.google.com/store/apps/details?id=${webviewPackageName.value}`,
						);
					}}
				>
					<div className="info-item-icon">
						<span className="icon googlechrome"></span>
					</div>
					<div className="info-item-text">
						Webview {webviewVersionName}
						<div className="info-item-subtext">{webviewPackageName}</div>
					</div>
				</a>
				<a href="https://github.com/mdshahiid09-bit/AeroCode" className="info-item">
					<div className="info-item-icon">
						<span className="icon github"></span>
					</div>
					<div className="info-item-text">
						AeroCode Repository
						<div className="info-item-subtext">github.com/mdshahiid09-bit/AeroCode</div>
					</div>
				</a>
				<a href="#" className="info-item" onclick={(e) => { e.preventDefault(); alert("AeroCode: Powered by Antigravity CLI & Google DeepMind"); }}>
					<div className="info-item-icon">
						<span className="icon zap"></span>
					</div>
					<div className="info-item-text">
						Antigravity AI Agent Engine
						<div className="info-item-subtext">Autonomous Web & App Builder</div>
					</div>
				</a>
			</div>

			<div className="social-links">
				<a href="mailto:apps@foxdebug.com" className="social-link">
					<div className="social-icon">
						<span className="icon gmail"></span>
					</div>
					Mail
				</a>
				<a href={config.TWITTER_URL} className="social-link">
					<div className="social-icon">
						<span className="icon twitter"></span>
					</div>
					Twitter
				</a>
				<a href={config.INSTAGRAM_URL} className="social-link">
					<div className="social-icon">
						<span className="icon instagram"></span>
					</div>
					Instagram
				</a>
				<a href={config.GITHUB_URL} className="social-link">
					<div className="social-icon">
						<span className="icon github"></span>
					</div>
					GitHub
				</a>
				<a href={config.TELEGRAM_URL} className="social-link">
					<div className="social-icon">
						<span className="icon telegram"></span>
					</div>
					Telegram
				</a>
				<a href={config.DISCORD_URL} className="social-link">
					<div className="social-icon">
						<span className="icon discord"></span>
					</div>
					Discord
				</a>
			</div>
		</main>
	);

	system.getWebviewInfo((res) => {
		webviewPackageName.value = res?.packageName || "N/A";
		webviewVersionName.value = res?.versionName || "N/A";
	});

	actionStack.push({
		id: "about",
		action: $page.hide,
	});

	$page.onhide = function () {
		actionStack.remove("about");
	};

	app.append($page);
	helpers.showAd();
}
