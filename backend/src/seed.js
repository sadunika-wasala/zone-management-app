const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/Employee');
const Customer = require('./models/Customer');
const Task = require('./models/Task');

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Employee.deleteMany({});
    await Customer.deleteMany({});
    await Task.deleteMany({});
    console.log('Existing data cleared.');

    // 1. Create Zonal Manager
    const zonalManager = await Employee.create({
      nic: '198012345678',
      name: 'Mr. Zonal Manager',
      email: 'zonal.manager@aia.lk',
      password: 'adminpassword123', // Will be hashed pre-save
      telephone: '+94 77 123 4567',
      address: 'No. 45, Galle Road, Colombo 03',
      position: 'Zonal Manager',
      status: 'Active',
    });
    console.log('Created Zonal Manager:', zonalManager.email);

    // 2. Create Branch Manager
    const branchManager = await Employee.create({
      nic: '198587654321',
      name: 'Saman Perera',
      email: 'saman.bm@aia.lk',
      password: 'password123',
      telephone: '+94 71 987 6543',
      address: 'No. 12, Kandy Road, Kurunegala',
      position: 'Branch Manager',
      status: 'Active',
    });
    console.log('Created Branch Manager:', branchManager.email);

    // 3. Create Unit Leader (associated with Branch Manager)
    const unitLeader = await Employee.create({
      nic: '199023456789',
      name: 'Nirmala Silva',
      email: 'nirmala.ul@aia.lk',
      password: 'password123',
      telephone: '+94 72 345 6789',
      address: 'No. 88, Lake Round, Kandy',
      position: 'Unit Leader',
      status: 'Active',
      manager: branchManager._id,
    });
    console.log('Created Unit Leader:', unitLeader.email);

    // 4. Create Advisors (associated with Unit Leader and Branch Manager)
    const advisor1 = await Employee.create({
      nic: '199534567890',
      name: 'Amal Fernando',
      email: 'amal.adv@aia.lk',
      password: 'password123',
      telephone: '+94 77 765 4321',
      address: 'No. 5, Beach Road, Negombo',
      position: 'Advisor',
      status: 'Active',
      manager: branchManager._id,
      leader: unitLeader._id,
    });

    const advisor2 = await Employee.create({
      nic: '199845678901',
      name: 'Ruwan Kumara',
      email: 'ruwan.adv@aia.lk',
      password: 'password123',
      telephone: '+94 76 112 2334',
      address: 'No. 102, Peradeniya Road, Kandy',
      position: 'Advisor',
      status: 'Active',
      manager: branchManager._id,
      leader: unitLeader._id,
    });
    console.log('Created Advisors:', advisor1.email, 'and', advisor2.email);

    // 5. Create some Customer records
    const customer1 = await Customer.create({
      nic: '196512345678',
      name: 'Kamal Jayawardena',
      address: 'No. 14, Temple Road, Kandy',
      policyAmount: 500000,
      assignedAdvisor: advisor1._id,
    });

    const customer2 = await Customer.create({
      nic: '197287654321',
      name: 'Sunethra Wijesinghe',
      address: 'No. 32, Katugastota, Kandy',
      policyAmount: 1200000,
      assignedAdvisor: advisor1._id,
    });

    const customer3 = await Customer.create({
      nic: '198898765432',
      name: 'Roshan Ranasinghe',
      address: 'No. 67, Gampola Road, Peradeniya',
      policyAmount: 750000,
      assignedAdvisor: advisor2._id,
    });
    console.log('Created customer records.');

    // 6. Create some initial Tasks
    const task1 = await Task.create({
      title: 'Complete Monthly Sales Target',
      description: 'Ensure the Kandy branch completes at least 2 million in policy valuations this month.',
      assignedTo: branchManager._id,
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-07-31'),
      status: 'In Progress',
      assignedBy: zonalManager._id,
    });

    const task2 = await Task.create({
      title: 'Follow up on Kamal Jayawardena renewal',
      description: 'Kamal’s insurance policy is due for renewal next week. Contact him and complete the process.',
      assignedTo: advisor1._id,
      startDate: new Date('2026-07-15'),
      endDate: new Date('2026-07-22'),
      status: 'To Do',
      assignedBy: zonalManager._id,
    });

    const task3 = await Task.create({
      title: 'Recruit 2 New Advisors',
      description: 'Recruit two sub-advisors for the unit and schedule their induction program.',
      assignedTo: unitLeader._id,
      startDate: new Date('2026-07-10'),
      endDate: new Date('2026-08-10'),
      status: 'To Do',
      assignedBy: zonalManager._id,
    });
    console.log('Created tasks.');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
