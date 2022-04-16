//routing
const router = require('express').Router();

const  { getGoogleSearchLinks , summarizeText , getFrequencyTable, normalizeFrequencyTable ,  scrapeUrl  } = require('../utilities/lang');
//utils
const { handleError } = require('../utilities/handleError')

const success = ( res , status , payload ) => { 
    return res.status(status).json({
        success: true,
        data: payload,
    })

}



//init cache 
const frequencyCache = new Map()
const normalFrequencyCache = new Map();




/**
 * route /api/lang/frequency
 * description: 
 *  responds with an object containing each word as a key with that word's frequency as that key's value
 */

router.post('/frequency', ( req , res ) => { 
    const { text } = req.body;
    
    if(frequencyCache.has(text)){
        console.log('had cache!')
        return success( res , 200 , frequencyCache.get(text) );
    }


    if(!text) return handleError( res , new Error("No text provided. Invalid Request.", 401));

    let result = {};

    getFrequencyTable( text ).forEach( ( value , key ) => { 
        result[key] = value;
    })

    frequencyCache.set( text , result );
    console.log('new cache')
    console.log( frequencyCache )
    
    
    success(res , 200 , result )
})


/**
 * route /api/lang/frequency
 * description: 
 *  responds with an object containing each word as a key with that word's normalized frequency as that key's value
 */
router.post('/frequency_normalized' , ( req , res ) => { 
    const text = req.body.text;
    if(normalFrequencyCache.has(text)){
        const result = normalFrequencyCache.get(text)
        console.log('had cache!')
        return success( res , 200 , result )
    }
    const frequencyTable = getFrequencyTable( text );
    const normalizedTable = normalizeFrequencyTable( frequencyTable )
    let result = {}
    normalizedTable.forEach( ( v , k ) => {result[k] = v} )
    
    
    
    success(res , 200 , result )
});

/**
 * route /api/lang/topwords
 * description: 
 *  responds with an array containing the top "n" scoring words from a given text
 */
router.post('/topwords' , ( req , res ) => { 
    const { n , text } = req.body; 
    
    const Word = ( word , freq ) => ({
        word: word , 
        frequency: freq
    })
    
    const result = []; 
    
    //sort the frequency table by highest score
    const frequencyTable = getFrequencyTable( text );
    if(!frequencyTable) return "Failed to get frequency table"

    
    
    const unsorted = [...frequencyTable];
    const sorted = new Map( unsorted.sort(([key1,val1],[key2,val2])=> (val2 - val1)) );
    
    //determine max iterations
    let max_iterations = 0;
    (n > sorted.size)
        ? max_iterations = sorted.size
        : max_iterations = n       

    sorted.forEach( ( frequency , word ) => { 
        //if we have reached max iteration then return success response with built result
        if( result.length >= max_iterations) return success( res , 200 , result );
        const wordEntry = Word( word , frequency )
        result.push( wordEntry );
    });
});

router.post('/summarize' , ( req , res ) => { 
    const { text , reduceTo } = req.body 
    if( !text || !reduceTo ) return handleError( res , new Error('Invalid format. Must provide text and length in body'), 401);

    const summary = summarizeText( text , reduceTo )
    let result = "";

    summary.forEach( sent => result += sent.text )

    //return a joined version of the summary and the scored version
    success( res , 200 , { list: summary, text: result })
    
})


router.post('/topic', ( req , res ) => { 
    const startTime = new Date();

    
    const { topic , n , reduceTo } = req.body;
    
    let N = n || 10

    const jobs=[];
    getGoogleSearchLinks( topic , N ).then((results) => {
        results.forEach(url=>jobs.push(scrapeUrl(url)))
    })
    .catch(e=>{handleError(res , e , 500)})
    .finally(()=>{
        Promise.all( jobs )
            .then( ( vals ) => {
                const text = vals.join("\n")
                const summary = summarizeText( text , reduceTo )
                
                
                const completedTime = Number(new Date().getTime()) - Number(startTime.getTime());
                console.log('topic request completed in ' +( completedTime ) + 'ms');
                
                
                success( res, 200 , summary )

            }).catch( e => handleError( res , e , 500 ));
    })
});




module.exports = router