const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Patch: @expo/metro-runtime@4.0.1 messageSocket.native crashes in Expo Go
// due to ESM/CJS interop issues with metro@0.83.3. Replace with a no-op stub
// since we don't use RSC (React Server Components).
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const origin = (context.originModulePath || '').replace(/\\/g, '/');
  const isFromExpoMetroRuntime =
    origin.includes('@expo/metro-runtime') ||
    origin.includes('@expo+metro-runtime');

  if (
    isFromExpoMetroRuntime &&
    (moduleName === './messageSocket' || moduleName.endsWith('/messageSocket'))
  ) {
    return {
      type: 'sourceFile',
      filePath: path.resolve(projectRoot, 'patches/messageSocket.native.js'),
    };
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
