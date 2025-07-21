// Import Sequelize library
const { Sequelize } = require('sequelize');

// Database connection configuration
const sequelize = new Sequelize(
    'momisdb',
    'momis_user', // نام کاربری اپلیکیشن
    '76304333(Mk)', // رمز عبور اپلیکیشن
    {
        host: 'localhost',
        dialect: 'mysql',
        logging: false,
    }
);
// Test the database connection
sequelize.authenticate()
    .then(() => {
        console.log('Connection to the database has been established successfully.');
    })
    .catch((error) => {
        console.error('Unable to connect to the database:', error);
    });

// Export the sequelize instance for use in other parts of the application
module.exports = sequelize;