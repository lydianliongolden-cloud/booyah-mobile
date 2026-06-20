const fs = require('fs');
const creds = {
  ios: {
    provisioningProfilePath: './profile.mobileprovision',
    distributionCertificate: {
      path: './distribution.p12',
      password: process.env.CERT_PASS || ''
    }
  }
};
fs.writeFileSync('credentials.json', JSON.stringify(creds, null, 2));
console.log('credentials.json written');
