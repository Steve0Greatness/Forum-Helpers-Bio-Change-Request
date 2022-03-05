const store = require("store"),
	request = require("request"),
	cookie = require("cookie-parser"),
	express = require("express"),
	app = express(),
	port = 8080,
	loginLength = 5 * 60 * 1000,
	secret = Buffer.from((port * 20).toString(), "utf-8").toString("base64")

app.set("views", "./views")
app.set("view engine", "ejs")
app.use(express.static("./public"))
app.use(cookie(secret))

app.get("/", (req, res) => {
	if ("user" in req.signedCookies) {
		res.render("index")
		return
	}
	res.render("logedout.ejs")
})

app.get("/login", (req, res) => {
	if (!"privateCode" in req.query) return
	request.get(
		"https://fluffyscratch.hampton.pw/auth/verify/v2/" + req.query.privateCode,
		(err, resp, data) => {
			let body = JSON.parse(data),
				isbad = true,
				check = (link) => {
					request.get(link, (er, rsp, dt) => {
						let bdy = JSON.parse(dt)
						bdy.forEach((user) => {
							if (user.name.toUpperCase() == body.username.toUpperCase()) {
								res.cookie("user", Buffer.from(user.name.toUpperCase(), "utf-8").toString("base64"), { maxAge: loginLength, httponly: true, signed: true, secret: secret })
								isbad = false
							}
						})
					})
				}
			if (body.valid) {
				check("https://theforumhelpers.github.io/forumhelpers/curators.json")
				if (isbad) {
					check("https://theforumhelpers.github.io/forumhelpers/managers.json")
				}
			}
		}
	)
	setTimeout(() => {
		res.redirect("/")
	}, 1000)
})

app.get("/submit", (req, res) => {
	store.set(Buffer.from(req.signedCookies.user, "base64").toString("utf-8"), req.query.body)
	res.redirect("/")
})

app.get("/view-all", (req, res) => {
	let sendObject = {}
	store.each((bio, user) => {
		sendObject[user] = bio
	})
	setTimeout(() => {
		res.render("view-all", { data: sendObject })
	})
})

app.listen(port)