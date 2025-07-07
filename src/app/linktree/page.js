'use client';

import React, { useEffect } from 'react';

const linkFolders = [
	{
		name: 'AI',
		links: [
			{ title: 'ChatGPT', url: 'https://chat.openai.com' },
			{ title: 'Grok', url: 'https://grok.com' },
			{ title: 'Gemini', url: 'https://gemini.google.com/app' },
			{ title: 'DeepSeek', url: 'https://chat.deepseek.com/' },
			{ title: 'Copilot', url: 'https://copilot.microsoft.com' },
			// Coding AI links (for "Coding" section in AI)
			{ title: 'Lovable', url: 'https://lovable.dev', coding: true },
			{ title: 'Claude', url: 'https://claude.ai', coding: true },
			{ title: 'Blackbox', url: 'https://www.blackbox.ai', coding: true },
		],
		aiDetectors: [
			{ title: 'Reilaa', url: 'https://reilaa.com/' },
			{ title: 'AI Humanize', url: 'https://aihumanize.io/' },
			{ title: 'Grammarly AI Detector', url: 'https://www.grammarly.com/ai-detector' },
			{ title: 'GPTZero', url: 'https://app.gptzero.me/' },
			{ title: 'DetectZeroAI', url: 'https://www.detectzeroai.com/?fbclid=PAQ0xDSwLQ46hleHRuA2FlbQIxMQABp5blXi_v2wEsukjEnwMx-rCjxVcweiLkYM_4_Iy1BcJ9g9DJ8yP7vIvnkbbB_aem_Qlu5m5EFym4PYKHfWrt-tg' },
			{ title: 'WalterWrites', url: 'https://walterwrites.ai/' },
		],
	},
	{
		name: 'Coding',
		links: [
			{ title: 'GitHub', url: 'https://github.com' },
			{ title: 'CodeSandbox', url: 'https://codesandbox.io' },
			{ title: 'Sandbox Code', url: 'https://sandbox--code.vercel.app' },
			{ title: 'Teachable Machine', url: 'https://teachablemachine.withgoogle.com/v1' },
		],
	},
	{
		name: 'Design',
		links: [
			{ title: 'Ezgif', url: 'https://ezgif.com/' },
		],
	},
	{
		name: 'Education',
		links: [
			{ title: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
			{ title: 'LitSolutions', url: 'https://www.litsolutions.org/' },
		],
	},
	{
		name: 'Media',
		links: [
			// Anime links
			{ title: 'HiAnime', url: 'https://hianime.to', anime: true },
			{ title: 'KickAssAnime', url: 'https://kaa.to', anime: true },
			{ title: 'AnimePahe', url: 'https://animepahe.ru', anime: true },
			{ title: 'KissAnime', url: 'https://kissanime.com.ru', anime: true },
			// Other media tools
			{ title: 'TwistedWave', url: 'https://twistedwave.com/online' },
			{ title: 'VocalRemover', url: 'https://vocalremover.org/' },
		],
		music: [
			{ title: 'Pixabay Music', url: 'https://pixabay.com/music' },
		],
	},
	{
		name: 'News',
		links: [],
	},
	{
		name: 'Research',
		links: [
			{ title: 'Arxiv', url: 'https://arxiv.org' },
		],
	},
	{
		name: 'Security',
		links: [],
	},
	{
		name: 'Social',
		links: [],
	},
	{
		name: 'Tools',
		links: [
			{ title: 'TinyTool', url: 'https://tinytool.net/' },
		],
	},
];

function FolderWindow({ links }) {
	return (
		<div
			style={{
				padding: '1rem',
				fontFamily: 'Fira Code, monospace',
				color: '#d4d4d4',
			}}
		>
			{links.map((link, i) => (
				<div key={i} style={{ marginBottom: '0.5rem' }}>
					<a
						href={link.url}
						target="_blank"
						rel="noopener noreferrer"
						style={{
							color: '#9cdcfe',
							textDecoration: 'none',
							transition: 'color 0.2s',
						}}
					>
						↳ {link.title}
					</a>
				</div>
			))}
		</div>
	);
}

export default function LinktreeVSCode() {
	useEffect(() => {
		document.body.style.margin = '0';
		document.body.style.overflowX = 'hidden'; // Prevent horizontal scrolling
		return () => {
			document.body.style.margin = '';
			document.body.style.overflowX = ''; // Clean up
		};
	}, []);

	const openFolderWindow = async (folder) => {
		const [{ default: WinBox }] = await Promise.all([
			import('winbox/src/js/winbox'),
			import('winbox/dist/css/winbox.min.css'),
		]);

		let linksHtml;
		if (folder.name === 'Media') {
			const animeLinks = folder.links
				.filter(link => link.anime)
				.map(link => `
					<li style="margin-bottom:0.4em;">
						<a href="${link.url}" target="_blank" rel="noopener noreferrer" style="color:#9cdcfe;text-decoration:none;transition:color 0.2s;">
							↳ ${link.title}
						</a>
					</li>
				`).join('');
			const musicLinks = (folder.music || [])
				.map(link => `
					<li style="margin-bottom:0.4em;">
						<a href="${link.url}" target="_blank" rel="noopener noreferrer" style="color:#9cdcfe;text-decoration:none;transition:color 0.2s;">
							↳ ${link.title}
						</a>
					</li>
				`).join('');
			linksHtml = `
				<div style="margin-bottom: 1rem;">
					<div style="font-weight:bold;color:#d7ba7d;font-size:1.1em;margin-bottom:0.3em;">Games</div>
					<ul style="margin:0 0 1em 1.2em;padding:0;color:#9cdcfe;font-size:14px;">
						<!-- Add game links here -->
					</ul>
					<div style="font-weight:bold;color:#d7ba7d;font-size:1.1em;margin-bottom:0.3em;">Movies</div>
					<ul style="margin:0 0 1em 1.2em;padding:0;color:#9cdcfe;font-size:14px;">
						<!-- Add movie links here -->
					</ul>
					<div style="font-weight:bold;color:#d7ba7d;font-size:1.1em;margin-bottom:0.3em;">TV Shows</div>
					<ul style="margin:0 0 1em 1.2em;padding:0;color:#9cdcfe;font-size:14px;">
						<!-- Add TV show links here -->
					</ul>
					<div style="font-weight:bold;color:#d7ba7d;font-size:1.1em;margin-bottom:0.3em;">Anime</div>
					<ul style="margin:0 0 1em 1.2em;padding:0;color:#9cdcfe;font-size:14px;">
						${animeLinks}
					</ul>
					<div style="font-weight:bold;color:#d7ba7d;font-size:1.1em;margin-bottom:0.3em;">Music</div>
					<ul style="margin:0 0 1em 1.2em;padding:0;color:#9cdcfe;font-size:14px;">
						${musicLinks}
					</ul>
					<div style="font-weight:bold;color:#d7ba7d;font-size:1.1em;margin-bottom:0.3em;">Manga</div>
					<ul style="margin:0 0 1em 1.2em;padding:0;color:#9cdcfe;font-size:14px;">
						<!-- Add manga links here -->
					</ul>
					<div style="font-weight:bold;color:#d7ba7d;font-size:1.1em;margin-bottom:0.3em;">Books</div>
					<ul style="margin:0 0 1em 1.2em;padding:0;color:#9cdcfe;font-size:14px;">
						<!-- Add book links here -->
					</ul>
				</div>
			`;
		} else if (folder.name === 'AI') {
			const generalLinks = folder.links
				.filter(link => !link.coding)
				.map(link => `
					<li style="margin-bottom:0.4em;">
						<a href="${link.url}" target="_blank" rel="noopener noreferrer" style="color:#9cdcfe;text-decoration:none;transition:color 0.2s;">
							↳ ${link.title}
						</a>
					</li>
				`).join('');
			const codingLinks = folder.links
				.filter(link => link.coding)
				.map(link => `
					<li style="margin-bottom:0.4em;">
						<a href="${link.url}" target="_blank" rel="noopener noreferrer" style="color:#9cdcfe;text-decoration:none;transition:color 0.2s;">
							↳ ${link.title}
						</a>
					</li>
				`).join('');
			const aiDetectorLinks = (folder.aiDetectors || [])
				.map(link => `
					<li style="margin-bottom:0.4em;">
						<a href="${link.url}" target="_blank" rel="noopener noreferrer" style="color:#9cdcfe;text-decoration:none;transition:color 0.2s;">
							↳ ${link.title}
						</a>
					</li>
				`).join('');
			linksHtml = `
				<div style="margin-bottom: 1rem;">
					<div style="font-weight:bold;color:#d7ba7d;font-size:1.1em;margin-bottom:0.3em;">General</div>
					<ul style="margin:0 0 1em 1.2em;padding:0;color:#9cdcfe;font-size:14px;">
						${generalLinks}
					</ul>
					<div style="font-weight:bold;color:#d7ba7d;font-size:1.1em;margin-bottom:0.3em;">Coding</div>
					<ul style="margin:0 0 1em 1.2em;padding:0;color:#9cdcfe;font-size:14px;">
						${codingLinks}
					</ul>
					<div style="font-weight:bold;color:#d7ba7d;font-size:1.1em;margin-bottom:0.3em;">AI Detectors/Humanizers</div>
					<ul style="margin:0 0 1em 1.2em;padding:0;color:#9cdcfe;font-size:14px;">
						${aiDetectorLinks}
					</ul>
				</div>
			`;
		} else {
			linksHtml = folder.links
				.map(
					(link) => `
    <div style="margin-bottom: 0.5rem;">
      <a href="${link.url}" target="_blank" rel="noopener noreferrer"
         style="
          color: #9cdcfe;
          text-decoration: none;
          font-family: 'Fira Code', monospace;
          font-size: 14px;
          display: block;
          padding-left: 12px;
          cursor: pointer;
          transition: color 0.2s;
         "
         onmouseover="this.style.color='#40a9ff'"
         onmouseout="this.style.color='#9cdcfe'"
      >
        ↳ ${link.title}
      </a>
    </div>
  `
				)
				.join('');
		}

		new WinBox({
			title: `📂 ${folder.name}`,
			width: 800,
			height: 500,
			x: 'center',
			y: 'center',
			background: '#1e1e1e',
			html: `
      <style>
        body {
          margin: 0;
          padding: 0;
          background: #1e1e1e;
          font-family: 'Segoe UI', Arial, sans-serif;
        }
        .vscode-container {
          display: flex;
          height: 100%;
          background: #1e1e1e;
        }
        .sidebar {
          width: 50px;
          background: #333333;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 10px;
        }
        .sidebar-icon {
          width: 24px;
          height: 24px;
          margin: 10px 0;
          filter: invert(70%);
          cursor: pointer;
        }
        .editor-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 10px;
          color:rgb(222, 0, 0);
          position: relative;
          min-height: 0;
        }
        .editor-content {
          flex: 1 1 auto;
          overflow-y: auto;
        }
        .status-bar {
          height: 24px;
          background:rgb(58, 83, 100);
          color: white;
          display: flex;
          align-items: center;
          padding: 0 10px;
          font-size: 12px;
          user-select: none;
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
        }
        a:hover {
          color: #40a9ff !important;
        }
      </style>
      <div class="vscode-container">
        <div class="sidebar">
          <img class="sidebar-icon" src="https://img.icons8.com/material/24/ffffff/file.png" title="" />
          <img class="sidebar-icon" src="https://img.icons8.com/material/24/ffffff/search.png" title="" />
          <img class="sidebar-icon" src="https://img.icons8.com/material/24/ffffff/source-code.png" title="" />
          <img class="sidebar-icon" src="/debug-alt.svg" title="" />
          <img class="sidebar-icon" src="https://img.icons8.com/material/24/ffffff/puzzle.png" title="" />
        </div>
        <div class="editor-area">
          <div class="editor-content">
            ${linksHtml}
          </div>
          <div class="status-bar">${folder.name} • ${folder.links.length} Links</div>
        </div>
      </div>
    `,
		});
	};

	return (
		<div style={styles.vscodeShell}>
			{/* Tabs Bar */}
			<div style={styles.tabBar}>
				{/* Add a tab for Homepage before Website Index */}
				<a
					href="/"
					style={{
						...styles.tabActive,
						marginRight: '4px',
						textDecoration: 'none',
						color: '#d4d4d4',
						backgroundColor: '#252526',
						borderBottom: '1px solid #3c3c3c',
						borderTopLeftRadius: '4px',
						borderTopRightRadius: '4px',
						border: '1px solid #3c3c3c',
						borderBottom: 'none',
						padding: '4px 10px',
						fontSize: '0.85rem',
					}}
				>
					Home
				</a>
				<div style={styles.tabActive}>Website Index</div>
			</div>
			{/* Main content: sidebar (folder buttons) + fake editor */}
			<div style={styles.mainArea}>
				{/* Sidebar */}
				<div style={styles.sidebar}>
					<h3 style={styles.sidebarHeading}>📁 Folders</h3>
					{linkFolders.map((folder, i) => (
						<button
							key={i}
							style={styles.vscodeButton}
							onClick={() => openFolderWindow(folder)}
						>
							 {folder.name}
						</button>
					))}
				</div>

				{/* Fake editor preview */}
				<div style={styles.editorPreview}>
					<pre style={styles.code}>
						<span style={{ color: '#6A9955' }}>// Click a folder to open a window</span>
						{'\n'}
						{linkFolders
							.slice()
							.sort((a, b) => a.name.localeCompare(b.name))
							.map(folder => (
								<React.Fragment key={folder.name}>
									<span style={{ color: '#b5cea8' }}>
										// {folder.name}
									</span>
									{'\n'}
									{folder.links
										.slice()
										.sort((a, b) => a.title.localeCompare(b.title))
										.map(link => (
											<span key={link.title}>
												<span style={{ color: '#569CD6' }}>-</span>{' '}
												<a
													href={link.url}
													target="_blank"
													rel="noopener noreferrer"
													style={{
														color: '#9CDCFE',
														textDecoration: 'none',
														transition: 'color 0.2s',
													}}
												>
													{link.title}
												</a>
												{'\n'}
											</span>
										))}
								</React.Fragment>
							))}
					</pre>
				</div>
			</div>
		</div>
	);
}

const styles = {
	vscodeShell: {
		display: 'flex',
		flexDirection: 'column',
		height: '100vh',
		backgroundColor: '#1e1e1e',
		fontFamily: `'Fira Code', monospace`,
		color: '#d4d4d4',
	},

	titleBar: {
		height: '32px',
		backgroundColor: '#3c3c3c',
		display: 'flex',
		alignItems: 'center',
		padding: '0 12px',
		color: '#ccc',
		fontSize: '0.85rem',
	},

	titleText: {
		fontWeight: 'normal',
	},

	tabBar: {
		height: '28px',
		backgroundColor: '#252526',
		display: 'flex',
		alignItems: 'center',
		paddingLeft: '8px',
		borderBottom: '1px solid #3c3c3c',
	},

	tabActive: {
		backgroundColor: '#1e1e1e',
		padding: '4px 10px',
		border: '1px solid #3c3c3c',
		borderBottom: 'none',
		borderTopLeftRadius: '4px',
		borderTopRightRadius: '4px',
		fontSize: '0.85rem',
		color: '#d4d4d4',
	},

	mainArea: {
		display: 'flex',
		flex: 1,
		overflow: 'hidden',
	},

	sidebar: {
		width: '240px',
		backgroundColor: '#252526',
		padding: '1rem',
		borderRight: '1px solid #3c3c3c',
		display: 'flex',
		flexDirection: 'column',
		gap: '0.5rem',
	},

	sidebarHeading: {
		fontSize: '1rem',
		color: '#ccc',
		marginBottom: '0.5rem',
	},

	editorPreview: {
		flex: 1,
		padding: '1.5rem',
		overflow: 'auto',
	},


	code: {
		background: '#1e1e1e',
		padding: '1rem',
		border: '1px solid #3c3c3c',
		borderRadius: '4px',
		whiteSpace: 'pre-wrap',
		fontSize: '0.95rem',
		lineHeight: '1.5',
	},
	vscodeButton: {
		padding: '0.75rem 1rem',
		backgroundColor: '#1e1e2e',
		color: '#d4d4d4',
		border: '1px solid #3c3c3c',
		borderRadius: '4px',
		fontSize: '0.9rem',
		textAlign: 'left',
		cursor: 'pointer',
		transition: 'background 0.2s, transform 0.1s',
		outline: 'none',
	},
};

