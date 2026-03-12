// Patch: wraps RN's getDevServer to handle ESM default export interop.
// @expo/metro-runtime@4.0.1 uses require() on an ESM default export,
// which returns { default: fn } instead of fn directly in newer metro.
'use strict';
const m = require('react-native/Libraries/Core/Devtools/getDevServer');
const fn = m && m.__esModule ? m.default : m;
module.exports = fn;
module.exports.default = fn;
