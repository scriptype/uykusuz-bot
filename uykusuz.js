var fs       = require("fs"),
    http     = require("http"),
    httpReq  = require("http-request")

var queryNum  = Number(process.argv[2]),
    options  = {
      host: 'hepuykusuz.net',
      port: 80,
      method: 'POST'
    },
    locationsVisited = [],
    imagesLoaded = [],
    imagesSaved = []

// Call request function as many times as command-line argument.
while (queryNum--)
  uykusuz()

function uykusuz() {
  // Make request to home page.
  var req = http.request(options, function(res) {
    // Assumption: redirects to an image's single page, save it.
    var location = res.headers.location
    // If no redirection, there should be a server error.
    if (!location)
      throw "hepuykusuz.net is down."

    // If this location is stumbled before, skip.
    if (locationsVisited.filter(function(e) {return e === location}).length) {
      console.log("##### SAME LOCATION")
      // Make another request, as this page has already been visited.
      uykusuz()
      // Skip this page.
      return
    }
    // Save location to visiteds list.
    locationsVisited.push(location)

    // Prepare path for next request, easy deep copy.
    var options2 = JSON.parse(JSON.stringify(options)),
        // Change path to redirected url.
        path = location.replace("http://www.hepuykusuz.net", "")
    // Add path variable to second request's options.
    options2.path = path

    // Make request to redirected url.
    var req2 = http.request(options2, function(res2) {
      // Prepare buffer for reading.
      res2.setEncoding('utf8');
      // When data is ready.
      res2.on("data", function(chunk) {
        // Match main image (extension part isnt included for easy regex).
        // TODO: Use cheerio instead of regex for parsing HTML.
        var imageMatched = chunk.match(/http:\/\/www.hepuykusuz.net\/upload\/([A-Za-z0-9-]+)/gi)

        /* If an image is found (returns null in some instances.),
         * continue on making a request to image */
        if (imageMatched) {

          // Check if image is loaded before on a different page.
          if (imagesLoaded.filter(function(e){return e === imageMatched[0]}).length) {
            console.log("##### SAME IMAGE")
            // Make another request, as this image has already been visited.
            uykusuz()
            // Skip this image.
            return
          }
          // Save image url to images list.
          imagesLoaded.push(imageMatched[0])

          // Append extension to url.
          var imageURI = imageMatched[0] + ".jpg",
              // http-request module's options format.
              options3 = {url: imageURI},
              // Set filename to its original name.
              fileName = imageURI.replace("http://www.hepuykusuz.net/upload/", "")

          // Make a get request to image with http-request module.
          var req3 = httpReq.get(options3, fileName, function(err, res3) {
            // Console.log if error.
            if (err) {
              console.log("##### ERROR WITH URL:", err.url)
              // Make another request, as this image couldn't be saved.
              uykusuz()
            }
            // If no error, log it also.
            else {
              imagesSaved.push(res3.file)
              console.log("SAVED:", res3.file)
            }
          })

        }

      })
    })

    // Error handling of request to redirect url.
    req2.on('error', function(e) {
      console.log('problem with request 2: ' + e.message)
    })
    // Finish connection.
    req2.end()
  });

  // Error handling of request to home page.
  req.on('error', function(e) {
    console.log('problem with request 1: ' + e.message)
  })
  // Finish connection.
  req.end()
}
