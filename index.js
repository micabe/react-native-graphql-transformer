const semver = require('semver');

let upstreamTransformer = null;

const reactNativeVersionString = require('react-native/package.json').version;

const metroVersion = semver(require('metro/package.json').version).minor;

const reactNativeMinorVersion = semver(reactNativeVersionString).minor;

if (metroVersion >= 51) {
  upstreamTransformer = require('metro-react-native-babel-transformer/src/index');
} else if (reactNativeMinorVersion >= 56) {
  upstreamTransformer = require('metro/src/reactNativeTransformer');
} else if (reactNativeMinorVersion >= 52) {
  upstreamTransformer = require('metro/src/transformer');
} else if (reactNativeMinorVersion >= 0.47) {
  upstreamTransformer = require('metro-bundler/src/transformer');
} else if (reactNativeMinorVersion === 0.46) {
  upstreamTransformer = require('metro-bundler/build/transformer');
} else {
  // handle RN <= 0.45
  const oldUpstreamTransformer = require('react-native/packager/transformer');
  upstreamTransformer = {
    transform({ src, filename, options }) {
      return oldUpstreamTransformer.transform(src, filename, options);
    },
  };
}

const useTemplate = source => [
  JSON.stringify(source)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029'),
];

const literal = (strings, ...values) =>
  strings
    .map((string, i) => string + (values[i] || ''))
    .join('')
    .trim();

function transform(src, filename, options) {
  if (typeof src === 'object') {
    // handle RN >= 0.46
    ({ src, filename, options } = src);
  }

  // Do custom transformations
  let result = src;
  if (filename.endsWith('.gql') || filename.endsWith('.graphql')) {
    result = 'module.exports = ' + literal(useTemplate(result));
  }

  const babelCompileResult = upstreamTransformer.transform({
    src: result,
    filename,
    options,
  });

  // Pass the transformed source to the original react native transformer
  return babelCompileResult;
}

module.exports.transform = transform;
