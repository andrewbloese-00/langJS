class Proxy {
    constructor( url ){
        this.url = url;
    }

    getConfig( requestUrl ){
        return {
            url: requestUrl,
            method: "GET",
            proxy: this.url,
        };
    }
};



const proxyGenerator = () => {
    let ip_addresses = [];
    let port_numbers = [];
    let proxy; 
    axios.get('https://sslproxies.org' , ( error , response , html ) => {
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html);
      
            $("td:nth-child(1)").each(function(index, value) {
              ip_addresses[index] = $(this).text();
            });
      
            $("td:nth-child(2)").each(function(index, value) {
              port_numbers[index] = $(this).text();
            });
          } else {
            console.log("Error loading proxy, please try again");
          }
      
    })
  
    const n = Math.min( ip_addresses.length , port_numbers.length );
    const r = Math.floor( Math.random() * ( n-1 ) );
    const [randomIp,randomPort] = [ip_addresses[r] , port_numbers[r]];
    proxy = `http://${randomIp}:${randomPort}`;
    return new Proxy(proxy);
}     

module.exports = { proxyGenerator };