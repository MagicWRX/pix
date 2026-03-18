/** @type {import('next').NextConfig} */
const path = require('path');

function hasPackage(packageName) {
	try {
		require.resolve(packageName);
		return true;
	} catch {
		return false;
	}
}

const turbopackResolveAlias = {};
if (!hasPackage('@magicwrxtools/auth-tool')) {
	turbopackResolveAlias['@magicwrxtools/auth-tool'] = path.resolve(
		__dirname,
		'src/vendor/magicwrx-auth-tool.tsx'
	);
}

if (!hasPackage('@magicwrxtools/stripe-tool')) {
	turbopackResolveAlias['@magicwrxtools/stripe-tool'] = path.resolve(
		__dirname,
		'src/vendor/magicwrx-stripe-tool.tsx'
	);
}

/** Auto-discover all installed @magicwrxtools/* packages — prevents list drift. */
function getMagicWrxPackages() {
  const dir = path.join(__dirname, 'node_modules', '@magicwrxtools');
  try {
    return require('fs').readdirSync(dir).filter((n) => !n.startsWith('.')).map((n) => `@magicwrxtools/${n}`);
  } catch { return []; }
}

const nextConfig = {
        transpilePackages: getMagicWrxPackages(),
	turbopack: {
		resolveAlias: turbopackResolveAlias,
	},
	webpack: (config) => {
		config.resolve = config.resolve || {};
		config.resolve.alias = config.resolve.alias || {};

		// Fallback stubs when @magicwrx packages are not installed (e.g. missing NPM_TOKEN)
		if (!hasPackage('@magicwrxtools/auth-tool')) {
			config.resolve.alias['@magicwrxtools/auth-tool'] = path.resolve(
				__dirname,
				'src/vendor/magicwrx-auth-tool.tsx'
			);
		}

		if (!hasPackage('@magicwrxtools/stripe-tool')) {
			config.resolve.alias['@magicwrxtools/stripe-tool'] = path.resolve(
				__dirname,
				'src/vendor/magicwrx-stripe-tool.tsx'
			);
		}

		return config;
	},
};

module.exports = nextConfig;
