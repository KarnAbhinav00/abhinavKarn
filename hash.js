const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter password to hash: ', (password) => {
  if (!password) {
    console.error('Password cannot be empty.');
    rl.close();
    process.exit(1);
  }

  bcrypt.genSalt(12, (err, salt) => {
    if (err) throw err;
    bcrypt.hash(password, salt, (err, hash) => {
      if (err) throw err;
      console.log('\n==================================================');
      console.log('Password Hash generated successfully!');
      console.log('Copy the hash below and paste it in your .env file:');
      console.log('==================================================\n');
      console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
      rl.close();
    });
  });
});
