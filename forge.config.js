module.exports = {
  packagerConfig: {
    asar: true,
    name: 'WP SQL',
    executableName: 'wp-sql',
    icon: './assets/icons/icon',
    appBundleId: 'com.wp-sql.app',
    appCategoryType: 'public.app-category.developer-tools',
    protocols: [
      {
        name: 'WP SQL',
        schemes: ['wp-sql']
      }
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'wp-sql',
        icon: './assets/icons/icon.ico',
        setupIcon: './assets/icons/icon.ico'
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux'],
      config: {
        icon: './assets/icons/icon.icns'
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: './assets/icons/icon.png',
          name: 'wp-sql',
          productName: 'WP SQL',
          categories: ['Development']
        }
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          icon: './assets/icons/icon.png',
          name: 'wp-sql',
          productName: 'WP SQL',
          categories: ['Development']
        }
      },
    },
    {
      name: '@electron-forge/maker-wix',
      config: {
        language: 1033,
        manufacturer: 'Jonathan Bossenger',
        icon: './assets/icons/icon.ico',
        ui: {
          chooseDirectory: true
        }
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        universal: true
      }
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {}
    }
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'jonathanbossenger',
          name: 'wp-sql'
        },
        prerelease: false
      }
    }
  ]
};
