var system = require('system');
var URL = "";
var arrLinks = ['/'];
var visitedLinks = [];
var maxLinks = 100000;
var debug = false;

if (system.args.length === 1) {
    console.log('Pass the URL of the website as argument to this script!');
    phantom.exit();
} else {
    URL = system.args[1];
    if (system.args.length > 2) {
      maxLinks = system.args[2];
    }
   if (system.args.length > 3) {
     debug = system.args[3];
   }
}

function startChecking(url,callback,arrLinks,visitedLinks) {
var page = require('webpage').create();
  //console.log('Testing URL ' + url + ' ...')
  page.onError = function(msg, trace) {
    if(debug) {
    var msgStack = ['ERROR: ' + msg];
    if (trace && trace.length) {
        msgStack.push('TRACE:');
        trace.forEach(function(t) {
            msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
        });
    }
    console.error(msgStack.join('\n'));
  }
};
  
  page.onResourceReceived = function(response) {
            if(response.status >= 400 && response.status < 500) {
              console.log('HTTP Client Error # ' + response.status + ' while testing URL ' + url +
                           ' with resource ' + response.url);
            }
            if(response.status >= 500 && response.status < 600) {
              console.log('HTTP Server Error # ' + response.status + ' while testing URL ' + url +
                           ' with resource ' + response.url);
            }
          };

          page.open(url, function(status) {
            if(debug) {
              console.log('Testing ' + url);
            }
            if (status !== 'success') {
              console.log('Unable to open (unexpected redirect) at URL ' + url);
            } else {
              var ua = page.evaluate(function() {
                var listofanchortags = document.getElementsByTagName('a');
                var links = Array.prototype.map.call(listofanchortags,function(link,text){
                    return {
                      link : link.getAttribute('href'),
                      text : link.textContent
                    };
                  });
                var filteredlinks = links.filter(function(element){
                  var flag = true;
                  if(element.link === null) {
                    flag = false;
                  }
                  else if(element.link == "/" || element.link == "#" || element.link === "") {
                    flag = false; // filter links to same page
                  }
                  else if(element.link.lastIndexOf("http:") === 0
                          || element.link.lastIndexOf("https:") === 0
                          || element.link.lastIndexOf("mailto:") === 0 
                          || element.link.lastIndexOf("tel:") === 0
                         || element.link.lastIndexOf("//") === 0) {
                    flag = false; // filter external links
                  }
                  return flag;
                });
                filteredlinks = Array.prototype.map.call(filteredlinks,function(ele){
                    return ele.link;
                  });
                return filteredlinks;
                 });
              if(debug) {
                //console.log(JSON.stringify(ua));
              }
              if (visitedLinks.indexOf(url) === -1) {
                  visitedLinks.push(url);
              }
              arrLinks = arrLinks.concat(ua);
              arrLinks = arrLinks.filter(function(ele){return visitedLinks.indexOf(URL+ele) === -1;});
            }
         page.close();
         callback(arrLinks,visitedLinks);
    });
}

function process(arrLinks, visitedLinks) {
//console.log(visitedLinks);
//console.log(arrLinks);
if(arrLinks.length > 0 && maxLinks > 0) {
      var url = URL+arrLinks[0];
      maxLinks--;
      arrLinks.splice(0,1);
      startChecking(url,process,arrLinks,visitedLinks);
}
else {
    phantom.exit();
}
}

process(arrLinks,visitedLinks);