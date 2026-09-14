const fs = require('fs');
const path = require('path');

const headerPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-svg',
  'common',
  'cpp',
  'react',
  'renderer',
  'components',
  'rnsvg',
  'RNSVGImageShadowNode.h'
);

const cppPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-svg',
  'common',
  'cpp',
  'react',
  'renderer',
  'components',
  'rnsvg',
  'RNSVGImageShadowNode.cpp'
);

if (fs.existsSync(headerPath)) {
  let content = fs.readFileSync(headerPath, 'utf8');
  if (content.includes('{imageSource, nullptr, {}}')) {
    content = content.replace('{imageSource, nullptr, {}}', '{imageSource, nullptr}');
    fs.writeFileSync(headerPath, content, 'utf8');
    console.log('[patch-rnsvg] Successfully patched RNSVGImageShadowNode.h for React Native 0.77 Fabric compatibility');
  } else {
    console.log('[patch-rnsvg] RNSVGImageShadowNode.h already patched or pattern not found.');
  }
} else {
  console.log('[patch-rnsvg] RNSVGImageShadowNode.h not found at:', headerPath);
}

if (fs.existsSync(cppPath)) {
  let content = fs.readFileSync(cppPath, 'utf8');
  if (content.includes('imageManager_->requestImage(imageSource, getSurfaceId())')) {
    content = content.replace(
      'imageManager_->requestImage(imageSource, getSurfaceId())',
      'imageManager_ ? imageManager_->requestImage(imageSource, getSurfaceId()) : ImageRequest{imageSource, nullptr}'
    );
    fs.writeFileSync(cppPath, content, 'utf8');
    console.log('[patch-rnsvg] Successfully patched RNSVGImageShadowNode.cpp with null-safe ImageManager request');
  } else {
    console.log('[patch-rnsvg] RNSVGImageShadowNode.cpp already patched or pattern not found.');
  }
}
