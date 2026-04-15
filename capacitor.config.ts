import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kzpm.rxfinance',
  appName: 'Rx Finance',
  webDir: 'out',
  server: {
    url: 'http://192.168.96.203:3002',
    cleartext: true
  }
};

export default config;
