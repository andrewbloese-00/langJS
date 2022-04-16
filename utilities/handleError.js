
/**
 * 
 * @param {*} res 
 * @param {*} error 
 * @param {*} status 
 */

const handleError = ( res , error , status ) => { 
    res.status(status).json({
        success: false , 
        message: String(error) , 
        error: error ,
    })
}

module.exports = {handleError};