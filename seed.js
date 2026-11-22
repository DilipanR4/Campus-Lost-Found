const User = require('./models/User');
const { Item } = require('./models/Item');

const defaultUsers = [
  {
    username: 'student1',
    password: 'student123',
    role: 'student',
    name: 'Student User'
  },
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Campus Administrator'
  }
];

const defaultItems = [
  {
    type: 'lost',
    title: 'Black Water Bottle',
    category: 'Other',
    description: 'Matte black bottle with a small silver sticker near the lid.',
    location: 'Central Library - 2nd floor',
    date: '2026-09-08',
    contact: 'library.help@campus.edu',
    ownerUsername: 'student1',
    ownerName: 'Student User',
    status: 'returned'
  },
  {
    type: 'found',
    title: 'Student ID Card',
    category: 'ID Card',
    description: 'Student ID card found near the main auditorium entrance.',
    location: 'Main Auditorium',
    custodyLocation: 'Campus Security Desk',
    date: '2026-09-09',
    contact: 'security@campus.edu',
    ownerUsername: 'admin',
    ownerName: 'Campus Administrator',
    status: 'returned'
  },
  {
    type: 'lost',
    title: 'Blue Notebook',
    category: 'Books',
    description: 'A5 ruled notebook with a blue cover and initials written inside.',
    location: 'Engineering Block - Room 204',
    date: '2026-09-07',
    contact: 'student.services@campus.edu',
    ownerUsername: 'student1',
    ownerName: 'Student User',
    status: 'active'
  },
  {
    type: 'found',
    title: 'Wireless Earbuds Case',
    category: 'Electronics',
    description: 'White magnetic charging case found on bench outside Cafeteria.',
    location: 'Campus Cafeteria Entrance',
    custodyLocation: 'Central Library Front Desk',
    date: '2026-09-10',
    contact: 'canteen.desk@campus.edu',
    ownerUsername: 'admin',
    ownerName: 'Campus Administrator',
    status: 'active'
  }
];

async function seedDatabase() {
  try {
    // 1. Seed users if not exists
    for (const userData of defaultUsers) {
      const existing = await User.findOne({ username: userData.username });
      if (!existing) {
        await User.create(userData);
        console.log(`\x1b[34mℹ Seeded demo user: ${userData.username} (${userData.role})\x1b[0m`);
      }
    }

    // 2. Seed items if empty
    const itemCount = await Item.countDocuments();
    if (itemCount === 0) {
      await Item.insertMany(defaultItems);
      console.log(`\x1b[34mℹ Seeded ${defaultItems.length} default campus lost & found items\x1b[0m`);
    }
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
}

module.exports = { seedDatabase };
