const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Lead = require('./models/Lead');
const LeadSource = require('./models/LeadSource');
const faker = require('faker');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to DB');

    await User.deleteMany({});
    await Lead.deleteMany({});
    await LeadSource.deleteMany({});

    const admin = new User({
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      first_name: 'Admin',
      last_name: 'User',
    });
    await admin.save();

    const employees = [];
    for (let i = 1; i <= 3; i++) {
      const employee = new User({
        email: `employee${i}@test.com`,
        password: 'password123',
        role: 'employee',
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
      });
      await employee.save();
      employees.push(employee);
    }

    const sources = ['website', 'facebook_ads', 'google_ads', 'referral', 'events', 'other'];
    for (const name of sources) {
      await new LeadSource({ name }).save();
    }

    for (let i = 0; i < 150; i++) {
      const lead = new Lead({
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.phoneNumber(),
        company: faker.company.companyName(),
        city: faker.address.city(),
        state: faker.address.state(),
        source: sources[Math.floor(Math.random() * sources.length)],
        status: ['new', 'contacted', 'qualified', 'lost', 'won'][Math.floor(Math.random() * 5)],
        score: Math.floor(Math.random() * 101),
        lead_value: Math.floor(Math.random() * 10000),
        last_activity_at: faker.date.recent(),
        is_qualified: Math.random() > 0.5,
        assigned_to: Math.random() > 0.5 ? employees[Math.floor(Math.random() * employees.length)]._id : null,
        created_by: admin._id,
        created_at: faker.date.past(),
      });
      await lead.save();
    }

    console.log('Data seeded successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Seeding error:', err);
    process.exit(1);
  });