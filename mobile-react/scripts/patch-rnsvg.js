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

const layoutCppPath = path.join(
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
  'RNSVGLayoutableShadowNode.cpp'
);

if (fs.existsSync(layoutCppPath)) {
  let content = fs.readFileSync(layoutCppPath, 'utf8');
  if (content.includes('yoga::StyleSizeLength::')) {
    content = content.replace(/yoga::StyleSizeLength::/g, 'yoga::StyleLength::');
    fs.writeFileSync(layoutCppPath, content, 'utf8');
    console.log('[patch-rnsvg] Successfully patched RNSVGLayoutableShadowNode.cpp (StyleSizeLength -> StyleLength for Yoga 3 / RN 0.77)');
  } else {
    console.log('[patch-rnsvg] RNSVGLayoutableShadowNode.cpp already patched or pattern not found.');
  }
} else {
  console.log('[patch-rnsvg] RNSVGLayoutableShadowNode.cpp not found at:', layoutCppPath);
}

// Enforce 16 KB page alignment for react-native-screens (librnscreens.so) for Android 15+
const screensCMakePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-screens',
  'android',
  'CMakeLists.txt'
);

if (fs.existsSync(screensCMakePath)) {
  let content = fs.readFileSync(screensCMakePath, 'utf8');
  if (!content.includes('max-page-size=16384')) {
    const patch = `
# Enforce 16 KB page alignment for Android 15+
target_link_options(rnscreens PRIVATE "-Wl,-z,max-page-size=16384")
set_property(TARGET rnscreens APPEND_STRING PROPERTY LINK_FLAGS " -Wl,-z,max-page-size=16384")
`;
    content = content.replace(
      'set_target_properties(rnscreens PROPERTIES',
      patch + '\nset_target_properties(rnscreens PROPERTIES'
    );
    fs.writeFileSync(screensCMakePath, content, 'utf8');
    console.log('[patch-modules] Successfully patched react-native-screens CMakeLists.txt with 16 KB page alignment');
  } else {
    console.log('[patch-modules] react-native-screens CMakeLists.txt already contains 16 KB alignment');
  }
} else {
  console.log('[patch-modules] react-native-screens CMakeLists.txt not found at:', screensCMakePath);
}

const screensGradlePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-screens',
  'android',
  'build.gradle'
);

if (fs.existsSync(screensGradlePath)) {
  let content = fs.readFileSync(screensGradlePath, 'utf8');
  if (!content.includes('max-page-size=16384')) {
    content = content.replace(
      '"-DANDROID_STL=c++_shared",',
      '"-DANDROID_STL=c++_shared",\n                        "-DCMAKE_SHARED_LINKER_FLAGS=-Wl,-z,max-page-size=16384",'
    );
    fs.writeFileSync(screensGradlePath, content, 'utf8');
    console.log('[patch-modules] Successfully patched react-native-screens build.gradle with 16 KB linker flags');
  } else {
    console.log('[patch-modules] react-native-screens build.gradle already contains 16 KB alignment');
  }
} else {
  console.log('[patch-modules] react-native-screens build.gradle not found at:', screensGradlePath);
}


