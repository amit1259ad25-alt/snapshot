const mongoose = require("mongoose")


const connectDB = async ()=>{
    await mongoose.connect(process.env.MONGO_URL)
    console.log(`connected to the ${process.env.DatabaseName} database successfully !`);
    
}

module.exports = connectDB;