const natural = require('natural');
const axios = require('axios');
const puppeteer = require('puppeteer');




const STOPWORDS = [ 
    'after','became', 'nobody', 'ours', 'throughout', 'five','nine', 'whereupon',
    'ever', 'often', 'back', 'several','has', 'alone', 'under','formerly', 'much',
    'side','who', 'your', 'whence','thus', 'never', 'her', 'always', 'first',
    'through','whereby', 'unless', 'yourselves','quite', 'whereafter', 'not',
    'same', 'down', 'n’t','a', 'nevertheless', 'they','elsewhere', 'beside', 'it',
    'n‘t', 'here', 'during', 'anywhere', 'sixty', 'neither','re', 'hundred', 'of', '’m','own', 'moreover', 'put','even', 'whatever', 'some','myself', 'whenever', 'beyond','behind', 'anyone', 'everywhere','hers', 'next', '’d', 'regarding','therefore', 'already', 'among','seemed', 'show', 'his','bottom', 'go', 'seem', 'their', 'so', 'perhaps', 'hereby', 'becomes', 'over', "'m",'had', 'is', 'anything','somewhere', 'we', 'along','empty', 'used', 'either', 'four', 'front', 'two', 'are', 'thereby', 'someone','hereupon', 'about', 'whose', 'beforehand', 'everything', 'both', 'from', 'any', 'indeed', 'could', 'within', 'which',"'d", 'because', 'why','take', 'did', 'be', 'doing', 'being', 'via', 'whom', '‘re', 'one','various', 'everyone', 'however', 'well', 'top', '‘ve', 'none', 'hereafter', 'few','yet', 'when', 'that','’ve', 'last', '’ll', 'sometimes', 'others', 'serious', 'an', 'eight', 'thru', 'although','call', 'then', 'herself', 'those', 'and', 'us', 'nowhere', 'else', 'forty',"'ve", 'otherwise', 'does','he', 'ten', 'twenty', 'the', 'really', 'its', 'per', 'might', 'thence', 'no', 'this', 'by', 'see', 'third', 'i', 'was', 'below', 'cannot', 'thereafter', 'due', 'noone', 'them', 'together', 'something', 'least', 'himself', 'hence', 'please', "'re", 'except', 'sometime', 'each', "'ll", 'twelve', 'part', 'will', 'every', 'you', 'rather', 'themselves', 'eleven', 'whether', 'six', 'just', 'she', 'becoming', 'up', 'towards', 'across', 'until', 'nothing', 'amongst', 'in', 'around', 'somehow', 'make', 'where', 'without', '’re', 'besides', 'using', 'such', 'than', 'wherein', 'whither', 'am', 'thereupon', 'seeming', 'therein', 'our', 'before', 'too', 'latterly', 'or', 'against', 'become', 'can', 'between', 'give', 'also', 'above', 'into', 'nor', '‘d', 'meanwhile', 'latter', 'another', 'three', 'to', 'afterwards', 'do', '‘ll', 'there', 'herein', 'whoever', 'namely', 'would', 'with', 'me', 'upon', 'anyhow', 'less', 'most', '‘m', 'itself', 'still', 'how', 'at', 'off', 'say', 'other', 'must', 'him', 'what', 'should', 'for', 'were', 'been', 'again', 'now', 'may', "n't", 'onto', 'almost', 'anyway', 'mostly', 'all', 'fifteen', 'on', 'but', 'name', 'mine', '’s', 'move', 'fifty', 'ca', 'toward', '‘s', 'out', 'former', 'done', 'seems', 'as', 'wherever', 'whole', 'made', 'once', 'have', 'amount', 'get', 'my', 'since', 'whereas', 'many', 'yours', 'though', 'very', "'s", 'only', 'more', 'yourself', 'these', 'full', 'while', 'enough', 'if', 'further', 'keep', 'ourselves'
];

const removeBracketNums = text => text.replace(/([^[]+(?=]))/g,"").replace(/\[.*?\]/g,"")


const getFrequencyTable = ( text ) => { 
    const punctuation = ", . / ? \" ; : ! \n".split(" ");
    const WordFrequencies = new Map();

    //get all words in text and put them to lower case
    const words = text.split(" ").map(word => word.toLowerCase());
    words.forEach( ( word ) => { 
        if(!STOPWORDS.includes(word)){ //if the word isn't a stop word
            if( !punctuation.includes( word ) ) { //if the word isn't punctuation
                if(!WordFrequencies.has(word)) { //if word hasn't been added yet
                    WordFrequencies.set(word , 1)
                } else { //otherwise increment frequency score
                    let currentFreq = WordFrequencies.get(word)
                    WordFrequencies.set(word, currentFreq + 1 );
        }}}
    });
    return WordFrequencies; 
}

/**
 * 
 * @param {Map} frequencyTable 
 */
const normalizeFrequencyTable = ( frequencyTable ) => {
    const normalizedTable = new Map()
    const maxFrequency = Math.max(...frequencyTable.values());
    frequencyTable.forEach( ( wordFrequency , key ) => { 
        const normalFrequency = wordFrequency / maxFrequency;
        normalizedTable.set( key , normalFrequency );
    })
    return normalizedTable;

}





const summaryCache = new Map();


const summarizeText = ( text , reduceTo ) => { 
    const cacheKey = `${text}_${reduceTo}`;
    if( summaryCache.has(cacheKey) ){
        return summaryCache.get(cacheKey)
    }

    //calculate word frequencies / normalize
    const frequncyTable = normalizeFrequencyTable(getFrequencyTable(text))
    //create sentence tokenizer
    const sentenceTokenizer = new natural.SentenceTokenizer();
    
    //score sentences
    const sentenceTokens = sentenceTokenizer.tokenize(text)
    const SentenceScores = new Map()
    sentenceTokens.forEach( ( sentence ) => { 
        const sent = removeBracketNums( sentence )
        const words = sent.split(" ").map( wrd => wrd.toLowerCase());
        words.forEach( word => { 
            if(frequncyTable.has(word)){
                    if(!SentenceScores.has(sent)){
                        SentenceScores.set(sent , frequncyTable.get(word))
                    } else { 
                        const newScore = SentenceScores.get(sent) + frequncyTable.get(word)
                        SentenceScores.set(sent , newScore )
                    }
            }
        })
    })
    
    
    //build summary with 30% highest scoring sentences
    const summaryLengthMax = Math.floor(sentenceTokens.length * reduceTo)
    
    const unsorted = [...SentenceScores]
    const sorted = unsorted.sort(([key1,val1],[key2,val2]) => (val2 - val1))
    
    const sentenceMapSorted = new Map( sorted )
    // console.log(sentenceMapSorted) 
    
    
    const summary = [] 
    let count = 1
    sentenceMapSorted.forEach( ( score , sent ) => { 
        //check if summary length reached
        if( summary.length >= summaryLengthMax ){
            return;
        }

        summary.push({
            sentence_no: count,
            score: score,
            text: sent,
        });
    
        count+= 1;
    }) 
    
    return summary
    
}

const googleCache = new Map();

/**
 * 
 * @param {*} qry the search query to get   
 * @param {*} n max number of results
 * @returns {Promise<[]>} a list of urls from google search page
 */
 const getGoogleSearchLinks = ( qry , n ) => { 
    /**
     * @param {String} link the url to check 
     * @returns True  || False
     **/
    const isValid = ( link ) => {
        const block = ['/images','%','youtube.com'] 
        let valid = true; 
        //check the block list to make sure link doesn't inlude any of the blocked strings 
        block.forEach( str => {
            if( String(link).includes(str)){
                valid = false;
                return ;
            }
        });
        
        return valid;        
    }
    
    //resolves when we successfully add the appropriate number of links
    //rejects when we have an error
    return new Promise((resolve , reject ) => { 
        const cacheKey = `${qry}${n}`
        if(googleCache.has(cacheKey)){
            return resolve(googleCache.get(cacheKey));
        }
        //store result urls in list
        const resultUrls = []
        
        //options to make Google Search API request via rapidAPI 
        const options = {
            method: 'GET',
            url: 'https://google-search26.p.rapidapi.com/search',
            params: {q:` ${qry}`, hl: 'en', tbs: 'qdr:a'},
            headers: {
                'X-RapidAPI-Host': 'google-search26.p.rapidapi.com',
                'X-RapidAPI-Key': '8fd387603emsh2fa944cfa1adeefp10a9eejsn936a13679f9c'
        }};

        axios.request(options)
        .then(( response ) => {
            let count = 0 , max ;                 
            const results = response.data.results;
                
            //determine max
            n > results.length - 1 
                ? max = results.length - 1 
                : max = n
                
                
            //get urls
            results.forEach( ( result ) => { 
                if( count >=  max ) return; 
                if( isValid(result.link)) {
                    resultUrls.push(result.link);
                    count += 1;
                }

            });
            googleCache.set(cacheKey,resultUrls)
            resolve(resultUrls);
        })
        .catch( ( error ) => { 
            reject(error);
        })
    });   
}

const urlCache = new Map()





const scrapeUrl = ( url ) => { 
    return new Promise( ( resolve , reject ) => { 

        if( urlCache.has(url)){
            console.log('had cache for: ', url)
            return resolve(urlCache.get(url))
        }




        puppeteer.launch()
        .then( async browser => {
            const p = await browser.newPage();
            p.goto(url)
            await p.waitForSelector('body');
            const scraped = await p.evaluate(()=>{
                const selectors = ['p','article','h2','h3','h4','h5']; 
                const body = document.querySelector('body');
                const results = [];
                //for each desired selector add matches in body
                selectors.forEach( (selector) => {
                    body.querySelectorAll(selector).forEach( match => results.push(match.innerText ));

                })


                return results;
            })
            const result = scraped.join("\n");
            urlCache.set(url, result)
            resolve( result )
        }).catch( e => reject( e ));
    })
}




module.exports = { STOPWORDS , getFrequencyTable , summarizeText ,getGoogleSearchLinks , scrapeUrl , normalizeFrequencyTable }
