const express = require('express')
const mongoose = require('mongoose')
const { port , connectionKey } = require('./config')


const connectDB = async ( connectionKey ) => {
    try {
        await mongoose.connect(connectionKey)
        console.log('Connection to mongodb successful ✅')
    } catch(e) {
        console.error("Connection to mongodb failed ❌")
        console.error(e)
    }
}



const app = express()
app.use(express.json())
app.use('/api/lang',require('./Routes/lang'));
// connectDB( connectionKey )
const server = app.listen(port , ()=>console.log(`API 🚀 on port ${port}`))
server.addListener("error",(err)=>{
    console.error(" 💥 SERVER CRASHED 💥 " )
    console.error( err )
})

const topicCache = new Map()





 