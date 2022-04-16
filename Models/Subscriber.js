const mongoose = require('mongoose');


const SubscriberSchema = new mongoose.Schema({
    email: {
        type: String, 
        required: [true , "email required for subscriber"],
    },
    subscriptionType: { 
        type: Number,
        default: 0,
    },
    apiKey: {
        type: String,
        default: null,
    },
    

});


//gets the permissions of the 
SubscriberSchema.methods.getPermissions = function( action ){
    if(!this.apiKey) return null
    
    switch(this.subscriptionType){
        //free subscription
        case 0: 
            return {
                viewsPerDay: 5,
            }
    }

    
}

//helper to get 




const Subscriber = mongoose.Model("Subscriber",SubscriberSchema);
module.exports = Subscriber;