const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const cookieSession = require('cookie-session');
const bcrypt = require("bcrypt");
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(cookieSession({
  name: 'session',
  keys: ["HELLOILIKEAPPLES"],
  maxAge: 24 * 60 * 60 * 1000
}));

app.use(bodyParser.urlencoded({extended: true})); //this is middleware

var urlDatabase = {
  "b2xVn2": { longURL : "http://www.lighthouselabs.ca", userID : "userRandomID" },
  "9sm5xK": { longURL : "http://www.google.com", userID : "user2RandomID" }
}

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "dinosaur",
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}
//middleware
app.use(function(req, res, next){
  res.locals.user = users[req.session.user_id];
  next();
});

function checkUserLogin(req, res, next) {
  if(req.session.user_id) {
    next();
  } else {
    res.status(401).send("UNAUTHORIZED: Must be logged in to view this page <br><a href='/login'>Login</a>");
  }
}

function checkUserLink(req, res, next) {
  if(req.session.user_id === urlDatabase[req.params.id].userID) {
    next();
  } else {
    res.status(403).send("FORBIDDEN: You do not have access to view this page. <br><a href='/login'>Login</a>");
  }
}

function generateRandomString() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for(let i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function checkUser(email) {
  for(id in users) {
    if(email == users[id].email) {
      return true;
    }
  }
  return false;
}

function getUser(email) {
  for(id in users) {
    if(email == users[id].email) {
      return users[id];
    }
  }
  return undefined;
}

app.get('/', (req,res)=> {
  res.json(urlDatabase);
});

app.get('/urls', checkUserLogin, (req, res) => {
  let userURL = {};
  for(item in urlDatabase) {
    if(req.session.user_id === urlDatabase[item].userID) {
      userURL[item] = urlDatabase[item];
    }
  }
  let templateVars = { urls: userURL };
  res.render('urls_index', templateVars);

});

app.get("/urls/new", checkUserLogin, (req, res) => {
  if(res.locals.user === undefined) {
    res.redirect("/login");
  } else {
    res.render("urls_new");
  }
});

app.get("/urls/:id",checkUserLogin, checkUserLink, (req, res) => {
  let templateVars = { shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", checkUserLogin, (req, res) => {
  const randString = generateRandomString();
  let longURL = req.body.longURL;
  if(!/^https?:\/\//.test(req.body.longURL)) {
    longURL = "http://"+longURL;
  }
  urlDatabase[randString] = {
    longURL,
    userID : req.session.user_id
  };
  console.log(req.body, res.locals.user.id);  // debug statement to see POST parameters
  res.redirect(`urls/${randString}`);
});

app.post("/urls/:id/delete", checkUserLogin, checkUserLink, (req, res) => {
  if(req.session.user_id === urlDatabase[req.params.id].userID) {
    delete urlDatabase[req.params.id];
  }
  res.redirect("/urls");
});

app.post("/urls/:id", checkUserLogin, checkUserLink, (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req,res) => {
  const {email, password} = req.body;
  const user = getUser(email);
  if(!user) {
    res.status(403).send("User does not exist. Please register")
  } else {
    if (bcrypt.compareSync(password, user.hashedPassword)) {
      req.session.user_id = user.id;
      res.redirect("/urls");
    } else {
      res.redirect("/login");
    }
  }
  //res.session.user_id = user.id;
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  if(!longURL) {
    res.status(404).send("Page not found!");
    return
  }
  res.redirect(longURL.longURL);
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/login",(req, res) => {
  res.render("login");
})

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  let randomString = generateRandomString();
  const {email, password} = req.body;
  if (!email || !password) {
    res.status(400).send("Your email or password were missing!");
  } else if (checkUser(email)) {
    res.status(400).send("The email address you entered is already registered.");
  } else {
    users[randomString] = {
      id : randomString,
      email : email,
      hashedPassword : bcrypt.hashSync(password, 10)
    }
    req.session.user_id = randomString;
    res.redirect("/urls");
  }
});


app.listen(PORT, () => {
  console.log(`TinyApp server listening on port ${PORT}`);
});
