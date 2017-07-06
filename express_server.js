const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true})); //this is middleware

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
}

app.use(function(req, res, next){
  res.locals.username = req.cookies.username;
  next();
});

function generateRandomString() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(let i = 0; i < 6; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

app.get('/', (request,response)=> {
  response.json(urlDatabase);
});

app.get('/urls', (request, response) => {
  let templateVars = { urls: urlDatabase };
  response.render('urls_index', templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
                        longURL: urlDatabase[req.params.id],
                     };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  const randString = generateRandomString();
  urlDatabase[randString] = req.body.longURL;
  console.log(req.body);  // debug statement to see POST parameters
  res.redirect(`urls/${randString}`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id", (request, response) => {
  urlDatabase[request.params.id] = request.body.longURL;
  response.redirect("/urls");
});

app.post("/login", (request,response) => {
  response.cookie('username', request.body.username);
  response.redirect("/urls")
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/logout", (request, response) => {
  response.clearCookie("username");
  response.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`TinyApp server listening on port ${PORT}`);
});
