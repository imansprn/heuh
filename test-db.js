const { WebhookSource, Destination } = require('./models');

async function runTest() {
  try {
    // 1. Bikin Destinasi (Grup Chat Pribadi Lo)
    const dest = await Destination.create({
      name: 'intern-test-chat',
      type: 'google-chat',
      url: 'https://chat.googleapis.com/v1/spaces/AAQARon4d3E/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=TPMis78yKtnNwl0nmy2GWkPSrMKgx7_kqIQgmtdHiGI', // Pake URL asli lo
      enabled: true
    });

    // 2. Bikin Source (Repo GitHub lo) dan langsung sambungin ke Destinasi tadi
    const source = await WebhookSource.create({
      name: 'rf-memory-scanner',
      type: 'github',
      secret: 'abc1',
      isActive: true,
      destinationId: dest.id // <--- INI PENGHUBUNGNYA!
    });

    console.log(`✅ Berhasil! Repo ${source.name} sekarang lapor ke ${dest.name}`);
    process.exit();
  } catch (err) {
    console.error('Error nih bro:', err);
  }
}

runTest();