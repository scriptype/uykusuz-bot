// var fs = require("fs"),
//     http = require("http"),
//     cheerio = require("cheerio")
//
// supermizah()
//
// function supermizah() {
//   var options  = {
//       host: 'supermizah.com',
//       port: 80,
//       method: 'POST'
//     }
//
//   var req1 = http.request(options, function(res1) {
//     var data = ""
//
//     res1.setEncoding('utf8')
//
//     res1.on("data", function(chunk) {
//       data += chunk
//     })
//
//     res1.on("end", function() {
//       $ = cheerio.load(data)
//
//       var DOMcontext = "div.grid_8.wrapper",
//           DOMelement = "p img[src^='http://supermizah.com/wp-content/uploads/']"
//
//       var $imageSrc = $(DOMelement, DOMcontext).attr("src"),
//           options2 = JSON.parse(JSON.stringify(options))
//
//       options2.path = $imageSrc.replace("http://supermizah.com", "")
//
//       var req2 = http.request(options2, function(res2) {
//         var fileName = options2.path.replace("/wp-content/uploads/", ""),
//             file = fs.createWriteStream(fileName)
//
//         res2.pipe(file)
//         console.log(fileName, "saved.")
//       })
//
//       req2.on('error', function(e) {
//         console.log('problem with request 2: ' + e.message)
//       })
//
//       req2.end()
//
//     })
//   })
//
//   req1.on('error', function(e) {
//     console.log('problem with request 1: ' + e.message)
//   })
//
//   req1.end()
// }
var fs = require("fs"),
    http = require("http"),
    cheerio = require("cheerio")

var superMizah = new SuperMizah()
superMizah.init()

function SuperMizah () {
  this.targetURI = "supermizah.com"
  this.imagePath = "wp-content/uploads"
  this.limit = Number(process.argv[2]) + 1

  this.mainOptions = {
    host: "http://" + this.targetURI,
    port: 80,
    method: "GET"
  }

  this.init = function () {
    if (!this.limit)
      console.log("the end.")
    else {
      this.mainReq()
      while (--this.limit) {
        console.log(this.limit)
        this.makeRequestToSingle()
      }
    }

  }

  this.mainReq = function () {
    var mainReq = http.request(this.mainOptions, function(res) {
      var data = ""

      res.setEncoding("utf8")

      res.on("data", function(chunk) {
        data += chunk
      })

      res.on("end", function() {
        this.getImageURI(data)
      })
    })

    mainReq.on('error', function(e) {
      console.log('problem with main request:', e.message)
    })

    mainReq.end()
  }

  this.getSingleURI = function (DOM) {
    // return pseudo: cheerio(DOM).find("a")
  }

  this.makeRequestToSingle = function (URI) {

  }

  this.getImageURI = function (data) {
      $ = cheerio.load(data)

      var DOMcontext = "div.grid_8.wrapper",
          DOMelement = "p img[src^='http://supermizah.com/wp-content/uploads/']"

      return $(DOMelement, DOMcontext).attr("src")
  }

  this.getImageOptions = function () {
    var copy = JSON.parse(JSON.stringify(this.mainOptions))
    copy.path = "/" + this.imagePath

    return copy
  }

  this.makeRequestToImage = function (URI) {
    var request = http.request(options2, function(res2) {
      var fileName = options2.path.replace("/wp-content/uploads/", ""),
          file = fs.createWriteStream(fileName)

      resuest.pipe(file)
      console.log(fileName, "saved.")
    })

    request.on('error', function(e) {
      console.log('problem with request 2: ' + e.message)
    })

    request.end()
  }

  this.init()
}
