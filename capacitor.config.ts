import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chemosense.app',
  appName: 'ChemoSense',
  webDir: 'dist/client',
  server: {
    url: 'https://chemosense-app.onrender.com',
    cleartext: false
  }
};

export default config;
