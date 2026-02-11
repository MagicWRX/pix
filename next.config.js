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
if (!hasPackage('@magicwrx/auth-tool')) {
	turbopackResolveAlias['@magicwrx/auth-tool'] = path.resolve(
		__dirname,
		'src/vendor/magicwrx-auth-tool.tsx'
	);
}

if (!hasPackage('@magicwrx/stripe-tool')) {
	turbopackResolveAlias['@magicwrx/stripe-tool'] = path.resolve(
		__dirname,
		'src/vendor/magicwrx-stripe-tool.tsx'
	);
}

const nextConfig = {
	turbopack: {
		resolveAlias: turbopackResolveAlias,
	},
	webpack: (config) => {
		config.resolve = config.resolve || {};
		config.resolve.alias = config.resolve.alias || {};

		// Fallback stubs when @magicwrx packages are not installed (e.g. missing NPM_TOKEN)
		if (!hasPackage('@magicwrx/auth-tool')) {
			config.resolve.alias['@magicwrx/auth-tool'] = path.resolve(
				__dirname,
				'src/vendor/magicwrx-auth-tool.tsx'
			);
		}

		if (!hasPackage('@magicwrx/stripe-tool')) {
			config.resolve.alias['@magicwrx/stripe-tool'] = path.resolve(
				__dirname,
				'src/vendor/magicwrx-stripe-tool.tsx'
			);
		}

		return config;
	},
};

module.exports = nextConfig;
