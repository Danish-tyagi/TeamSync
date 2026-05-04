import mongoose from 'mongoose'
import dns from 'dns'

// had to add this because mongodb srv wasnt resolving on my windows machine
// stackoverflow said to set google dns so trying that
dns.setServers(['8.8.8.8', '8.8.4.4'])

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI!)
    console.log('MongoDB connected:', conn.connection.host)
  } catch (err) {
    console.error('MongoDB connection failed:', err)
    process.exit(1)
  }
}

export default connectDB
