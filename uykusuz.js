var fs       = require("fs"),
    http     = require("http"),
    cheerio  = require("cheerio")

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
      res2.setEncoding('utf8')
      // When data is ready.
      res2.on("data", function(chunk) {
        var $ = cheerio.load(chunk)
        // Get image element and its source.
        var DOMcontext = "div#video_space",
            DOMelement = "img.images[src^='http://www.hepuykusuz.net/upload/']",
            imageSource = $(DOMelement, DOMcontext).attr("src")

        /* If an image is found (returns null in some instances.),
         * Make a request to image URI. */
        if (imageSource) {

          // Check if image is loaded before on a different page.
          if (imagesLoaded.filter(function(e){return e === imageSource}).length) {
            console.log("##### SAME IMAGE")
            // Make another request, as this image has already been visited.
            uykusuz()
            // Skip this image.
            return
          }
          // Save image url to images list.
          imagesLoaded.push(imageSource)

          // Set filename to its original name.
          var fileName = imageSource.replace("http://www.hepuykusuz.net/upload/", ""),
              // Set path for next request.
              path = "/upload/" + fileName,
              // Request options for next request.
              options3 = JSON.parse(JSON.stringify(options2))

          // "/upload/image-title.jpg"
          options3.path = path
          // Make request to image URI.
          var req3 = http.request(options3, function(res3) {
            // File data.
            var file = fs.createWriteStream(fileName)
            // Pipe the file data.
            res3.pipe(file)
            console.log("SAVED:", fileName)
          })

          // Error handling for request 3.
          req3.on('error', function(e) {
            console.log("##### ERROR WITH URL:", err.url)
            // Make another request, as this image couldn't be saved.
            uykusuz()
          })
          // Finish request 3.
          req3.end()
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
