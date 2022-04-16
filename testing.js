const natural = require('natural');
const nlp = require('compromise');
const axios = require('axios');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');


const proxyGenerator = require('./utilities/proxyGenerator')

const removeBracketNums = text => text.replace(/([^[]+(?=]))/g,"").replace(/\[.*?\]/g,"")




function getFrequencyTable(text){
    const { STOPWORDS } = require('./utilities/lang');
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
    //find the highest frequency in words 
    const maxFrequency = Math.max(...WordFrequencies.values());
    console.log('max frequency' , maxFrequency);
    //normalize the frequency of each word
    // [normal frequency] = [word frequency] / [max frequency]
    WordFrequencies.forEach( ( wordFrequency , key ) => { 
        const normalFrequency = wordFrequency / maxFrequency;
        WordFrequencies.set(key, normalFrequency );
    });
    return WordFrequencies;
}




const summarizeText = ( text , reduceTo) => { 
    //calculate word frequencies / normalize
    const frequncyTable = getFrequencyTable(text)
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
    
    result = ""
    summary.forEach( sent => {
        result +=sent.text
    })
    return summary
    return String(result)
}


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
            console.log(`Does ${link} include ${str}? `)
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
            resolve(resultUrls);
        })
        .catch( ( error ) => { 
            reject(error);
        })
    });   
}


/*
 //first try to scrape with axios and cheerio 
                    axios.get(link)
                        .then(( {data} ) => { 
                            const $ = cheerio.load( data || '')
                            const text = $('body').text()
                            resolve(text)
                        })
                        .catch(( axiosError )=>{ //if axios failed try puppeteer
                            const puppeteer = require('puppeteer')
                            puppeteer.launch()
                                .then( async ( browser) => { 
                                    const page = await browser.newPage();
                                    page.goto(link);
                                    await page.waitForSelector('body')
                                    const scrapePage = await page.evaluate(()=>{
                                        const bodyText = document.querySelector('body').innerText;
                                        return bodyText

                                    })
                                    resolve(scrapePage)

                                })
                                .catch( e => console.error( e )) //failed
                                
                        });










*/


function test( topic ) { 
    const jobs = [] 
    getGoogleSearchLinks( topic , 4 )
        .then( ( results ) => { 
            results.forEach( (url) => { 
                jobs.push(new Promise((resolve , reject )=> {
                    const link = url;
                    puppeteer.launch()
                        .then( async browser => { 
                            const p = await browser.newPage();
                            p.goto(link);
                            await p.waitForSelector('body')

                            

                            const scraped = await p.evaluate( ()=>{

                                const selectors = ['p','h1','h2','h3','h4','h5','span'] 
                                const body = document.querySelector('body')
                                const results = [];
                                //for each desired selector add matches in body
                                selectors.forEach( (selector) => {
                                    body.querySelectorAll(selector).forEach( match => results.push(match.innerText))
                                    
                                })
                                
                                return results
                            })

                            console.log('Text elements found: ', scraped.length );
                            let text = scraped.join("\n")
                          
                            
                        

                            resolve(text)
                        })
                    
                }));//end push
            })//end forEach
        })
        .catch( err => console.error(err))
        .finally(()=>{
           Promise.all(jobs).then(( vals ) => { 
               const research = []
               vals.forEach( val => { 
                   research.push(val);
               })
               console.log(research)
               const text = research.join(". ")
               console.log( summarizeText( text , 0.04 ) ); 
               
                
           })
           .catch( e => e)
        })
}
    


test("Algae Biofuel")

