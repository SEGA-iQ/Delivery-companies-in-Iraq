const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
    restaurantName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    customerNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    orderPrice: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    orderDigits: {
        type: DataTypes.STRING
    },
    note: {
        type: DataTypes.TEXT
    },
    serviceFee: {
        type: DataTypes.FLOAT,
        defaultValue: 500
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending'
    }
});

module.exports = Order;