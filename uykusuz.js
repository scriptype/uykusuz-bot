var fs       = require("fs"),
    http     = require("http"),
    cheerio  = require("cheerio")

var queryNum       = Number(process.argv[2]),
    extraQueryNum  = 0,
    options        = {
      host: 'hepuykusuz.net',
      port: 80,
      method: 'POST'
    },
    locationsVisited = [],
    imagesLoaded = []

const qNum = queryNum

// Call request function as many times as command-line argument.
while (queryNum--)
  uykusuz()

console.log("Waiting for responses...")

function uykusuz() {
  console.log("# Making request #" + (qNum - queryNum + extraQueryNum) +"...")
  // Make request to home page.
  var req = http.request(options, function(res) {
    // Assumption: redirects to an image's single page, save it.
    var location = res.headers.location
    // If no redirection, there should be a server error.
    if (!location) {
      console.log(options.host + " is down.")
      // Deadend.
      return
    }

    // If this location is stumbled before, skip.
    if (_isViewed(location, locationsVisited)) {
      console.log("# URI is already viewed, making a new request.")
      // Make another request, as this page has already been visited.
      extraQueryNum++
      uykusuz()
      // Skip this page.
      return
    }
    // Save location to visiteds list.
    locationsVisited.push(location)

    // Prepare path for next request, easy deep copy.
    var options2 = _easyCopy(options),
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
         * make a request to image URI. */
        if (imageSource) {

          // Check if image is loaded before on a different page.
          if (_isViewed(imageSource, imagesLoaded)) {
            console.log("# Image is viewed before, making a new request.")
            // Make another request, as this image has already been visited.
            extraQueryNum++
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
              options3 = _easyCopy(options2)

          // "/upload/image-title.jpg"
          options3.path = path
          // Make request to image URI.
          var req3 = http.request(options3, function(res3) {
            // File data.
            var file = fs.createWriteStream(fileName)
            // Pipe the file data.
            res3.pipe(file)
            console.log("# Image saved:", fileName)
          })

          // Error handling for request 3.
          req3.on('error', function(e) {
            console.log("# Error with URI:", e.url)
            // Make another request, as this image couldn't be saved.
            extraQueryNum++
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

/*
 *  Utility
 */

function _isViewed (str, arr) {
  return !!arr.filter(function(e) {return e === str}).length
}

function _easyCopy (obj) {
  return JSON.parse(JSON.stringify(obj))
}
