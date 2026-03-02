#!/usr/bin/env node

/**
 * CLI AI Chat System
 *
 * Unified session management system for AI chat interfaces.
 * Supports Claude, Gemini, and Codex (ChatGPT) platforms.
 *
 * Commands:
 * - init [platform]   - Initialize chat system (all platforms or specific one)
 * - update [platform] - Update existing installation
 * - help              - Show usage instructions
 * - platform          - Show platform information
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Color codes for terminal output
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',
	green: '\x1b[32m',
	cyan: '\x1b[36m',
	yellow: '\x1b[33m',
	red: '\x1b[31m',
	magenta: '\x1b[35m',
	blue: '\x1b[34m'
};

// Get command and arguments
const args = process.argv.slice(2);
const command = args[0];
const platformArg = args[1] ? args[1].toLowerCase() : null;

// Template directory (in the npm package)
const TEMPLATE_DIR = path.join(__dirname, '..', 'template');

// Valid platforms
const VALID_PLATFORMS = ['claude', 'gemini', 'codex'];

// Platform display names
const PLATFORM_NAMES = {
	claude: 'Claude',
	gemini: 'Gemini',
	codex: 'Codex (ChatGPT)'
};

// Platform config directories
const PLATFORM_DIRS = {
	claude: '.claude',
	gemini: '.gemini',
	codex: '.codex'
};

// Platform doc files
const PLATFORM_DOCS = {
	claude: 'CLAUDE.md',
	gemini: 'GEMINI.md',
	codex: 'AGENTS.md'
};

// Platform command formats
const PLATFORM_FORMATS = {
	claude: '.md (Markdown)',
	gemini: '.toml (TOML)',
	codex: '.yaml (YAML)'
};

/**
 * Copy directory recursively
 */
function copyDirectorySync(src, dest, indent = '') {
	if (!fs.existsSync(dest)) {
		fs.mkdirSync(dest, { recursive: true });
	}

	const entries = fs.readdirSync(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isDirectory()) {
			console.log(`${indent}${colors.dim}  Creating directory: ${entry.name}/${colors.reset}`);
			copyDirectorySync(srcPath, destPath, indent + '  ');
		} else {
			console.log(`${indent}${colors.dim}  Copying: ${entry.name}${colors.reset}`);
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

/**
 * Get package version from package.json
 */
function getPackageVersion() {
	try {
		const packageJsonPath = path.join(__dirname, '..', 'package.json');
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
		return packageJson.version;
	} catch (error) {
		return 'unknown';
	}
}

/**
 * Get the installed version stored in the project directory
 */
function getInstalledVersion() {
	try {
		const versionFile = path.join(process.cwd(), '.cli-ai-chat-version');
		if (fs.existsSync(versionFile)) {
			return fs.readFileSync(versionFile, 'utf8').trim();
		}
		return null;
	} catch (error) {
		return null;
	}
}

/**
 * Write the current package version to the project's version file
 */
function writeInstalledVersion() {
	const version = getPackageVersion();
	const versionFile = path.join(process.cwd(), '.cli-ai-chat-version');
	fs.writeFileSync(versionFile, version, 'utf8');
}

/**
 * Validate platform argument
 */
function validatePlatform(platform) {
	if (platform && !VALID_PLATFORMS.includes(platform)) {
		console.error(`${colors.red}Error: Unknown platform "${platform}"${colors.reset}`);
		console.error(`${colors.yellow}Valid platforms: ${VALID_PLATFORMS.join(', ')}${colors.reset}`);
		console.error('');
		process.exit(1);
	}
}

/**
 * Get list of platforms to install/update
 * Returns array of platform keys
 */
function getPlatforms(platform) {
	if (platform) {
		return [platform];
	}
	return VALID_PLATFORMS;
}

/**
 * Get installed platforms by checking which config dirs exist
 */
function getInstalledPlatforms() {
	const targetDir = process.cwd();
	return VALID_PLATFORMS.filter(p =>
		fs.existsSync(path.join(targetDir, PLATFORM_DIRS[p]))
	);
}

/**
 * Detect if current directory has been initialized
 */
function detectInitializedProject() {
	const targetDir = process.cwd();
	const hasRegistry = fs.existsSync(path.join(targetDir, '.cli-ai-chat'));
	const hasTemplates = fs.existsSync(path.join(targetDir, '_templates'));
	return hasRegistry && hasTemplates;
}

/**
 * Prompt user for confirmation
 */
function promptUserConfirmation(action = 'update') {
	return new Promise((resolve) => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		const message = action === 'init'
			? `${colors.bright}Proceed with installation? (y/n): ${colors.reset}`
			: `${colors.bright}Proceed with update? (y/n): ${colors.reset}`;

		const cancelMessage = action === 'init'
			? `${colors.yellow}Installation cancelled.${colors.reset}`
			: `${colors.yellow}Update cancelled.${colors.reset}`;

		rl.question(message, (answer) => {
			rl.close();
			const normalized = answer.trim().toLowerCase();
			const confirmed = normalized === 'y' || normalized === 'yes';
			console.log('');
			if (!confirmed) {
				console.log(cancelMessage);
				console.log('');
			}
			resolve(confirmed);
		});
	});
}

/**
 * Show install preview
 */
function showInstallPreview(platforms) {
	const version = getPackageVersion();
	const targetDir = process.cwd();
	const isAll = platforms.length === VALID_PLATFORMS.length;

	console.log('');
	console.log(`${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
	console.log(`${colors.bright}${colors.cyan}║   Initialize CLI AI Chat System                               ║${colors.reset}`);
	console.log(`${colors.bright}${colors.cyan}╚═══════════════════════════════════════════════════════════════╝${colors.reset}`);
	console.log('');
	console.log(`${colors.cyan}Installing to:${colors.reset}   ${colors.bright}${targetDir}${colors.reset}`);
	console.log(`${colors.cyan}Package version:${colors.reset} ${colors.bright}v${version}${colors.reset}`);
	console.log(`${colors.cyan}Platforms:${colors.reset}       ${colors.bright}${isAll ? 'All (' + platforms.map(p => PLATFORM_NAMES[p]).join(', ') + ')' : PLATFORM_NAMES[platforms[0]]}${colors.reset}`);
	console.log('');
	console.log(`${colors.bright}The following will be installed:${colors.reset}`);
	console.log('');

	console.log(`${colors.bright}Shared (all platforms):${colors.reset}`);
	console.log(`  ${colors.cyan}•${colors.reset} .cli-ai-chat/         - Unified session registry`);
	console.log(`  ${colors.cyan}•${colors.reset} _templates/session/   - Session file templates`);
	console.log(`  ${colors.cyan}•${colors.reset} SYSTEM.md             - Master system documentation`);
	console.log(`  ${colors.cyan}•${colors.reset} README.md             - User documentation`);
	console.log(`  ${colors.cyan}•${colors.reset} docs/                 - Reference guides`);
	console.log('');

	console.log(`${colors.bright}Platform-specific:${colors.reset}`);
	for (const p of platforms) {
		console.log(`  ${colors.cyan}•${colors.reset} ${PLATFORM_DIRS[p]}/commands/   - ${PLATFORM_NAMES[p]} slash commands (${PLATFORM_FORMATS[p]})`);
		console.log(`  ${colors.cyan}•${colors.reset} ${PLATFORM_DOCS[p]}              - ${PLATFORM_NAMES[p]} guidance`);
	}
	console.log('');

	console.log(`${colors.bright}${colors.yellow}⚠ Warning:${colors.reset} ${colors.yellow}Existing files with the same names will be overwritten.${colors.reset}`);
	console.log(`${colors.dim}Session data (.cli-ai-chat/sessions.json, chats/) will NOT be touched.${colors.reset}`);
	console.log('');
}

/**
 * Install shared files (registry, templates, docs)
 */
function installSharedFiles(targetDir) {
	// .cli-ai-chat/ registry (only if not exists - preserve user data)
	const registryDest = path.join(targetDir, '.cli-ai-chat');
	const registrySrc = path.join(TEMPLATE_DIR, '.cli-ai-chat');
	if (!fs.existsSync(registryDest)) {
		console.log(`${colors.green}✓${colors.reset} ${colors.bright}.cli-ai-chat/${colors.reset}`);
		copyDirectorySync(registrySrc, registryDest, '  ');
	} else {
		console.log(`${colors.dim}  .cli-ai-chat/ already exists — session data preserved${colors.reset}`);
	}

	// _templates/session/
	const templatesSrc = path.join(TEMPLATE_DIR, '_templates');
	const templatesDest = path.join(targetDir, '_templates');
	console.log(`${colors.green}✓${colors.reset} ${colors.bright}_templates/${colors.reset}`);
	copyDirectorySync(templatesSrc, templatesDest, '  ');

	// Shared docs
	const sharedFiles = ['SYSTEM.md', 'README.md'];
	for (const file of sharedFiles) {
		const src = path.join(TEMPLATE_DIR, file);
		if (fs.existsSync(src)) {
			console.log(`${colors.green}✓${colors.reset} ${colors.bright}${file}${colors.reset}`);
			fs.copyFileSync(src, path.join(targetDir, file));
		}
	}

	// docs/
	const docsSrc = path.join(TEMPLATE_DIR, 'docs');
	const docsDest = path.join(targetDir, 'docs');
	if (fs.existsSync(docsSrc)) {
		console.log(`${colors.green}✓${colors.reset} ${colors.bright}docs/${colors.reset}`);
		copyDirectorySync(docsSrc, docsDest, '  ');
	}
}

/**
 * Generate platform-specific doc content from CLAUDE.md by find-replace.
 * CLAUDE.md is the single source of truth — Gemini and Codex versions are derived.
 */
function generatePlatformDoc(content, platform) {
	if (platform === 'claude') return content;

	if (platform === 'gemini') {
		// Order matters — most specific patterns first
		content = content.replace(/commands\/\*\.md/g, 'commands/*.toml');
		content = content.replace(/commands\/([a-z-]+)\.md/g, 'commands/$1.toml');
		content = content.replace(/CLAUDE\.md/g, 'GEMINI.md');
		content = content.replace(/\.claude\//g, '.gemini/');
		content = content.replace(/Claude Code/g, 'Gemini CLI');
		content = content.replace(/Claude CLI/g, 'Gemini CLI');
		content = content.replace(/Claude/g, 'Gemini');
		content = content.replace(/claude/g, 'gemini');
	} else if (platform === 'codex') {
		content = content.replace(/commands\/\*\.md/g, 'commands/*.yaml');
		content = content.replace(/commands\/([a-z-]+)\.md/g, 'commands/$1.yaml');
		content = content.replace(/CLAUDE\.md/g, 'AGENTS.md');
		content = content.replace(/\.claude\//g, '.codex/');
		content = content.replace(/Claude Code/g, 'Codex CLI');
		content = content.replace(/Claude CLI/g, 'Codex CLI');
		content = content.replace(/Claude/g, 'ChatGPT');
		content = content.replace(/claude/g, 'codex');
	}

	return content;
}

/**
 * Install a single platform
 */
function installPlatform(platform, targetDir) {
	const platformDir = PLATFORM_DIRS[platform];
	const platformDoc = PLATFORM_DOCS[platform];

	// Platform commands directory
	const cmdSrc = path.join(TEMPLATE_DIR, platformDir);
	const cmdDest = path.join(targetDir, platformDir);
	console.log(`${colors.green}✓${colors.reset} ${colors.bright}${platformDir}/${colors.reset}`);
	copyDirectorySync(cmdSrc, cmdDest, '  ');

	// Generate platform doc file from CLAUDE.md
	const claudeMdSrc = path.join(TEMPLATE_DIR, 'CLAUDE.md');
	if (fs.existsSync(claudeMdSrc)) {
		const claudeContent = fs.readFileSync(claudeMdSrc, 'utf8');
		const platformContent = generatePlatformDoc(claudeContent, platform);
		console.log(`${colors.green}✓${colors.reset} ${colors.bright}${platformDoc}${colors.reset} ${colors.dim}(generated from CLAUDE.md)${colors.reset}`);
		fs.writeFileSync(path.join(targetDir, platformDoc), platformContent, 'utf8');
	}
}

/**
 * Initialize chat system in current directory
 */
async function initProject() {
	validatePlatform(platformArg);
	const platforms = getPlatforms(platformArg);

	showInstallPreview(platforms);

	const confirmed = await promptUserConfirmation('init');
	if (!confirmed) {
		process.exit(0);
	}

	const targetDir = process.cwd();

	console.log('');
	console.log(`${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
	console.log(`${colors.bright}${colors.cyan}║   Initializing CLI AI Chat System...                         ║${colors.reset}`);
	console.log(`${colors.bright}${colors.cyan}╚═══════════════════════════════════════════════════════════════╝${colors.reset}`);
	console.log('');

	if (!fs.existsSync(TEMPLATE_DIR)) {
		console.error(`${colors.red}Error: Template directory not found at ${TEMPLATE_DIR}${colors.reset}`);
		process.exit(1);
	}

	try {
		// Install shared files
		installSharedFiles(targetDir);
		console.log('');

		// Install platform-specific files
		for (const platform of platforms) {
			installPlatform(platform, targetDir);
		}

		writeInstalledVersion();

		const version = getPackageVersion();
		const isAll = platforms.length === VALID_PLATFORMS.length;

		console.log('');
		console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
		console.log(`${colors.bright}${colors.green}✓ CLI AI Chat System initialized successfully!${colors.reset}`);
		console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
		console.log('');
		console.log(`${colors.bright}Installed version:${colors.reset} v${version}`);
		console.log(`${colors.bright}Platforms:${colors.reset}        ${isAll ? 'All' : PLATFORM_NAMES[platforms[0]]}`);
		console.log('');

		console.log(`${colors.bright}${colors.green}What's been set up:${colors.reset}`);
		console.log(`  ${colors.green}✓${colors.reset} Unified session registry (${colors.cyan}.cli-ai-chat/${colors.reset})`);
		console.log(`  ${colors.green}✓${colors.reset} Session templates (${colors.cyan}_templates/session/${colors.reset})`);
		for (const p of platforms) {
			console.log(`  ${colors.green}✓${colors.reset} ${PLATFORM_NAMES[p]} commands (${colors.cyan}${PLATFORM_DIRS[p]}/commands/${colors.reset})`);
		}
		console.log('');

		console.log(`${colors.bright}${colors.magenta}Next Steps:${colors.reset}`);
		console.log(`  ${colors.dim}1.${colors.reset} Open your AI CLI tool (claude, gemini, or codex)`);
		console.log(`  ${colors.dim}2.${colors.reset} Run ${colors.cyan}/new-session [project] [topic]${colors.reset} to start your first session`);
		console.log(`  ${colors.dim}3.${colors.reset} See ${colors.cyan}README.md${colors.reset} for full documentation`);
		console.log('');

	} catch (error) {
		console.error(`${colors.red}Error initializing project:${colors.reset}`, error.message);
		process.exit(1);
	}
}

/**
 * Show update preview
 */
function showUpdatePreview(platforms, installedPlatforms) {
	const version = getPackageVersion();
	const installedVersion = getInstalledVersion();
	const targetDir = process.cwd();

	console.log('');
	console.log(`${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
	console.log(`${colors.bright}${colors.cyan}║   Update CLI AI Chat System                                   ║${colors.reset}`);
	console.log(`${colors.bright}${colors.cyan}╚═══════════════════════════════════════════════════════════════╝${colors.reset}`);
	console.log('');

	if (installedVersion) {
		console.log(`${colors.cyan}Installed version:${colors.reset} ${colors.bright}v${installedVersion}${colors.reset}`);
		console.log(`${colors.cyan}Updating to:${colors.reset}      ${colors.bright}v${version}${colors.reset}`);
	} else {
		console.log(`${colors.cyan}Updating to:${colors.reset} ${colors.bright}v${version}${colors.reset}`);
	}
	console.log(`${colors.cyan}Directory:${colors.reset}   ${targetDir}`);
	console.log('');

	console.log(`${colors.bright}${colors.yellow}Files that will be updated:${colors.reset}`);
	console.log(`  ${colors.yellow}•${colors.reset} _templates/session/   - Session templates`);
	console.log(`  ${colors.yellow}•${colors.reset} SYSTEM.md, README.md, docs/`);
	for (const p of platforms) {
		console.log(`  ${colors.yellow}•${colors.reset} ${PLATFORM_DIRS[p]}/   - ${PLATFORM_NAMES[p]} commands`);
		console.log(`  ${colors.yellow}•${colors.reset} ${PLATFORM_DOCS[p]}`);
	}
	console.log('');
	console.log(`${colors.bright}${colors.green}Preserved (not touched):${colors.reset}`);
	console.log(`  ${colors.green}•${colors.reset} .cli-ai-chat/sessions.json   - Your session registry`);
	console.log(`  ${colors.green}•${colors.reset} .cli-ai-chat/active-session.txt`);
	console.log(`  ${colors.green}•${colors.reset} chats/                       - All your session data`);
	console.log('');
	console.log(`${colors.bright}${colors.yellow}⚠ Warning:${colors.reset} ${colors.yellow}System files will be overwritten.${colors.reset}`);
	console.log('');
}

/**
 * Update existing installation
 */
async function updateProject() {
	validatePlatform(platformArg);

	if (!detectInitializedProject()) {
		console.log('');
		console.log(`${colors.red}Error: No CLI AI Chat System found in this directory${colors.reset}`);
		console.log('');
		console.log(`${colors.yellow}Required directories not found:${colors.reset}`);
		console.log(`  ${colors.cyan}.cli-ai-chat/${colors.reset}`);
		console.log(`  ${colors.cyan}_templates/${colors.reset}`);
		console.log('');
		console.log(`${colors.cyan}To initialize, run:${colors.reset}`);
		console.log(`  ${colors.bright}npx cli-ai-chat-system init${colors.reset}`);
		console.log('');
		process.exit(1);
	}

	// Check version
	const installedVersion = getInstalledVersion();
	const currentVersion = getPackageVersion();

	if (!platformArg && installedVersion === currentVersion) {
		console.log('');
		console.log(`${colors.bright}${colors.green}✓ Already up to date!${colors.reset}`);
		console.log(`${colors.dim}Version: ${colors.reset}${colors.bright}v${currentVersion}${colors.reset}`);
		console.log('');
		return;
	}

	// Determine which platforms to update
	const installedPlatforms = getInstalledPlatforms();
	let platforms;

	if (platformArg) {
		if (!installedPlatforms.includes(platformArg)) {
			console.log('');
			console.log(`${colors.yellow}Platform "${PLATFORM_NAMES[platformArg]}" is not installed.${colors.reset}`);
			console.log(`${colors.cyan}To add it, run:${colors.reset} ${colors.bright}npx cli-ai-chat-system init ${platformArg}${colors.reset}`);
			console.log('');
			process.exit(1);
		}
		platforms = [platformArg];
	} else {
		platforms = installedPlatforms;
	}

	showUpdatePreview(platforms, installedPlatforms);

	const confirmed = await promptUserConfirmation('update');
	if (!confirmed) {
		process.exit(0);
	}

	const targetDir = process.cwd();

	console.log(`${colors.cyan}Updating system files...${colors.reset}`);
	console.log('');

	try {
		// Update shared files (skip .cli-ai-chat registry - preserve user data)
		const templatesSrc = path.join(TEMPLATE_DIR, '_templates');
		const templatesDest = path.join(targetDir, '_templates');
		console.log(`${colors.green}✓${colors.reset} ${colors.bright}_templates/${colors.reset}`);
		copyDirectorySync(templatesSrc, templatesDest, '  ');

		const sharedFiles = ['SYSTEM.md', 'README.md'];
		for (const file of sharedFiles) {
			const src = path.join(TEMPLATE_DIR, file);
			if (fs.existsSync(src)) {
				console.log(`${colors.green}✓${colors.reset} ${colors.bright}${file}${colors.reset}`);
				fs.copyFileSync(src, path.join(targetDir, file));
			}
		}

		const docsSrc = path.join(TEMPLATE_DIR, 'docs');
		const docsDest = path.join(targetDir, 'docs');
		if (fs.existsSync(docsSrc)) {
			console.log(`${colors.green}✓${colors.reset} ${colors.bright}docs/${colors.reset}`);
			copyDirectorySync(docsSrc, docsDest, '  ');
		}

		// Update platform files
		const claudeMdSrc = path.join(TEMPLATE_DIR, 'CLAUDE.md');
		for (const platform of platforms) {
			const platformDir = PLATFORM_DIRS[platform];
			const cmdSrc = path.join(TEMPLATE_DIR, platformDir);
			const cmdDest = path.join(targetDir, platformDir);

			// Remove old platform dir and recopy (clean update)
			if (fs.existsSync(cmdDest)) {
				fs.rmSync(cmdDest, { recursive: true, force: true });
			}
			console.log(`${colors.green}✓${colors.reset} ${colors.bright}${platformDir}/${colors.reset}`);
			copyDirectorySync(cmdSrc, cmdDest, '  ');

			// Regenerate platform doc from CLAUDE.md
			if (fs.existsSync(claudeMdSrc)) {
				const claudeContent = fs.readFileSync(claudeMdSrc, 'utf8');
				const platformContent = generatePlatformDoc(claudeContent, platform);
				const platformDoc = PLATFORM_DOCS[platform];
				console.log(`${colors.green}✓${colors.reset} ${colors.bright}${platformDoc}${colors.reset} ${colors.dim}(generated from CLAUDE.md)${colors.reset}`);
				fs.writeFileSync(path.join(targetDir, platformDoc), platformContent, 'utf8');
			}
		}

		writeInstalledVersion();

		console.log('');
		console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
		console.log(`${colors.bright}${colors.green}✓ CLI AI Chat System updated successfully!${colors.reset}`);
		console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
		console.log('');
		console.log(`${colors.bright}Updated to:${colors.reset} v${currentVersion}`);
		console.log(`${colors.dim}Session data and registry preserved.${colors.reset}`);
		console.log('');

	} catch (error) {
		console.error(`${colors.red}Error during update:${colors.reset}`, error.message);
		process.exit(1);
	}
}

/**
 * Show platform information
 */
function showPlatformInfo() {
	const targetDir = process.cwd();
	const installedPlatforms = getInstalledPlatforms();
	const availablePlatforms = VALID_PLATFORMS.filter(p => !installedPlatforms.includes(p));

	console.log('');
	console.log(`${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
	console.log(`${colors.bright}${colors.cyan}║   Platform Information                                        ║${colors.reset}`);
	console.log(`${colors.bright}${colors.cyan}╚═══════════════════════════════════════════════════════════════╝${colors.reset}`);
	console.log('');

	console.log(`${colors.bright}Installed Platforms:${colors.reset}`);
	if (installedPlatforms.length === 0) {
		console.log(`  ${colors.yellow}None — run ${colors.cyan}npx cli-ai-chat-system init${colors.reset}${colors.yellow} to install${colors.reset}`);
	} else {
		for (const p of installedPlatforms) {
			console.log(`  ${colors.green}✓${colors.reset} ${colors.bright}${PLATFORM_NAMES[p]}${colors.reset}`);
			console.log(`      Config dir:    ${colors.cyan}${PLATFORM_DIRS[p]}/${colors.reset}`);
			console.log(`      Doc file:      ${colors.cyan}${PLATFORM_DOCS[p]}${colors.reset}`);
			console.log(`      Command format:${colors.cyan} ${PLATFORM_FORMATS[p]}${colors.reset}`);
		}
	}
	console.log('');

	if (availablePlatforms.length > 0) {
		console.log(`${colors.bright}Available (not installed):${colors.reset}`);
		for (const p of availablePlatforms) {
			console.log(`  ${colors.dim}○${colors.reset} ${PLATFORM_NAMES[p]}`);
		}
		console.log('');
		console.log(`${colors.cyan}To add a platform:${colors.reset}`);
		for (const p of availablePlatforms) {
			console.log(`  ${colors.bright}npx cli-ai-chat-system init ${p}${colors.reset}`);
		}
		console.log('');
	}

	console.log(`${colors.bright}Command Format Differences:${colors.reset}`);
	console.log(`  ${colors.cyan}Claude:${colors.reset} Markdown (.md) — detailed bash scripts with jq`);
	console.log(`  ${colors.cyan}Gemini:${colors.reset} TOML (.toml)   — structured prompt definitions`);
	console.log(`  ${colors.cyan}Codex:${colors.reset}  YAML (.yaml)   — inline validation and steps`);
	console.log('');

	console.log(`${colors.bright}Shared Session Registry:${colors.reset}`);
	const registryExists = fs.existsSync(path.join(targetDir, '.cli-ai-chat'));
	console.log(`  ${registryExists ? colors.green + '✓' : colors.yellow + '○'}${colors.reset} .cli-ai-chat/sessions.json`);
	console.log(`  All platforms share the same session registry`);
	console.log(`  Sessions created in Claude can be continued in Gemini and vice versa`);
	console.log('');
}

/**
 * Show help message
 */
function showHelp() {
	console.log('');
	console.log(`${colors.bright}${colors.cyan}CLI AI Chat System${colors.reset}`);
	console.log('');
	console.log(`${colors.bright}Description:${colors.reset}`);
	console.log(`  Unified session management for AI chat CLIs.`);
	console.log(`  Supports Claude, Gemini, and Codex (ChatGPT) with shared session tracking.`);
	console.log('');
	console.log(`${colors.bright}Usage:${colors.reset}`);
	console.log(`  npx cli-ai-chat-system <command> [platform]`);
	console.log('');
	console.log(`${colors.bright}Commands:${colors.reset}`);
	console.log('');
	console.log(`  ${colors.green}init [platform]${colors.reset}`);
	console.log(`    Initialize the chat system in the current directory`);
	console.log(`    ${colors.dim}No platform arg: installs all platforms (Claude, Gemini, Codex)${colors.reset}`);
	console.log(`    ${colors.dim}With platform arg: installs only that platform${colors.reset}`);
	console.log('');
	console.log(`    ${colors.bright}Examples:${colors.reset}`);
	console.log(`      npx cli-ai-chat-system init`);
	console.log(`      npx cli-ai-chat-system init claude`);
	console.log(`      npx cli-ai-chat-system init gemini`);
	console.log(`      npx cli-ai-chat-system init codex`);
	console.log('');
	console.log(`  ${colors.green}update [platform]${colors.reset}`);
	console.log(`    Update system files in an existing installation`);
	console.log(`    ${colors.dim}No platform arg: updates all installed platforms${colors.reset}`);
	console.log(`    ${colors.dim}With platform arg: updates only that platform${colors.reset}`);
	console.log(`    ${colors.dim}Preserves session data (.cli-ai-chat/sessions.json, chats/)${colors.reset}`);
	console.log('');
	console.log(`    ${colors.bright}Examples:${colors.reset}`);
	console.log(`      npx cli-ai-chat-system update`);
	console.log(`      npx cli-ai-chat-system update claude`);
	console.log('');
	console.log(`  ${colors.green}platform${colors.reset}`);
	console.log(`    Show installed platforms and available options`);
	console.log('');
	console.log(`  ${colors.green}help${colors.reset}`);
	console.log(`    Show this help message`);
	console.log('');
	console.log(`${colors.bright}Platforms:${colors.reset}`);
	console.log(`  ${colors.cyan}claude${colors.reset}  - Claude Code CLI (.claude/commands/*.md)`);
	console.log(`  ${colors.cyan}gemini${colors.reset}  - Gemini CLI (.gemini/commands/*.toml)`);
	console.log(`  ${colors.cyan}codex${colors.reset}   - Codex/ChatGPT CLI (.codex/commands/*.yaml)`);
	console.log('');
	console.log(`${colors.bright}Session Commands (used inside your AI CLI):${colors.reset}`);
	console.log(`  ${colors.cyan}/new-session [project] [topic]${colors.reset}  - Start a new session`);
	console.log(`  ${colors.cyan}/checkpoint${colors.reset}                      - Save progress`);
	console.log(`  ${colors.cyan}/continue-session${colors.reset}                - Resume a session`);
	console.log(`  ${colors.cyan}/end-session${colors.reset}                     - Finalize session`);
	console.log(`  ${colors.cyan}/start-plan [name]${colors.reset}               - Activate planning mode`);
	console.log(`  ${colors.cyan}/list-sessions${colors.reset}                   - View all sessions (Gemini/Codex)`);
	console.log(`  ${colors.cyan}/switch-session${colors.reset}                  - Switch sessions (Gemini/Codex)`);
	console.log(`  ${colors.cyan}/save-artifact [file]${colors.reset}            - Save artifact (Gemini/Codex)`);
	console.log('');
}

/**
 * Main CLI handler
 */
async function main() {
	switch (command) {
		case 'init':
			await initProject();
			break;

		case 'update':
			await updateProject();
			break;

		case 'platform':
		case 'platforms':
			showPlatformInfo();
			break;

		case 'help':
		case '--help':
		case '-h':
			showHelp();
			break;

		case undefined:
			console.log('');
			console.log(`${colors.yellow}No command specified.${colors.reset}`);
			console.log('');
			console.log(`  ${colors.cyan}npx cli-ai-chat-system init${colors.reset}      — initialize in current directory`);
			console.log(`  ${colors.cyan}npx cli-ai-chat-system update${colors.reset}    — update existing installation`);
			console.log(`  ${colors.cyan}npx cli-ai-chat-system platform${colors.reset}  — show platform information`);
			console.log(`  ${colors.cyan}npx cli-ai-chat-system help${colors.reset}      — show full usage`);
			console.log('');
			break;

		default:
			console.error(`${colors.red}Unknown command: ${command}${colors.reset}`);
			console.log('');
			console.log(`Valid commands: ${colors.cyan}init${colors.reset}, ${colors.cyan}update${colors.reset}, ${colors.cyan}platform${colors.reset}, ${colors.cyan}help${colors.reset}`);
			console.log(`Run: ${colors.cyan}npx cli-ai-chat-system help${colors.reset} for more information`);
			console.log('');
			process.exit(1);
	}
}

// Run CLI
main();
